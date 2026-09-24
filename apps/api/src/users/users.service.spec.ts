import { NotFoundException } from '@nestjs/common'
import { UsersService } from './users.service'
import { PrismaService } from '../prisma/prisma.service'

/**
 * Unit tests for the admin VIP override added in Phase 6.
 * Promoting stamps vipSince; demoting clears the flag but keeps vipSince
 * as a record of when the customer qualified.
 */
describe('UsersService — setVip', () => {
  const userDelegate = { findUnique: jest.fn(), update: jest.fn() }
  const prisma = { client: { user: userDelegate } }
  let service: UsersService

  beforeEach(() => {
    jest.resetAllMocks()
    service = new UsersService(prisma as unknown as PrismaService)
  })

  it('throws NotFoundException for an unknown user', async () => {
    userDelegate.findUnique.mockResolvedValueOnce(null)

    await expect(service.setVip('missing', true)).rejects.toBeInstanceOf(
      NotFoundException,
    )
    expect(userDelegate.update).not.toHaveBeenCalled()
  })

  it('promotes a customer to VIP and stamps vipSince', async () => {
    userDelegate.findUnique.mockResolvedValueOnce({ id: 'usr_1' })
    userDelegate.update.mockResolvedValueOnce({ id: 'usr_1', isVip: true })

    await service.setVip('usr_1', true)

    expect(userDelegate.update).toHaveBeenCalledWith({
      where: { id: 'usr_1' },
      data: { isVip: true, vipSince: expect.any(Date) },
    })
  })

  it('demotes a customer without clearing vipSince', async () => {
    userDelegate.findUnique.mockResolvedValueOnce({ id: 'usr_1' })
    userDelegate.update.mockResolvedValueOnce({ id: 'usr_1', isVip: false })

    await service.setVip('usr_1', false)

    expect(userDelegate.update).toHaveBeenCalledWith({
      where: { id: 'usr_1' },
      data: { isVip: false },
    })
  })
})

/**
 * Unit tests for the admin customer directory added in Phase 14.
 * Aggregates cover the current page only, and lifetime spend must mirror the
 * VIP engine's paid/shipped/delivered rule.
 */
