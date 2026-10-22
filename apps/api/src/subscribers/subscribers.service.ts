import { Injectable, NotFoundException } from '@nestjs/common'
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

    const user = await this.prisma.client.user.findUnique({ where: { email } })

    // §10.1.2 — an authenticated submit keeps the tags the subscriber already
    // carries and makes sure 'registered' is one of them.
    const existing = user
      ? await this.prisma.client.subscriber.findUnique({ where: { email } })
      : null
    const tags = user
      ? this.ensureTag(existing?.tags ?? [], 'registered')
      : ['guest']

    await this.prisma.client.subscriber.upsert({
      where: { email },
      create: {
        email,
        userId: user?.id ?? null,
        tags,
        active: true,
      },
      update: {
        userId: user?.id ?? null,
        active: true,
        // §10.1.1 — a guest submit only ensures active, so the tags stay as
        // they are. undefined leaves the field untouched.
        tags: user ? { set: tags } : undefined,
      },
    })

    await this.enqueueSync(email)
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

    // §10.1.3 — a guest is promoted to "registered"; every other tag stays.
    const tags = this.ensureTag(
      (existing?.tags ?? []).filter((tag) => tag !== 'guest'),
      'registered',
    )

    await this.prisma.client.subscriber.upsert({
      where: { email: normalized },
      create: { email: normalized, userId, tags, active: true },
      update: { userId, tags: { set: tags } },
    })

    await this.enqueueSync(normalized)
  }

  /**
   * Returns a paginated subscriber list, optionally filtered by a single tag
   * and/or a case-insensitive email search. Pagination mirrors the products listing.
   */
  async findAll(filters: FilterSubscribersDto) {
    const { tag, q, active, page = 1, limit = 20 } = filters
    const skip = (page - 1) * limit
    const search = q?.trim()

    const where = {
      ...(tag ? { tags: { has: tag } } : {}),
      ...(search
        ? { email: { contains: search, mode: 'insensitive' as const } }
        : {}),
      ...(active !== undefined ? { active: active === 'true' } : {}),
    }

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

  /** Active, inactive, and per-tag totals for the newsletter tab badges. */
  async countByState() {
    const [total, active, guest, registered, vip] = await Promise.all([
      this.prisma.client.subscriber.count(),
      this.prisma.client.subscriber.count({ where: { active: true } }),
      this.prisma.client.subscriber.count({
        where: { tags: { has: 'guest' } },
      }),
      this.prisma.client.subscriber.count({
        where: { tags: { has: 'registered' } },
      }),
      this.prisma.client.subscriber.count({ where: { tags: { has: 'vip' } } }),
    ])

    return { total, active, inactive: total - active, guest, registered, vip }
  }

  /**
   * Admin archive/reactivate for a subscriber. Setting active=false removes
   * them from sends; the Resend sync picks it up and marks the contact
   * unsubscribed. Tags are engine-managed — this endpoint only flips the flag,
   * so a reactivated record keeps its existing tag set.
   */
  async setActive(email: string, active: boolean) {
    const normalized = email.trim().toLowerCase()

    const subscriber = await this.prisma.client.subscriber.findUnique({
      where: { email: normalized },
    })

    if (!subscriber) {
      throw new NotFoundException('Subscriber not found')
    }

    if (subscriber.active === active) {
      return subscriber
    }

    const updated = await this.prisma.client.subscriber.update({
      where: { email: normalized },
      data: { active },
    })

    await this.enqueueSync(normalized)

    return updated
  }

  /**
   * Admin archive/reactivate by subscriber ID.
   */
  async setActiveById(id: string, active: boolean) {
    const subscriber = await this.prisma.client.subscriber.findUnique({
      where: { id },
    })

    if (!subscriber) {
      throw new NotFoundException('Subscriber not found')
    }

    if (subscriber.active === active) {
      return subscriber
    }

    const updated = await this.prisma.client.subscriber.update({
      where: { id },
      data: { active },
    })

    await this.enqueueSync(subscriber.email)

    return updated
  }

  /** Queues a Resend audience sync for a subscriber email. */
  private async enqueueSync(email: string) {
    await this.subscribersQueue.add('sync-resend-contact', { email })
  }

  /** Returns the tags with `tag` included, without duplicating it. */
  private ensureTag(tags: string[], tag: string): string[] {
    return tags.includes(tag) ? tags : [...tags, tag]
  }

  /** Order-insensitive comparison of two tag arrays. */
  private sameTags(a: string[], b: string[]) {
    if (a.length !== b.length) return false
    const set = new Set(a)
    return b.every((tag) => set.has(tag))
  }
}
