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
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  }
  const queue = { add: jest.fn() }
  const prisma = {
    client: { user: userDelegate, subscriber: subscriberDelegate },
  }
  let service: SubscribersService

  beforeEach(() => {
    jest.resetAllMocks()
    service = new SubscribersService(
      prisma as unknown as PrismaService,
      queue as unknown as Queue,
    )
  })

  // The four cases in this block are `it.failing` on purpose. `subscribe`
  // writes `tags: { set: [...] }`, which REPLACES the whole tag array, so a
  // re-subscribe drops every tag the subscriber already carried (e.g. 'vip').
  // Plan §10.1.1/§10.1.2 amend the tags instead: keep the existing ones and
  // ensure 'registered' is among them. Task 6 ("Subscriber tags survive a
  // re-subscribe") fixes the service — flip these back to `it` once it lands.
  describe('subscribe', () => {
    it.failing(
      'creates a guest subscriber for an unknown email (trimming + lowercasing)',
      async () => {
        userDelegate.findUnique.mockResolvedValue(null)
        subscriberDelegate.upsert.mockResolvedValue({
          id: 'sub_1',
          email: 'ada@example.com',
          tags: ['guest'],
          active: true,
        })

        await service.subscribe({ email: '  Ada@Example.COM ' })

        expect(subscriberDelegate.upsert).toHaveBeenCalledWith({
          where: { email: 'ada@example.com' },
          create: {
            email: 'ada@example.com',
            userId: null,
            tags: ['guest'],
            active: true,
          },
          // Plan §10.1.1: an existing subscriber keeps its tags, only
          // `active` is ensured.
          update: {
            userId: null,
            active: true,
          },
        })
        expect(queue.add).toHaveBeenCalledWith('sync-resend-contact', {
          email: 'ada@example.com',
        })
      },
    )

    it.failing(
      'creates a registered subscriber when an account already exists',
      async () => {
        userDelegate.findUnique.mockResolvedValue({
          id: 'usr_1',
          email: 'ada@example.com',
        })
        subscriberDelegate.upsert.mockResolvedValue({
          id: 'sub_1',
          email: 'ada@example.com',
          tags: ['registered'],
          active: true,
        })

        await service.subscribe({ email: 'ada@example.com' })

        expect(subscriberDelegate.upsert).toHaveBeenCalledWith({
          where: { email: 'ada@example.com' },
          create: {
            email: 'ada@example.com',
            userId: 'usr_1',
            tags: ['registered'],
            active: true,
          },
          // Plan §10.1.2: keep the existing tags, ensure 'registered' is one
          // of them.
          update: {
            userId: 'usr_1',
            tags: { push: 'registered' },
            active: true,
          },
        })
      },
    )

    it.failing(
      'promotes and reactivates an existing guest once an account exists',
      async () => {
        userDelegate.findUnique.mockResolvedValue({
          id: 'usr_1',
          email: 'ada@example.com',
        })

        await service.subscribe({ email: 'ada@example.com' })

        expect(subscriberDelegate.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            update: {
              userId: 'usr_1',
              tags: { push: 'registered' },
              active: true,
            },
          }),
        )
        expect(queue.add).toHaveBeenCalled()
      },
    )

    it.failing(
      're-affirms an already registered, active subscriber in a single upsert',
      async () => {
        userDelegate.findUnique.mockResolvedValue({
          id: 'usr_1',
          email: 'ada@example.com',
        })

        await service.subscribe({ email: 'ada@example.com' })

        expect(subscriberDelegate.update).not.toHaveBeenCalled()
        expect(subscriberDelegate.upsert).toHaveBeenCalledTimes(1)
        expect(subscriberDelegate.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            update: {
              userId: 'usr_1',
              tags: { push: 'registered' },
              active: true,
            },
          }),
        )
      },
    )
  })

  describe('tagRegistered', () => {
    it('converts a guest subscriber to registered and links the user', async () => {
      await service.tagRegistered('usr_1', 'ada@example.com')

      expect(subscriberDelegate.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: {
            userId: 'usr_1',
            tags: { push: 'registered' },
          },
        }),
      )
      // Only guests are promoted. The tags written are pinned by the failing
      // case below — they must keep every tag except 'guest'.
      expect(subscriberDelegate.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'ada@example.com', tags: { has: 'guest' } },
        }),
      )
      expect(queue.add).toHaveBeenCalledWith('sync-resend-contact', {
        email: 'ada@example.com',
      })
    })

    it('creates a registered subscriber when none exists', async () => {
      await service.tagRegistered('usr_1', 'ada@example.com')

      expect(subscriberDelegate.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: {
            email: 'ada@example.com',
            userId: 'usr_1',
            tags: ['registered'],
            active: true,
          },
        }),
      )
    })

    // DEFECT (Task 6): promoting a guest replaces the whole tag array, so
    // every other tag the subscriber carried (e.g. 'vip') is dropped along
    // with 'guest'. Plan §10.1.3 swaps the 'guest' tag for 'registered' and
    // keeps the rest. Task 6 ("Subscriber tags survive a re-subscribe") fixes
    // the service — flip this back to `it` once it lands.
    it.failing(
      'replaces the guest tag with registered and keeps every other tag when promoting a guest',
      async () => {
        const guest = {
          id: 'sub_1',
          email: 'ada@example.com',
          tags: ['guest', 'vip'],
          active: true,
        }
        // The service has to read the current tags to amend them.
        subscriberDelegate.findUnique.mockResolvedValue(guest)
        subscriberDelegate.findFirst.mockResolvedValue(guest)
        subscriberDelegate.findMany.mockResolvedValue([guest])

        await service.tagRegistered('usr_1', 'ada@example.com')

        expect(subscriberDelegate.updateMany).toHaveBeenCalledWith({
          where: { email: 'ada@example.com', tags: { has: 'guest' } },
          data: {
            tags: { set: expect.arrayContaining(['registered', 'vip']) },
          },
        })
        expect(subscriberDelegate.updateMany).toHaveBeenCalledWith({
          where: { email: 'ada@example.com', tags: { has: 'guest' } },
          data: { tags: { set: expect.not.arrayContaining(['guest']) } },
        })
      },
    )
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
