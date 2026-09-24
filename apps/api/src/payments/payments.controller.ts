import { Controller, Post, Get, Body, Param, Headers, Query, Req } from '@nestjs/common'
import { PaymentsService } from './payments.service'
import { Request } from 'express'

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Initializes a payment for a specific order.
   */
  @Post('initialize/:orderId')
  async initialize(@Param('orderId') orderId: string) {
    const { paystackData, email, amount } = await this.paymentsService.initializePayment(orderId)
    return {
      ...paystackData,
      email,
      amount,
      publicKey: process.env.PAYSTACK_PUBLIC_KEY,
    }
  }

  /**
   * Verifies a payment via reference (called from frontend callback).
   */
  @Get('verify')
  async verify(@Query('reference') reference: string) {
    return this.paymentsService.verifyPayment(reference)
  }

  /**
   * Webhook endpoint for Paystack notifications.
   */
  @Post('webhook')
  async webhook(
    @Req() req: Request,
    @Body() payload: any,
    @Headers('x-paystack-signature') signature: string,
  ) {
    const rawBody = (req as any).rawBody as string
    await this.paymentsService.handleWebhook(payload, signature, rawBody)
    return { status: 'success' }
  }
}
