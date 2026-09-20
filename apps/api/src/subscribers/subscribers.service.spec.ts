import { Queue } from 'bullmq'
import { SubscribersService } from './subscribers.service'
import { PrismaService } from '../prisma/prisma.service'

/**
 * Unit tests for the Phase 7 subscriber lifecycle.
 * Registered status is inferred from an account matching the email, tags are
 * never duplicated, and every create/tag change queues a Resend audience sync.
 */
describe('SubscribersService', () => {
  const userDelegate = { findUnique: jest.fn() }
  const subscriberDelegate = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  }
  const queue = { add: jest.fn() }
  const prisma = { client: { user: userDelegate, subscriber: subscriberDelegate } }
  let service: SubscribersService

  beforeEach(() => {
    jest.resetAllMocks()
    service = new SubscribersService(prisma as unknown as PrismaService, queue as unknown as Queue)
  })

  describe('subscribe', () => {
    it('creates a guest subscriber for an unknown email (trimming + lowercasing)', async () => {
      userDelegate.findUnique.mockResolvedValue(null)
      subscriberDelegate.findUnique.mockResolvedValue(null)

      await service.subscribe({ email: '  Ada@Example.COM ' })

      expect(subscriberDelegate.create).toHaveBeenCalledWith({
        data: { email: 'ada@example.com', userId: null, tags: ['guest'], active: true },
      })
      expect(queue.add).toHaveBeenCalledWith('sync-resend-contact', { email: 'ada@example.com' })
    })

    it('creates a registered subscriber when an account already exists', async () => {
      userDelegate.findUnique.mockResolvedValue({ id: 'usr_1', email: 'ada@example.com' })
      subscriberDelegate.findUnique.mockResolvedValue(null)

      await service.subscribe({ email: 'ada@example.com' })

      expect(subscriberDelegate.create).toHaveBeenCalledWith({
        data: { email: 'ada@example.com', userId: 'usr_1', tags: ['registered'], active: true },
      })
    })

    it('promotes and reactivates an existing guest once an account exists', async () => {
      userDelegate.findUnique.mockResolvedValue({ id: 'usr_1', email: 'ada@example.com' })
      subscriberDelegate.findUnique.mockResolvedValue({
        id: 'sub_1',
        email: 'ada@example.com',
        userId: null,
        tags: ['guest'],
        active: false,
      })

      await service.subscribe({ email: 'ada@example.com' })

      expect(subscriberDelegate.update).toHaveBeenCalledWith({
        where: { email: 'ada@example.com' },
        data: { userId: 'usr_1', tags: ['registered'], active: true },
      })
      expect(queue.add).toHaveBeenCalled()
    })

    it('is a no-op for an already registered, active subscriber', async () => {
      userDelegate.findUnique.mockResolvedValue({ id: 'usr_1', email: 'ada@example.com' })
      subscriberDelegate.findUnique.mockResolvedValue({
        id: 'sub_1',
        email: 'ada@example.com',
        userId: 'usr_1',
        tags: ['registered'],
        active: true,
      })

      await service.subscribe({ email: 'ada@example.com' })

      expect(subscriberDelegate.update).not.toHaveBeenCalled()
      expect(queue.add).not.toHaveBeenCalled()
    })
  })

  describe('tagRegistered', () => {
    it('converts a guest subscriber to registered and links the user', async () => {
      subscriberDelegate.findUnique.mockResolvedValue({
        id: 'sub_1',
        email: 'ada@example.com',
        userId: null,
        tags: ['guest'],
        active: true,
      })

      await service.tagRegistered('usr_1', 'ada@example.com')

      expect(subscriberDelegate.update).toHaveBeenCalledWith({
        where: { email: 'ada@example.com' },
        data: { userId: 'usr_1', tags: ['registered'] },
      })
      expect(queue.add).toHaveBeenCalledWith('sync-resend-contact', { email: 'ada@example.com' })
    })

    it('creates a registered subscriber when none exists', async () => {
      subscriberDelegate.findUnique.mockResolvedValue(null)

      await service.tagRegistered('usr_1', 'ada@example.com')

      expect(subscriberDelegate.create).toHaveBeenCalledWith({
        data: { email: 'ada@example.com', userId: 'usr_1', tags: ['registered'], active: true },
      })
    })

    it('preserves a vip tag when promoting a guest', async () => {
      subscriberDelegate.findUnique.mockResolvedValue({
        id: 'sub_1',
        email: 'ada@example.com',
        userId: null,
        tags: ['guest', 'vip'],
        active: true,
      })

      await service.tagRegistered('usr_1', 'ada@example.com')

      const tags = subscriberDelegate.update.mock.calls[0][0].data.tags
      expect(tags).toEqual(expect.arrayContaining(['registered', 'vip']))
      expect(tags).not.toContain('guest')
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
      expect(result.meta).toEqual({ total: 21, page: 2, limit: 20, totalPages: 2 })
    })
  })
})
