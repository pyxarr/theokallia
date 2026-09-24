import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { Logger } from '@nestjs/common'
import { render } from 'react-email'
import {
  VerificationEmail,
  ResetPasswordEmail,
  OrderConfirmationEmail,
  ShippingUpdateEmail,
  VipNotificationEmail,
} from '@theokallia/emails'
import { MailService } from './mail.service'

interface LinkJobData {
  email: string
  url: string
  firstName: string
}

interface OrderConfirmationJobData {
  email: string
  firstName: string
  orderId: string
  total: number
  subtotal: number
  discount: number
  shippingFee: number
  shippingAddress: {
    street: string
    city: string
    state: string
    country: string
  }
  items: { name: string; quantity: number; price: number }[]
}

interface VipNotificationJobData {
  customerName: string
  customerEmail: string
  totalOrders: number
  totalSpend: number
  dateAchieved: string
}

interface ShippingUpdateJobData {
  email: string
  firstName: string
  orderId: string
  trackingNumber: string
}

// Processes all jobs on the 'mail' queue
// BullMQ automatically retries failed jobs with backoff
// Concurrency limited to avoid overwhelming Resend rate limits
@Processor('mail', { concurrency: 5 })
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
          case 'send-shipping-update':
            await this.handleSendShippingUpdate(job as Job<ShippingUpdateJobData>)
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
    const html = await render(VerificationEmail({ firstName: job.data.firstName, url: job.data.url }))
    await this.mailService.sendEmail({
      to: job.data.email,
      subject: 'Verify your Theokallia email',
      html,
    })
  }

  private async handleSendResetPassword(job: Job<LinkJobData>): Promise<void> {
    const html = await render(ResetPasswordEmail({ firstName: job.data.firstName, url: job.data.url }))
    await this.mailService.sendEmail({
      to: job.data.email,
      subject: 'Reset your Theokallia password',
      html,
    })
  }

  private async handleSendOrderConfirmation(job: Job<OrderConfirmationJobData>): Promise<void> {
    const html = await render(
      OrderConfirmationEmail({
        firstName: job.data.firstName,
        orderId: job.data.orderId,
        items: job.data.items,
        subtotal: job.data.subtotal,
        discount: job.data.discount,
        shippingFee: job.data.shippingFee,
        total: job.data.total,
        shippingAddress: job.data.shippingAddress,
      }),
    )
    await this.mailService.sendEmail({
      to: job.data.email,
      subject: 'Order Confirmed - THEOKALLIA',
      html,
    })
  }

  private async handleSendVipNotification(job: Job<VipNotificationJobData>): Promise<void> {
    const adminEmail = process.env.ADMIN_ALERT_EMAIL ?? 'hello@theokallia.com'
    const html = await render(
      VipNotificationEmail({
        customerName: job.data.customerName,
        customerEmail: job.data.customerEmail,
        totalOrders: job.data.totalOrders,
        totalSpend: job.data.totalSpend,
        dateAchieved: job.data.dateAchieved,
      }),
    )
    await this.mailService.sendEmail({
      to: adminEmail,
      subject: 'New VIP Customer - THEOKALLIA',
      html,
    })
  }

  private async handleSendShippingUpdate(job: Job<ShippingUpdateJobData>): Promise<void> {
    const html = await render(
      ShippingUpdateEmail({
        firstName: job.data.firstName,
        orderId: job.data.orderId,
        trackingNumber: job.data.trackingNumber,
      }),
    )
    await this.mailService.sendEmail({
      to: job.data.email,
      subject: 'Your Order Has Shipped - THEOKALLIA',
      html,
    })
  }
}
