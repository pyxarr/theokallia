import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'

export interface AudienceContactInput {
  email: string
  firstName?: string | null
  lastName?: string | null
  unsubscribed: boolean
}

/**
 * Wraps the Resend contact endpoints for audience sync.
 * Uses the audienceId form of the API (deprecated in Resend v6 in favour of
 * segments, but still supported) so the RESEND_AUDIENCE_ID config stays valid.
 * Sync is best-effort: any failure is logged and reported as false so the
 * calling job does not retry forever on a misconfiguration.
 */
@Injectable()
export class ResendAudienceProvider {
  private readonly logger = new Logger(ResendAudienceProvider.name)
  private readonly resend: Resend

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'))
  }

  private get audienceId(): string | undefined {
    return this.config.get<string>('RESEND_AUDIENCE_ID') || undefined
  }

  /**
   * Creates a contact in the configured audience, falling back to an update
   * when the contact already exists. Returns false when no audience is
   * configured or both calls fail.
   */
  async upsertContact(input: AudienceContactInput): Promise<boolean> {
    const audienceId = this.audienceId

    if (!audienceId) {
      this.logger.warn('RESEND_AUDIENCE_ID not set - skipping Resend audience sync')
      return false
    }

    const names = {
      ...(input.firstName ? { firstName: input.firstName } : {}),
      ...(input.lastName ? { lastName: input.lastName } : {}),
    }

    const created = await this.resend.contacts.create({
      audienceId,
      email: input.email,
      unsubscribed: input.unsubscribed,
      ...names,
    })

    if (!created.error) {
      return true
    }

    // The contact may already exist — fall back to an update keyed by email
    const updated = await this.resend.contacts.update({
      audienceId,
      email: input.email,
      unsubscribed: input.unsubscribed,
      ...names,
    })

    if (!updated.error) {
      return true
    }

    this.logger.error(`Resend audience sync failed for ${input.email}: ${updated.error.message}`)
    return false
  }
}
