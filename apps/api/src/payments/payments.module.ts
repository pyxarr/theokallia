import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { PaymentsService } from './payments.service'
import { PaymentsController } from './payments.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { OrdersModule } from '../orders/orders.module'

@Module({
  imports: [
    PrismaModule, 
    OrdersModule,
    BullModule.registerQueue({
      name: 'mail',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: true,
      },
    }),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