describe('UsersService — customer directory', () => {
  const userDelegate = {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
  }
  const orderDelegate = {
    groupBy: jest.fn(),
    aggregate: jest.fn(),
    findMany: jest.fn(),
  }
  const reviewDelegate = { groupBy: jest.fn(), findMany: jest.fn() }
  const subscriberDelegate = { findUnique: jest.fn() }
  const cartItemDelegate = { count: jest.fn() }
  const prisma = {
    client: {
      user: userDelegate,
      order: orderDelegate,
      review: reviewDelegate,
      subscriber: subscriberDelegate,
      cartItem: cartItemDelegate,
    },
  }
  let service: UsersService

  beforeEach(() => {
    jest.resetAllMocks()
    service = new UsersService(prisma as unknown as PrismaService)
  })

  describe('findAllCustomers', () => {
    it('builds a case-insensitive OR search over email and name', async () => {
      userDelegate.findMany.mockResolvedValueOnce([])
      userDelegate.count.mockResolvedValueOnce(0)

      const result = await service.findAllCustomers({
        q: 'ada',
        page: 2,
        limit: 20,
      })

      const where = userDelegate.findMany.mock.calls[0][0].where
      expect(where.OR).toHaveLength(3)
      expect(where.OR[0]).toEqual({
        email: { contains: 'ada', mode: 'insensitive' },
      })
      expect(userDelegate.findMany.mock.calls[0][0].skip).toBe(20)
      expect(result.data).toEqual([])
      expect(result.meta).toEqual({
        total: 0,
        page: 2,
        limit: 20,
        totalPages: 0,
      })
    })

    it('stops early without aggregating when the page is empty', async () => {
      userDelegate.findMany.mockResolvedValueOnce([])
      userDelegate.count.mockResolvedValueOnce(0)

      await service.findAllCustomers({})

      expect(orderDelegate.groupBy).not.toHaveBeenCalled()
      expect(reviewDelegate.groupBy).not.toHaveBeenCalled()
    })

    it('only counts paid/shipped/delivered orders towards lifetime spend', async () => {
      userDelegate.findMany.mockResolvedValueOnce([
        {
          id: 'usr_1',
          email: 'ada@example.com',
          firstName: 'Ada',
          lastName: 'L',
        },
      ])
      userDelegate.count.mockResolvedValueOnce(1)
      orderDelegate.groupBy.mockResolvedValueOnce([
        {
          userId: 'usr_1',
          _count: { _all: 3 },
          _sum: { total: 90000 },
          _max: { createdAt: new Date('2026-02-01') },
        },
      ])
      reviewDelegate.groupBy.mockResolvedValueOnce([
        { userId: 'usr_1', _count: { _all: 2 } },
      ])

      const result = await service.findAllCustomers({})

      expect(orderDelegate.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['userId'],
          where: {
            userId: { in: ['usr_1'] },
            status: { in: ['paid', 'shipped', 'delivered'] },
          },
        }),
      )
      expect(result.data[0]).toMatchObject({
        id: 'usr_1',
        ordersCount: 3,
        lifetimeSpend: 90000,
        reviewsCount: 2,
      })
    })

    it('defaults missing aggregates to zero rather than undefined', async () => {
      userDelegate.findMany.mockResolvedValueOnce([
        {
          id: 'usr_new',
          email: 'new@example.com',
          firstName: 'New',
          lastName: 'Buyer',
        },
      ])
      userDelegate.count.mockResolvedValueOnce(1)
      orderDelegate.groupBy.mockResolvedValueOnce([])
      reviewDelegate.groupBy.mockResolvedValueOnce([])

      const result = await service.findAllCustomers({})

      expect(result.data[0]).toMatchObject({
        ordersCount: 0,
        lifetimeSpend: 0,
        lastOrderAt: null,
        reviewsCount: 0,
      })
    })

    it('passes the role filter through to the query', async () => {
      userDelegate.findMany.mockResolvedValueOnce([])
      userDelegate.count.mockResolvedValueOnce(0)

      await service.findAllCustomers({ role: 'admin' })

      expect(userDelegate.findMany.mock.calls[0][0].where).toEqual({
        role: 'admin',
      })
    })
  })

  describe('findCustomer', () => {
    it('throws NotFoundException for an unknown customer', async () => {
      userDelegate.findUnique.mockResolvedValueOnce(null)

      await expect(service.findCustomer('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      )
      expect(orderDelegate.aggregate).not.toHaveBeenCalled()
    })

    it('returns stats, recent orders, reviews, and subscriber tags', async () => {
      userDelegate.findUnique.mockResolvedValueOnce({
        id: 'usr_1',
        email: 'ada@example.com',
      })
      orderDelegate.aggregate.mockResolvedValueOnce({
        _count: { _all: 4 },
        _sum: { total: 120000 },
        _max: { createdAt: new Date('2026-03-01') },
      })
      orderDelegate.findMany.mockResolvedValueOnce([
        { id: 'ord_1', status: 'paid' },
      ])
      reviewDelegate.findMany.mockResolvedValueOnce([
        { id: 'rev_1', rating: 5, status: 'approved' },
      ])
      cartItemDelegate.count.mockResolvedValueOnce(2)
      subscriberDelegate.findUnique.mockResolvedValueOnce({
        tags: ['registered', 'vip'],
        active: true,
      })

      const result = await service.findCustomer('usr_1')

      expect(cartItemDelegate.count).toHaveBeenCalledWith({
        where: { cart: { userId: 'usr_1' } },
      })
      expect(subscriberDelegate.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: 'ada@example.com' } }),
      )
      expect(result.stats).toMatchObject({
        ordersCount: 4,
        lifetimeSpend: 120000,
        reviewsCount: 1,
      })
      expect(result.recentOrders).toHaveLength(1)
      expect(result.cartItemsCount).toBe(2)
      expect(result.subscriber).toEqual({
        tags: ['registered', 'vip'],
        active: true,
      })
    })

    it('reports a null subscriber for someone not on the newsletter', async () => {
      userDelegate.findUnique.mockResolvedValueOnce({
        id: 'usr_1',
        email: 'ada@example.com',
      })
      orderDelegate.aggregate.mockResolvedValueOnce({
        _count: { _all: 0 },
        _sum: { total: null },
        _max: { createdAt: null },
      })
      orderDelegate.findMany.mockResolvedValueOnce([])
      reviewDelegate.findMany.mockResolvedValueOnce([])
      cartItemDelegate.count.mockResolvedValueOnce(0)
      subscriberDelegate.findUnique.mockResolvedValueOnce(null)

      const result = await service.findCustomer('usr_1')

      expect(result.subscriber).toBeNull()
      expect(result.stats.lifetimeSpend).toBe(0)
      expect(result.stats.lastOrderAt).toBeNull()
    })
  })
})
