import { Logger } from '@nestjs/common'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { PrismaService } from '../prisma/prisma.service'
import { SubscribersService } from './subscribers.service'
import { ResendAudienceProvider } from './providers/resend-audience.provider'

interface TagRegisteredJobData {
  userId: string
  email: string
}

interface SyncContactJobData {
  email: string
}

/**
 * Processes subscriber lifecycle jobs.
 * `tag-registered-subscriber` is produced by the Better Auth registration hook
 * (which lives outside Nest DI); `sync-resend-contact` mirrors a subscriber to
 * the Resend audience.
 */
@Processor('subscribers')
export class SubscribersProcessor extends WorkerHost {
  private readonly logger = new Logger(SubscribersProcessor.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscribersService: SubscribersService,
    private readonly resendAudience: ResendAudienceProvider,
  ) {
    super()
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'tag-registered-subscriber':
        return this.handleTagRegistered(job as Job<TagRegisteredJobData>)
      case 'sync-resend-contact':
        return this.handleSyncContact(job as Job<SyncContactJobData>)
      default:
        this.logger.warn(`Unknown job name: ${job.name}`)
    }
  }

  private async handleTagRegistered(job: Job<TagRegisteredJobData>): Promise<void> {
    await this.subscribersService.tagRegistered(job.data.userId, job.data.email)
  }

  private async handleSyncContact(job: Job<SyncContactJobData>): Promise<void> {
    const subscriber = await this.prisma.client.subscriber.findUnique({
      where: { email: job.data.email },
    })

    if (!subscriber) {
      return
    }

    const user = subscriber.userId
      ? await this.prisma.client.user.findUnique({ where: { id: subscriber.userId } })
      : null

    await this.resendAudience.upsertContact({
      email: subscriber.email,
      firstName: user?.firstName ?? null,
      lastName: user?.lastName ?? null,
      unsubscribed: !subscriber.active,
    })
  }
}
