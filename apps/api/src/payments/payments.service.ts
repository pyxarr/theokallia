import { Injectable, BadRequestException, InternalServerErrorException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { OrdersService } from '../orders/orders.service'
import * as crypto from 'crypto'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'

@Injectable()
export class PaymentsService {
  private readonly paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
  private readonly paystackBaseUrl = 'https://api.paystack.co'

  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
    @InjectQueue('mail') private mailQueue: Queue,
  ) {}

  /**
   * Initializes a Paystack transaction for a given order.
   */
  async initializePayment(orderId: string) {
    const order = await this.prisma.client.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    })

    if (!order) {
      throw new BadRequestException('Order not found')
    }

    if (order.status === 'paid') {
      throw new BadRequestException('Order is already paid')
    }

    const response = await fetch(`${this.paystackBaseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: order.user?.email,
        amount: order.total * 100, // Paystack expects amount in kobo/cents
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
        metadata: {
          orderId: order.id,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new InternalServerErrorException(data.message || 'Failed to initialize payment')
    }

    return {
      paystackData: data.data,
      email: order.user?.email,
      amount: order.total * 100,
    }
  }

  /**
   * Verifies a payment using the Paystack reference.
   */
  async verifyPayment(reference: string) {
    const response = await fetch(`${this.paystackBaseUrl}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.paystackSecretKey}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new InternalServerErrorException(data.message || 'Payment verification failed')
    }

    if (data.data.status !== 'success') {
      throw new BadRequestException('Payment was not successful')
    }

    const orderId = data.data.metadata.orderId
    await this.handlePaymentSuccess(orderId)

    return data.data
  }


  /**
   * Handles the Paystack webhook notification.
   */
  async handleWebhook(payload: any, signature: string, rawBody: string) {
    if (!this.verifySignature(signature, rawBody)) {
      throw new ForbiddenException('Invalid Paystack signature')
    }

    const event = payload.event
    if (event === 'charge.success') {
      const orderId = payload.data.metadata.orderId
      await this.handlePaymentSuccess(orderId)
    }
  }

  /**
   * Internal helper to mark order as paid and trigger confirmation email.
   */
  private async handlePaymentSuccess(orderId: string) {
    const order = await this.prisma.client.order.findUnique({
      where: { id: orderId },
      include: { 
        user: true, 
        items: { include: { product: true } } 
      },
    })

    if (!order) {
      throw new BadRequestException('Order not found')
    }

    if (order.status === 'paid') {
      return // Already processed
    }

    await this.ordersService.markAsPaid(orderId)

    // Queue the confirmation email
    await this.mailQueue.add('send-order-confirmation', {
      email: order.user?.email,
      firstName: order.user?.name?.split(' ')[0] ?? 'there',
      orderId: order.id,
      total: order.total,
      subtotal: order.total - order.shippingFee + order.discount,
      discount: order.discount,
      shippingFee: order.shippingFee,
      shippingAddress: order.shippingAddress ?? { street: '', city: '', state: '', country: '' },
      items: order.items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price
      })),
    })
  }

  /**
   * Verifies the Paystack HMAC signature.
   */
  private verifySignature(signature: string, rawBody: string): boolean {
    const hash = crypto
      .createHmac('sha512', this.paystackSecretKey!)
      .update(rawBody)
      .digest('hex')

    return hash === signature
  }
}
