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
    }),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
