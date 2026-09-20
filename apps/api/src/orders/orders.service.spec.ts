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
  const orderDelegate = { findMany: jest.fn() }
  const userDelegate = { findUnique: jest.fn(), update: jest.fn() }
  const siteConfigDelegate = { findFirst: jest.fn() }
  const subscriberDelegate = { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() }
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

    tx.order.findUnique.mockResolvedValue({ id: 'ord_1', userId: 'usr_1', reservations: [] })
    tx.order.update.mockResolvedValue({ id: 'ord_1', userId: 'usr_1', status: 'paid' })
    siteConfigDelegate.findFirst.mockResolvedValue({
      vipOrderThreshold: 3,
      vipSpendThreshold: 200000,
    })
  })

  it('promotes a customer who reaches the order-count threshold', async () => {
    userDelegate.findUnique.mockResolvedValue(baseUser)
    orderDelegate.findMany.mockResolvedValue([
      { total: 10000 },
      { total: 10000 },
      { total: 10000 },
    ])
    subscriberDelegate.findUnique.mockResolvedValue(null)

    await service.markAsPaid('ord_1')

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
    expect(subscriberDelegate.create).toHaveBeenCalledWith({
      data: { email: 'ada@example.com', userId: 'usr_1', tags: ['registered', 'vip'] },
    })
  })

  it('promotes a customer who reaches the spend threshold', async () => {
    userDelegate.findUnique.mockResolvedValue(baseUser)
    orderDelegate.findMany.mockResolvedValue([{ total: 250000 }])
    subscriberDelegate.findUnique.mockResolvedValue({
      id: 'sub_1',
      email: 'ada@example.com',
      tags: ['registered'],
    })

    await service.markAsPaid('ord_1')

    expect(userDelegate.update).toHaveBeenCalled()
    expect(subscriberDelegate.update).toHaveBeenCalledWith({
      where: { email: 'ada@example.com' },
      data: { tags: ['registered', 'vip'] },
    })
  })

  it('does not duplicate the vip tag when it is already present', async () => {
    userDelegate.findUnique.mockResolvedValue(baseUser)
    orderDelegate.findMany.mockResolvedValue([{ total: 250000 }])
    subscriberDelegate.findUnique.mockResolvedValue({
      id: 'sub_1',
      email: 'ada@example.com',
      tags: ['registered', 'vip'],
    })

    await service.markAsPaid('ord_1')

    expect(subscriberDelegate.update).not.toHaveBeenCalled()
  })

  it('does nothing when the customer is already VIP', async () => {
    userDelegate.findUnique.mockResolvedValue({ ...baseUser, isVip: true })

    await service.markAsPaid('ord_1')

    expect(orderDelegate.findMany).not.toHaveBeenCalled()
    expect(userDelegate.update).not.toHaveBeenCalled()
    expect(mailQueue.add).not.toHaveBeenCalled()
  })

  it('does nothing below both thresholds', async () => {
    userDelegate.findUnique.mockResolvedValue(baseUser)
    orderDelegate.findMany.mockResolvedValue([{ total: 5000 }])

    await service.markAsPaid('ord_1')

    expect(userDelegate.update).not.toHaveBeenCalled()
    expect(mailQueue.add).not.toHaveBeenCalled()
    expect(subscriberDelegate.create).not.toHaveBeenCalled()
  })

  it('skips evaluation when no SiteConfig row exists', async () => {
    siteConfigDelegate.findFirst.mockResolvedValue(null)

    await service.markAsPaid('ord_1')

    expect(userDelegate.findUnique).not.toHaveBeenCalled()
    expect(userDelegate.update).not.toHaveBeenCalled()
  })
})
