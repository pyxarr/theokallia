import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { SubscribersController } from './subscribers.controller'
import { SubscribersService } from './subscribers.service'
import { SubscribersProcessor } from './subscribers.processor'
import { ResendAudienceProvider } from './providers/resend-audience.provider'

/**
 * SubscribersModule owns the newsletter list: public signup, admin listing,
 * registration tagging, and the background Resend audience sync.
 * PrismaModule is @Global(), so it is not imported here.
 */
@Module({
  imports: [BullModule.registerQueue({ name: 'subscribers' })],
  controllers: [SubscribersController],
  providers: [SubscribersService, SubscribersProcessor, ResendAudienceProvider],
  exports: [SubscribersService],
})
export class SubscribersModule {}
