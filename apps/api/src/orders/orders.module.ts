import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { OrdersService } from './orders.service'
import { OrdersController } from './orders.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { OrdersProcessor } from './orders.processor'
import { CouponsModule } from '../coupons/coupons.module'
import { ShippingZonesModule } from './shipping-zones/shipping-zones.module'

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'orders',
    }),
    CouponsModule,
    ShippingZonesModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersProcessor],
  exports: [OrdersService],
})
export class OrdersModule {}
