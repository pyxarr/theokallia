import { Logger } from '@nestjs/common'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { PrismaService } from '../prisma/prisma.service'
import { OrdersService } from './orders.service'
import { CouponsService } from '../coupons/coupons.service'

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

    const order = await this.prisma.client.order.findUnique({
      where: { id: orderId },
    })

    if (!order) return

    if (order.status === 'pending') {
      this.logger.log(`Order ${orderId} expired. Cancelling and releasing stock.`)

      await this.prisma.client.$transaction(async (tx) => {
        // Cancel the order
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'cancelled' },
        })

        // Release stock reservations
        await tx.stockReservation.deleteMany({
          where: { orderId },
        })

        // Rollback coupon usage if a coupon was applied
        if (order.couponId) {
          await tx.couponUse.deleteMany({
            where: { orderId },
          })

          await tx.coupon.update({
            where: { id: order.couponId },
            data: { usedCount: { decrement: 1 } },
          })
        }
      })
    }
  }
}
