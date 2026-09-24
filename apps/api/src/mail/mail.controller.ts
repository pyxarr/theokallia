import { Controller, Get, Query } from '@nestjs/common'
import { MailService } from './mail.service'

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  /**
   * Test endpoint to verify email sending.
   * Usage: GET /api/mail/test?email=your@email.com
   */
  @Get('test')
  async testEmail(@Query('email') email: string) {
    if (!email) {
      return { error: 'Email query parameter is required' }
    }

    await this.mailService.sendEmail({
      to: email,
      subject: 'Test Email from Theokallia',
      html: '<p>This is a test email to verify the Resend integration!</p>',
    })

    return { success: true, message: `Test email sent to ${email}` }
  }
}
