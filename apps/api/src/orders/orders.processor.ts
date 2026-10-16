import { Logger } from '@nestjs/common'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { PrismaService } from '../prisma/prisma.service'
import { OrdersService } from './orders.service'
import { CouponsService } from '../coupons/coupons.service'
import { Prisma } from '@prisma/client'

@Processor('orders')
export class OrdersProcessor extends WorkerHost {
  private readonly logger = new Logger(OrdersProcessor.name)

  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
    private couponsService: CouponsService,
  ) {
    super()
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'cleanup-reservation':
        return this.handleReservationExpiry(job.data.orderId)
      default:
        this.logger.warn(`Unknown job name: ${job.name}`)
    }
  }

  private async handleReservationExpiry(orderId: string) {
    this.logger.log(`Checking reservation expiry for order ${orderId}`)

    // Atomically cancel only if still pending — returns null if already not pending
    // (P2025 = record not found with that where clause)
    let cancelledOrder
    try {
      cancelledOrder = await this.prisma.client.order.update({
        where: { id: orderId, status: 'pending' },
        data: { status: 'cancelled' },
      })
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        // Another worker already cancelled it, or order was paid/shipped
        this.logger.log(`Order ${orderId} no longer pending — skipping cleanup`)
        return
      }
      throw err
    }

    if (!cancelledOrder) return

    this.logger.log(`Order ${orderId} expired. Cancelling and releasing stock.`)

    // Only one worker reaches here — safe to clean up
    await this.prisma.client.$transaction(async (tx) => {
      // Release stock reservations
      await tx.stockReservation.deleteMany({
        where: { orderId },
      })

      // Rollback coupon usage if a coupon was applied
      if (cancelledOrder.couponId) {
        await tx.couponUse.deleteMany({
          where: { orderId },
        })

        await tx.coupon.update({
          where: { id: cancelledOrder.couponId },
          data: { usedCount: { decrement: 1 } },
        })
      }
    })
  }
}
