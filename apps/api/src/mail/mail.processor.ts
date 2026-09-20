import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { Logger } from '@nestjs/common'
import { MailService } from './mail.service'

interface LinkJobData {
  email: string
  url: string
}

interface OrderConfirmationJobData {
  email: string
  orderId: string
  total: number
  items: { name: string; quantity: number }[]
}

interface VipNotificationJobData {
  customerName: string
  customerEmail: string
  totalOrders: number
  totalSpend: number
  dateAchieved: string
}

// Processes all jobs on the 'mail' queue
// BullMQ automatically retries failed jobs with backoff
@Processor('mail')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name)

  constructor(private mailService: MailService) {
    super()
  }

  async process(job: Job): Promise<void> {
      this.logger.log(`Processing job: ${job.name}`)
      try {
        switch (job.name) {
          case 'send-verification-email':
            await this.handleSendVerificationEmail(job as Job<LinkJobData>)
            break
          case 'send-reset-password':
            await this.handleSendResetPassword(job as Job<LinkJobData>)
            break
          case 'send-order-confirmation':
            await this.handleSendOrderConfirmation(job as Job<OrderConfirmationJobData>)
            break
          case 'send-vip-notification':
            await this.handleSendVipNotification(job as Job<VipNotificationJobData>)
            break
          default:
            throw new Error(`Unknown job name: ${job.name}`)
        }
      this.logger.log(`Job ${job.name} completed successfully`)
    } catch (err) {
      this.logger.error(`Job ${job.name} failed:`, err)
      throw err
    }
  }

  private async handleSendVerificationEmail(
    job: Job<LinkJobData>,
  ): Promise<void> {
    await this.mailService.sendEmail({
      to: job.data.email,
      subject: 'Verify your Theokallia email',
      html: `
        <div style="font-family: serif; max-width: 480px; margin: 0 auto;">
          <h2 style="letter-spacing: 0.2em;">THEOKALLIA</h2>
          <p>Click the link below to verify your email address:</p>
          <a href="${job.data.url}" style="color: #7E22CE;">Verify my email</a>
          <p>This link expires in 1 hour.</p>
          <p>If you did not create an account, please ignore this email.</p>
        </div>
      `,
    })
  }

  private async handleSendResetPassword(job: Job<LinkJobData>): Promise<void> {
    await this.mailService.sendEmail({
      to: job.data.email,
      subject: 'Reset your Theokallia password',
      html: `
        <div style="font-family: serif; max-width: 480px; margin: 0 auto;">
          <h2 style="letter-spacing: 0.2em;">THEOKALLIA</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${job.data.url}" style="color: #7E22CE;">Reset my password</a>
          <p>This link expires in 1 hour.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    })
  }

  private async handleSendOrderConfirmation(job: Job<OrderConfirmationJobData>): Promise<void> {
    const itemsList = job.data.items
      .map((item) => `<li>${item.quantity}x ${item.name}</li>`)
      .join('')

    await this.mailService.sendEmail({
      to: job.data.email,
      subject: 'Order Confirmed - THEOKALLIA',
      html: `
        <div style="font-family: serif; max-width: 480px; margin: 0 auto;">
          <h2 style="letter-spacing: 0.2em;">THEOKALLIA</h2>
          <p>Thank you for your order! We have received your payment and are preparing your pieces.</p>
          <p><strong>Order ID:</strong> ${job.data.orderId}</p>
          <p><strong>Total:</strong> ${job.data.total}</p>
          <p><strong>Items:</strong></p>
          <ul>${itemsList}</ul>
          <p>We will notify you once your order has been shipped.</p>
        </div>
      `,
    })
  }

  private async handleSendVipNotification(job: Job<VipNotificationJobData>): Promise<void> {
    const adminEmail = process.env.ADMIN_ALERT_EMAIL ?? 'hello@theokallia.com'

    await this.mailService.sendEmail({
      to: adminEmail,
      subject: 'New VIP Customer - THEOKALLIA',
      html: `
        <div style="font-family: serif; max-width: 480px; margin: 0 auto;">
          <h2 style="letter-spacing: 0.2em;">THEOKALLIA</h2>
          <p>A customer has qualified for VIP status.</p>
          <p><strong>Name:</strong> ${job.data.customerName}</p>
          <p><strong>Email:</strong> ${job.data.customerEmail}</p>
          <p><strong>Qualifying orders:</strong> ${job.data.totalOrders}</p>
          <p><strong>Lifetime spend:</strong> ₦${job.data.totalSpend.toLocaleString()}</p>
          <p><strong>Achieved:</strong> ${job.data.dateAchieved}</p>
        </div>
      `,
    })
  }
}
