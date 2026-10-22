import { NotFoundException } from '@nestjs/common'
import { Queue } from 'bullmq'
import { SubscribersService } from './subscribers.service'
import { PrismaService } from '../prisma/prisma.service'

/**
 * Unit tests for the Phase 7 subscriber lifecycle.
 * Registered status is inferred from an account matching the email:
 * subscribe upserts the subscriber with that status, tagRegistered promotes
 * a guest to registered, and both paths queue a Resend audience sync.
 */
describe('SubscribersService', () => {
  const userDelegate = { findUnique: jest.fn() }
  const subscriberDelegate = {
    findUnique: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  }
  const queue = { add: jest.fn() }
  const prisma = {
    client: { user: userDelegate, subscriber: subscriberDelegate },
  }
  let service: SubscribersService

  type SubscriberRecord = {
    email: string
    tags: string[]
    active: boolean
    userId?: string | null
  }

  /** Holds the subscriber record the double below works on. */
  type SubscriberDouble = { record: SubscriberRecord | null }

  beforeEach(() => {
    jest.resetAllMocks()
    service = new SubscribersService(
      prisma as unknown as PrismaService,
      queue as unknown as Queue,
    )
  })

  /**
   * In-memory Subscriber double. It applies Prisma's `set`/`push` tag writes to
   * the record, so a test asserts the tags a subscriber ends up with instead
   * of the shape of the write.
   */
  function fakeSubscriber(existing: SubscriberRecord | null): SubscriberDouble {
    const double: SubscriberDouble = { record: existing }

    subscriberDelegate.findUnique.mockImplementation(
      async ({ where }: { where: { email: string } }) =>
        double.record?.email === where.email ? double.record : null,
    )

    subscriberDelegate.upsert.mockImplementation(
      async ({
        create,
        update,
      }: {
        create: SubscriberRecord
        update: {
          userId?: string | null
          tags?: { set?: string | string[]; push?: string | string[] }
          active?: boolean
        }
      }) => {
        if (!double.record) {
          double.record = { ...create }
          return double.record
        }

        const record = double.record
        if (update.tags?.set !== undefined) {
          record.tags = Array.isArray(update.tags.set)
            ? [...update.tags.set]
            : [update.tags.set]
        } else if (update.tags?.push !== undefined) {
          const pushed = Array.isArray(update.tags.push)
            ? update.tags.push
            : [update.tags.push]
          record.tags = [...record.tags, ...pushed]
        }
        if (update.userId !== undefined) record.userId = update.userId
        if (update.active !== undefined) record.active = update.active

        return record
      },
    )

    return double
  }

  // The tags are the subscriber's history, not a status flag: the plan amends
  // them (ensure 'registered', swap 'guest') and never replaces them, so a
  // 'vip' tag written by the order flow survives a re-subscribe.
  describe('subscribe', () => {
    it('creates a guest subscriber for an unknown email (trimming + lowercasing)', async () => {
      userDelegate.findUnique.mockResolvedValue(null)
      const subscriber = fakeSubscriber(null)

      await service.subscribe({ email: '  Ada@Example.COM ' })

      expect(subscriber.record).toEqual({
        email: 'ada@example.com',
        userId: null,
        tags: ['guest'],
        active: true,
      })
      expect(queue.add).toHaveBeenCalledWith('sync-resend-contact', {
        email: 'ada@example.com',
      })
    })

    it('leaves the tags of an existing subscriber alone when a guest re-subscribes', async () => {
      userDelegate.findUnique.mockResolvedValue(null)
      // §10.1.1 — an existing subscriber is re-activated, so seed it inactive.
      const subscriber = fakeSubscriber({
        email: 'ada@example.com',
        tags: ['guest', 'vip'],
        active: false,
      })

      await service.subscribe({ email: 'ada@example.com' })

      expect(subscriber.record?.tags).toEqual(['guest', 'vip'])
      expect(subscriber.record?.active).toBe(true)
    })

    it('creates a registered subscriber for an authenticated user without a subscriber row', async () => {
      userDelegate.findUnique.mockResolvedValue({
        id: 'usr_1',
        email: 'ada@example.com',
      })
      const subscriber = fakeSubscriber(null)

      await service.subscribe({ email: 'ada@example.com' })

      expect(subscriber.record).toEqual({
        email: 'ada@example.com',
        userId: 'usr_1',
        tags: ['registered'],
        active: true,
      })
    })

    it('keeps the existing tags and ensures "registered" for an authenticated subscriber', async () => {
      userDelegate.findUnique.mockResolvedValue({
        id: 'usr_1',
        email: 'ada@example.com',
      })
      const subscriber = fakeSubscriber({
        email: 'ada@example.com',
        tags: ['vip'],
        active: true,
      })

      await service.subscribe({ email: 'ada@example.com' })

      expect([...(subscriber.record?.tags ?? [])].sort()).toEqual([
        'registered',
        'vip',
      ])
      expect(subscriber.record?.userId).toBe('usr_1')
    })

    it('keeps the "guest" tag and adds "registered" for an authenticated subscriber', async () => {
      userDelegate.findUnique.mockResolvedValue({
        id: 'usr_1',
        email: 'ada@example.com',
      })
      const subscriber = fakeSubscriber({
        email: 'ada@example.com',
        tags: ['guest'],
        active: true,
      })

      await service.subscribe({ email: 'ada@example.com' })

      // §10.1.2 only ensures "registered" is present; swapping "guest" for
      // "registered" is §10.1.3's job, on account creation.
      // Sorted, because the order of the tags carries no meaning.
      expect([...(subscriber.record?.tags ?? [])].sort()).toEqual([
        'guest',
        'registered',
      ])
    })

    it('does not duplicate the "registered" tag', async () => {
      userDelegate.findUnique.mockResolvedValue({
        id: 'usr_1',
        email: 'ada@example.com',
      })
      const subscriber = fakeSubscriber({
        email: 'ada@example.com',
        tags: ['registered', 'vip'],
        active: true,
      })

      await service.subscribe({ email: 'ada@example.com' })

      expect([...(subscriber.record?.tags ?? [])].sort()).toEqual([
        'registered',
        'vip',
      ])
    })
  })

  describe('tagRegistered', () => {
    it('replaces the guest tag with registered and keeps every other tag', async () => {
      const subscriber = fakeSubscriber({
        email: 'ada@example.com',
        tags: ['guest', 'vip'],
        active: true,
      })

      await service.tagRegistered('usr_1', 'ada@example.com')

      expect([...(subscriber.record?.tags ?? [])].sort()).toEqual([
        'registered',
        'vip',
      ])
      expect(subscriber.record?.userId).toBe('usr_1')
      expect(queue.add).toHaveBeenCalledWith('sync-resend-contact', {
        email: 'ada@example.com',
      })
    })

    it('ensures "registered" for a subscriber without the guest tag', async () => {
      const subscriber = fakeSubscriber({
        email: 'ada@example.com',
        tags: ['registered', 'vip'],
        active: true,
      })

      await service.tagRegistered('usr_1', 'ada@example.com')

      expect([...(subscriber.record?.tags ?? [])].sort()).toEqual([
        'registered',
        'vip',
      ])
    })

    it('creates a registered subscriber when none exists', async () => {
      const subscriber = fakeSubscriber(null)

      await service.tagRegistered('usr_1', 'ada@example.com')

      expect(subscriber.record).toEqual({
        email: 'ada@example.com',
        userId: 'usr_1',
        tags: ['registered'],
        active: true,
      })
      expect(queue.add).toHaveBeenCalledWith('sync-resend-contact', {
        email: 'ada@example.com',
      })
    })
  })

  describe('findAll', () => {
    it('filters by tag and paginates using the products meta shape', async () => {
      subscriberDelegate.findMany.mockResolvedValueOnce([])
      subscriberDelegate.count.mockResolvedValueOnce(21)

      const result = await service.findAll({ tag: 'vip', page: 2, limit: 20 })

      expect(subscriberDelegate.findMany).toHaveBeenCalledWith({
        where: { tags: { has: 'vip' } },
        orderBy: { createdAt: 'desc' },
        skip: 20,
        take: 20,
      })
      expect(result.meta).toEqual({
        total: 21,
        page: 2,
        limit: 20,
        totalPages: 2,
      })
    })

    it('builds a case-insensitive email search', async () => {
      subscriberDelegate.findMany.mockResolvedValueOnce([])
      subscriberDelegate.count.mockResolvedValueOnce(0)

      await service.findAll({ q: '  ADA@example.com ' })

      expect(subscriberDelegate.findMany).toHaveBeenCalledWith({
        where: { email: { contains: 'ADA@example.com', mode: 'insensitive' } },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      })
    })

    it('restricts to archived subscribers when active is the string false', async () => {
      subscriberDelegate.findMany.mockResolvedValueOnce([])
      subscriberDelegate.count.mockResolvedValueOnce(0)

      await service.findAll({ active: 'false' })

      expect(subscriberDelegate.findMany).toHaveBeenCalledWith({
        where: { active: false },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      })
    })
  })

  describe('countByState', () => {
    it('returns totals plus per-tag counts', async () => {
      subscriberDelegate.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8) // active
        .mockResolvedValueOnce(3) // guest
        .mockResolvedValueOnce(4) // registered
        .mockResolvedValueOnce(2) // vip

      await expect(service.countByState()).resolves.toEqual({
        total: 10,
        active: 8,
        inactive: 2,
        guest: 3,
        registered: 4,
        vip: 2,
      })
    })
  })

  describe('setActive', () => {
    it('throws NotFoundException for an unknown email', async () => {
      subscriberDelegate.findUnique.mockResolvedValueOnce(null)

      await expect(
        service.setActive('ghost@example.com', false),
      ).rejects.toBeInstanceOf(NotFoundException)
      expect(subscriberDelegate.update).not.toHaveBeenCalled()
      expect(queue.add).not.toHaveBeenCalled()
    })

    it('skips the write and the sync when the flag is already correct', async () => {
      subscriberDelegate.findUnique.mockResolvedValueOnce({
        id: 'sub_1',
        email: 'ada@example.com',
        active: false,
      })

      const result = await service.setActive('ada@example.com', false)

      expect(result.active).toBe(false)
      expect(subscriberDelegate.update).not.toHaveBeenCalled()
      expect(queue.add).not.toHaveBeenCalled()
    })

    it('normalizes the email, flips the flag, and queues a sync', async () => {
      subscriberDelegate.findUnique.mockResolvedValueOnce({
        id: 'sub_1',
        email: 'ada@example.com',
        active: true,
        tags: ['registered'],
      })
      subscriberDelegate.update.mockResolvedValueOnce({
        id: 'sub_1',
        active: false,
      })

      const result = await service.setActive('  Ada@Example.COM ', false)

      expect(subscriberDelegate.findUnique).toHaveBeenCalledWith({
        where: { email: 'ada@example.com' },
      })
      expect(subscriberDelegate.update).toHaveBeenCalledWith({
        where: { email: 'ada@example.com' },
        data: { active: false },
      })
      expect(queue.add).toHaveBeenCalledWith('sync-resend-contact', {
        email: 'ada@example.com',
      })
      expect(result.active).toBe(false)
    })

    it('keeps tag history untouched on reactivate', async () => {
      subscriberDelegate.findUnique.mockResolvedValueOnce({
        id: 'sub_1',
        email: 'ada@example.com',
        active: false,
        tags: ['registered', 'vip'],
      })
      subscriberDelegate.update.mockResolvedValueOnce({
        id: 'sub_1',
        active: true,
      })

      await service.setActive('ada@example.com', true)

      expect(subscriberDelegate.update).toHaveBeenCalledWith({
        where: { email: 'ada@example.com' },
        data: { active: true },
      })
    })
  })
})
