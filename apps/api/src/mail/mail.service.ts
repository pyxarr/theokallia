import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ResendProvider } from './providers/resend.provider'
import { EmailPayload } from './providers/email-provider.interface'

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)

  constructor(
    private config: ConfigService,
    private resendProvider: ResendProvider,
  ) {}

  /**
   * Sends an email using the Resend provider.
   */
  async sendEmail(payload: EmailPayload): Promise<void> {
    this.logger.log(`Attempting to send email to ${payload.to} via Resend...`)
    try {
      await this.resendProvider.send(payload)
      this.logger.log(`Email successfully sent to ${payload.to}`)
    } catch (error) {
      this.logger.error(`Resend failure for ${payload.to}: ${error.message}`)
      throw new InternalServerErrorException(`Failed to send email via Resend: ${error.message}`)
    }
  }
}
