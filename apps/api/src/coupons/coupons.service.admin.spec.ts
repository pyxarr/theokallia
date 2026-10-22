import { validate } from 'class-validator'
import { CouponsService } from './coupons.service'
import { PrismaService } from '../prisma/prisma.service'
import { FilterCouponsDto } from './dto/filter-coupons.dto'

/**
 * Unit tests for the admin coupon listing filters and tab-badge counts.
 * `findAll` must apply search/type/scope/active filters with Load-More
 * pagination, and `countByState` must aggregate the badge totals.
 */
describe('CouponsService', () => {
  const couponDelegate = {
    findMany: jest.fn(),
    count: jest.fn(),
  }
  const prisma = { client: { coupon: couponDelegate } }
  let service: CouponsService

  beforeEach(() => {
    jest.resetAllMocks()
    service = new CouponsService(prisma as unknown as PrismaService)
  })

  describe('findAll', () => {
    it('returns a paginated payload with newest-first ordering', async () => {
      couponDelegate.findMany.mockResolvedValueOnce([])
      couponDelegate.count.mockResolvedValueOnce(0)

      const result = await service.findAll({})

      expect(couponDelegate.findMany.mock.calls[0][0]).toEqual({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      })
      expect(result).toEqual({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      })
    })

    it('applies search, type, scope and active filters', async () => {
      couponDelegate.findMany.mockResolvedValueOnce([])
      couponDelegate.count.mockResolvedValueOnce(0)

      await service.findAll({
        q: 'welcome',
        type: 'percent',
        scope: 'category',
        active: 'false',
        page: 2,
        limit: 5,
      })

      const { where } = couponDelegate.findMany.mock.calls[0][0]
      expect(where.active).toBe(false)
      expect(where.type).toBe('percent')
      expect(where.scope).toBe('category')
      expect(where.code).toEqual({ contains: 'welcome', mode: 'insensitive' })
      expect(couponDelegate.findMany.mock.calls[0][0].skip).toBe(5)
      expect(couponDelegate.findMany.mock.calls[0][0].take).toBe(5)
    })

    it('filters to the welcome coupon', async () => {
      couponDelegate.findMany.mockResolvedValueOnce([])
      couponDelegate.count.mockResolvedValueOnce(0)

      await service.findAll(Object.assign(new FilterCouponsDto(), { source: 'welcome' }))

      expect(couponDelegate.findMany.mock.calls[0][0].where.source).toBe('welcome')
    })

    it('filters to hand-made promo codes only', async () => {
      couponDelegate.findMany.mockResolvedValueOnce([])
      couponDelegate.count.mockResolvedValueOnce(0)

      await service.findAll(Object.assign(new FilterCouponsDto(), { source: 'promo' }))

      expect(couponDelegate.findMany.mock.calls[0][0].where.source).toBeNull()
    })
  })

  describe('FilterCouponsDto validation', () => {
    it('rejects an unknown coupon source filter', async () => {
      const dto = Object.assign(new FilterCouponsDto(), { source: 'bogus' })

      const errors = await validate(dto)
      expect(errors.some((error) => error.property === 'source')).toBe(true)
    })
  })

  describe('countByState', () => {
    it('aggregates totals by state, type and scope', async () => {
      couponDelegate.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(7)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(6)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1)

      const result = await service.countByState()

      expect(result).toEqual({
        total: 10,
        active: 7,
        inactive: 3,
        percent: 5,
        fixed: 3,
        free_shipping: 2,
        storewide: 6,
        category: 3,
        product: 1,
      })
    })
  })
})