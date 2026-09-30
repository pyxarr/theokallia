import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { MailProcessor } from './mail.processor'
import { MailService } from './mail.service'
import { MailController } from './mail.controller'
import { ResendProvider } from './providers/resend.provider'

@Module({
  imports: [
    // Register the mail queue
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
  controllers: [MailController],
  providers: [
    MailProcessor,
    MailService,
    ResendProvider
  ],
  exports: [MailService],
})
export class MailModule { }

