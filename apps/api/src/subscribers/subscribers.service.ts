import { Injectable } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { PrismaService } from '../prisma/prisma.service'
import { SubscribeDto } from './dto/subscribe.dto'
import { FilterSubscribersDto } from './dto/filter-subscribers.dto'

@Injectable()
export class SubscribersService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('subscribers') private readonly subscribersQueue: Queue,
  ) {}

  /**
   * Adds an email to the newsletter list and queues an audience sync.
   * Registered status is inferred from a matching account, so a visitor and a
   * logged-in customer share one endpoint. Idempotent — always resolves the
   * same way whether or not the email was already subscribed.
   */
  async subscribe(dto: SubscribeDto) {
    const email = dto.email.trim().toLowerCase()

    const [user, existing] = await Promise.all([
      this.prisma.client.user.findUnique({ where: { email } }),
      this.prisma.client.subscriber.findUnique({ where: { email } }),
    ])

    if (!existing) {
      await this.prisma.client.subscriber.create({
        data: {
          email,
          userId: user?.id ?? null,
          tags: [user ? 'registered' : 'guest'],
          active: true,
        },
      })
      await this.enqueueSync(email)
      return
    }

    const tags = new Set(existing.tags)

    if (user) {
      // an account now exists for this email — promote it out of "guest"
      tags.delete('guest')
      tags.add('registered')
    } else if (tags.size === 0) {
      tags.add('guest')
    }

    const nextTags = [...tags]
    const userId = user?.id ?? existing.userId
    const changed =
      userId !== existing.userId ||
      !existing.active ||
      !this.sameTags(existing.tags, nextTags)

    if (changed) {
      await this.prisma.client.subscriber.update({
        where: { email },
        data: { userId, tags: nextTags, active: true },
      })
      await this.enqueueSync(email)
    }
  }

  /**
   * Marks a subscriber as a registered customer after account creation.
   * Converts a prior "guest" tag to "registered" and links the user id.
   */
  async tagRegistered(userId: string, email: string) {
    const normalized = email.trim().toLowerCase()

    const existing = await this.prisma.client.subscriber.findUnique({
      where: { email: normalized },
    })

    if (!existing) {
      await this.prisma.client.subscriber.create({
        data: { email: normalized, userId, tags: ['registered'], active: true },
      })
      await this.enqueueSync(normalized)
      return
    }

    const tags = new Set(existing.tags)
    tags.delete('guest')
    tags.add('registered')

    await this.prisma.client.subscriber.update({
      where: { email: normalized },
      data: { userId, tags: [...tags] },
    })
    await this.enqueueSync(normalized)
  }

  /**
   * Returns a paginated subscriber list, optionally filtered by a single tag.
   * Pagination shape mirrors the products listing.
   */
  async findAll(filters: FilterSubscribersDto) {
    const { tag, page = 1, limit = 20 } = filters
    const skip = (page - 1) * limit
    const where = tag ? { tags: { has: tag } } : {}

    const [data, total] = await Promise.all([
      this.prisma.client.subscriber.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.client.subscriber.count({ where }),
    ])

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /** Queues a Resend audience sync for a subscriber email. */
  private async enqueueSync(email: string) {
    await this.subscribersQueue.add('sync-resend-contact', { email })
  }

  /** Order-insensitive comparison of two tag arrays. */
  private sameTags(a: string[], b: string[]) {
    if (a.length !== b.length) return false
    const set = new Set(a)
    return b.every((tag) => set.has(tag))
  }
}
