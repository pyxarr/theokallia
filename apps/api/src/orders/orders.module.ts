import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { OrdersService } from './orders.service'
import { OrdersController } from './orders.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { OrdersProcessor } from './orders.processor'
import { CouponsModule } from '../coupons/coupons.module'
import { ShippingZonesModule } from './shipping-zones/shipping-zones.module'
import { SiteConfigModule } from '../site-config/site-config.module'

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue(
      { 
        name: 'orders',
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
          removeOnFail: true,
        },
      },
      { 
        name: 'mail',
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
          removeOnFail: true,
        },
      },
    ),
    CouponsModule,
    ShippingZonesModule,
    SiteConfigModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersProcessor],
  exports: [OrdersService],
})
export class OrdersModule { }
