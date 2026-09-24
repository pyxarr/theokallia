import { Injectable } from '@nestjs/common'
import { Resend } from 'resend'
import { EmailProvider, EmailPayload } from './email-provider.interface'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class ResendProvider implements EmailProvider {
  private resend: Resend

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'))
  }

  async send(payload: EmailPayload): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data, error } = await this.resend.emails.send({
      from: this.config.get<string>('MAIL_FROM')!,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    })

    if (error) {
      throw new Error(`Resend error: ${error.message}`)
    }
  }
}
