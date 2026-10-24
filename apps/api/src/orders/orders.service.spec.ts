import { Queue } from 'bullmq'
import { OrdersService } from './orders.service'
import { PrismaService } from '../prisma/prisma.service'
import { CouponsService } from '../coupons/coupons.service'
import { SiteConfigService } from '../site-config/site-config.service'

/**
 * Unit tests for the Phase 6 VIP evaluation that runs after an order is paid.
 * Qualification is met by EITHER the order-count or the lifetime-spend
 * threshold from SiteConfig. Already-VIP and below-threshold customers must
 * produce no side effects.
 */
describe('OrdersService — VIP evaluation', () => {
  const tx = {
    order: { findUnique: jest.fn(), update: jest.fn() },
    product: { update: jest.fn() },
    stockReservation: { deleteMany: jest.fn() },
  }
  const orderDelegate = { aggregate: jest.fn() }
  const userDelegate = { findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() }
  const subscriberDelegate = { findUnique: jest.fn(), upsert: jest.fn() }
  const ordersQueue = { add: jest.fn() }
  const mailQueue = { add: jest.fn() }
  const siteConfigService = { get: jest.fn() }

  type SubscriberRecord = {
    email: string
    tags: string[]
    active: boolean
    userId?: string | null
  }

  const prisma = {
    client: {
      $transaction: jest.fn(),
      order: orderDelegate,
      user: userDelegate,
      subscriber: subscriberDelegate,
    },
  }

  let service: OrdersService

  const baseUser = {
    id: 'usr_1',
    email: 'ada@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    isVip: false,
  }

  beforeEach(() => {
    jest.resetAllMocks()

    prisma.client.$transaction.mockImplementation(
      (cb: (t: typeof tx) => unknown) => cb(tx),
    )

    // updateMany returns { count: 1 } by default (promotion succeeds)
    userDelegate.updateMany.mockResolvedValue({ count: 1 })

    service = new OrdersService(
      prisma as unknown as PrismaService,
      ordersQueue as unknown as Queue,
      mailQueue as unknown as Queue,
      { validateCoupon: jest.fn() } as unknown as CouponsService,
      siteConfigService as unknown as SiteConfigService,
    )

    siteConfigService.get.mockResolvedValue({
      vipOrderThreshold: 3,
      vipSpendThreshold: 200000,
    })
  })

  /**
   * In-memory Subscriber double. It applies Prisma's `set`/`push` tag writes to
   * the record, so a test asserts the tags a subscriber ends up with instead
   * of the shape of the write.
   */
  function fakeSubscriber(existing: SubscriberRecord | null) {
    const state: { record: SubscriberRecord | null } = { record: existing }

    subscriberDelegate.findUnique.mockImplementation(
      async ({ where }: { where: { email: string } }) =>
        state.record?.email === where.email ? state.record : null,
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
        }
      }) => {
        if (!state.record) {
          state.record = { ...create }
          return state.record
        }

        const record = state.record
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

        return record
      },
    )

    return state
  }

  it('enqueues the VIP evaluation when an order is paid', async () => {
    tx.order.findUnique.mockResolvedValue({
      id: 'ord_1',
      userId: 'usr_1',
      reservations: [],
    })
    tx.order.update.mockResolvedValue({
      id: 'ord_1',
      userId: 'usr_1',
      status: 'paid',
    })

    await service.markAsPaid('ord_1')

    expect(ordersQueue.add).toHaveBeenCalledWith('evaluate-vip', {
      userId: 'usr_1',
    })
  })

  it('promotes a customer who reaches the order-count threshold', async () => {
    userDelegate.findUnique.mockResolvedValue(baseUser)
    orderDelegate.aggregate.mockResolvedValue({
      _count: { _all: 3 },
      _sum: { total: 30000 },
    })
    const subscriber = fakeSubscriber(null)

    await service.evaluateVip('usr_1')

    expect(userDelegate.updateMany).toHaveBeenCalledWith({
      where: { id: 'usr_1', isVip: false },
      data: { isVip: true, vipSince: expect.any(Date) },
    })
    expect(mailQueue.add).toHaveBeenCalledWith(
      'send-vip-notification',
      expect.objectContaining({
        customerName: 'Ada Lovelace',
        customerEmail: 'ada@example.com',
        totalOrders: 3,
        totalSpend: 30000,
      }),
    )
    expect(subscriber.record).toEqual({
      email: 'ada@example.com',
      userId: 'usr_1',
      tags: ['registered', 'vip'],
      active: true,
    })
  })

  it('promotes a customer who reaches the spend threshold', async () => {
    userDelegate.findUnique.mockResolvedValue(baseUser)
    orderDelegate.aggregate.mockResolvedValue({
      _count: { _all: 1 },
      _sum: { total: 250000 },
    })

    await service.evaluateVip('usr_1')

    expect(userDelegate.updateMany).toHaveBeenCalled()
    expect(mailQueue.add).toHaveBeenCalledWith(
      'send-vip-notification',
      expect.objectContaining({ totalOrders: 1, totalSpend: 250000 }),
    )
  })

  it('appends the vip tag to the subscriber instead of replacing its tags', async () => {
    userDelegate.findUnique.mockResolvedValue(baseUser)
    orderDelegate.aggregate.mockResolvedValue({
      _count: { _all: 1 },
      _sum: { total: 250000 },
    })
    const subscriber = fakeSubscriber({
      email: 'ada@example.com',
      tags: ['registered', 'guest'],
      active: true,
    })

    await service.evaluateVip('usr_1')

    expect([...(subscriber.record?.tags ?? [])].sort()).toEqual([
      'guest',
      'registered',
      'vip',
    ])
  })

  it('does not add a second vip tag to a subscriber who already has one', async () => {
    userDelegate.findUnique.mockResolvedValue(baseUser)
    orderDelegate.aggregate.mockResolvedValue({
      _count: { _all: 1 },
      _sum: { total: 250000 },
    })
    const subscriber = fakeSubscriber({
      email: 'ada@example.com',
      tags: ['registered', 'vip'],
      active: true,
    })

    await service.evaluateVip('usr_1')

    expect([...(subscriber.record?.tags ?? [])].sort()).toEqual([
      'registered',
      'vip',
    ])
  })

  it('does nothing when the customer is already VIP', async () => {
    userDelegate.findUnique.mockResolvedValue({ ...baseUser, isVip: true })

    await service.evaluateVip('usr_1')

    expect(orderDelegate.aggregate).not.toHaveBeenCalled()
    expect(userDelegate.update).not.toHaveBeenCalled()
    expect(mailQueue.add).not.toHaveBeenCalled()
    expect(subscriberDelegate.upsert).not.toHaveBeenCalled()
  })

  it('does nothing below both thresholds', async () => {
    userDelegate.findUnique.mockResolvedValue(baseUser)
    orderDelegate.aggregate.mockResolvedValue({
      _count: { _all: 1 },
      _sum: { total: 5000 },
    })

    await service.evaluateVip('usr_1')

    expect(userDelegate.update).not.toHaveBeenCalled()
    expect(mailQueue.add).not.toHaveBeenCalled()
    expect(subscriberDelegate.upsert).not.toHaveBeenCalled()
  })

  it('reads the VIP thresholds from the site config service', async () => {
    siteConfigService.get.mockResolvedValue({
      vipOrderThreshold: 1,
      vipSpendThreshold: 1000000,
    })
    userDelegate.findUnique.mockResolvedValue(baseUser)
    orderDelegate.aggregate.mockResolvedValue({
      _count: { _all: 1 },
      _sum: { total: 30000 },
    })

    await service.evaluateVip('usr_1')

    expect(siteConfigService.get).toHaveBeenCalled()
    expect(userDelegate.updateMany).toHaveBeenCalledWith({
      where: { id: 'usr_1', isVip: false },
      data: { isVip: true, vipSince: expect.any(Date) },
    })
  })

  it('handles concurrent promotion — only one worker sends email and tags subscriber', async () => {
    // Simulate two workers calling evaluateVip concurrently.
    // The first updateMany returns count: 1 (winner), second returns count: 0 (loser).
    userDelegate.findUnique.mockResolvedValue(baseUser)
    orderDelegate.aggregate.mockResolvedValue({
      _count: { _all: 3 },
      _sum: { total: 30000 },
    })

    // First call — winner
    userDelegate.updateMany.mockResolvedValueOnce({ count: 1 })
    await service.evaluateVip('usr_1')

    // Second call — loser (simulate another worker)
    userDelegate.updateMany.mockResolvedValueOnce({ count: 0 })
    await service.evaluateVip('usr_1')

    // Winner sends email and tags subscriber
    expect(mailQueue.add).toHaveBeenCalledTimes(1)
    expect(subscriberDelegate.upsert).toHaveBeenCalledTimes(1)

    // Loser does nothing — no second email, no second tag
    expect(mailQueue.add).not.toHaveBeenCalledTimes(2)
    expect(subscriberDelegate.upsert).not.toHaveBeenCalledTimes(2)
  })
})
