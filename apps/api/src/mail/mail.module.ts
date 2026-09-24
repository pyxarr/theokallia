import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { MailProcessor } from './mail.processor'
import { MailService } from './mail.service'
import { MailController } from './mail.controller'
import { ResendProvider } from './providers/resend.provider'

@Module({
  imports: [
    // Register the mail queue — backed by Upstash Redis
    BullModule.registerQueue({
      name: 'mail',
    }),
  ],
  controllers: [MailController],
  providers: [
    MailProcessor, 
    MailService, 
    ResendProvider
  ],
  exports: [MailService],
})
export class MailModule {}

