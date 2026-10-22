import { Queue } from 'bullmq'
import { OrdersService } from './orders.service'
import { PrismaService } from '../prisma/prisma.service'
import { CouponsService } from '../coupons/coupons.service'

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
  const userDelegate = { findUnique: jest.fn(), update: jest.fn() }
  const siteConfigDelegate = { findUnique: jest.fn() }
  const subscriberDelegate = { upsert: jest.fn() }
  const ordersQueue = { add: jest.fn() }
  const mailQueue = { add: jest.fn() }

  const prisma = {
    client: {
      $transaction: jest.fn(),
      order: orderDelegate,
      user: userDelegate,
      siteConfig: siteConfigDelegate,
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

    prisma.client.$transaction.mockImplementation((cb: (t: typeof tx) => unknown) => cb(tx))

    service = new OrdersService(
      prisma as unknown as PrismaService,
      ordersQueue as unknown as Queue,
      mailQueue as unknown as Queue,
      { validateCoupon: jest.fn() } as unknown as CouponsService,
    )

    siteConfigDelegate.findUnique.mockResolvedValue({
      vipOrderThreshold: 3,
      vipSpendThreshold: 200000,
    })
  })

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

    await service.evaluateVip('usr_1')

    expect(userDelegate.update).toHaveBeenCalledWith({
      where: { id: 'usr_1' },
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
    expect(subscriberDelegate.upsert).toHaveBeenCalledWith({
      where: { email: 'ada@example.com' },
      create: {
        email: 'ada@example.com',
        userId: 'usr_1',
        tags: ['registered', 'vip'],
        active: true,
      },
      update: { userId: 'usr_1', tags: { push: 'vip' } },
    })
  })

  it('promotes a customer who reaches the spend threshold', async () => {
    userDelegate.findUnique.mockResolvedValue(baseUser)
    orderDelegate.aggregate.mockResolvedValue({
      _count: { _all: 1 },
      _sum: { total: 250000 },
    })

    await service.evaluateVip('usr_1')

    expect(userDelegate.update).toHaveBeenCalled()
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

    await service.evaluateVip('usr_1')

    expect(subscriberDelegate.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { userId: 'usr_1', tags: { push: 'vip' } },
      }),
    )
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

  it('falls back to the default thresholds when no SiteConfig row exists', async () => {
    siteConfigDelegate.findUnique.mockResolvedValue(null)
    userDelegate.findUnique.mockResolvedValue(baseUser)
    orderDelegate.aggregate.mockResolvedValue({
      _count: { _all: 3 },
      _sum: { total: 30000 },
    })

    await service.evaluateVip('usr_1')

    expect(userDelegate.update).toHaveBeenCalledWith({
      where: { id: 'usr_1' },
      data: { isVip: true, vipSince: expect.any(Date) },
    })
  })
})
