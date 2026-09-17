import { ConflictException, NotFoundException } from '@nestjs/common'
import { validate } from 'class-validator'
import { CouponsService } from './coupons.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCouponDto } from './dto/create-coupon.dto'

/**
 * Unit tests for coupon admin CRUD and the CreateCouponDto validation rules.
 * The DTO tests assert invalid enum values (type/scope) are rejected — the
 * original defect this suite guards against is an unvalidated enum slipping
 * through to Prisma and failing at write time instead of at the request edge.
 */
describe('CouponsService', () => {
  const couponDelegate = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
  const prisma = { client: { coupon: couponDelegate } }
  let service: CouponsService

  beforeEach(() => {
    jest.resetAllMocks()
    service = new CouponsService(prisma as unknown as PrismaService)
  })

  describe('CreateCouponDto validation', () => {
    it('accepts a valid percent coupon payload', async () => {
      const dto = Object.assign(new CreateCouponDto(), {
        code: 'welcome10',
        type: 'percent',
        value: 10,
        scope: 'category',
        scopeId: 'cat_1',
        minOrder: 5000,
        maxUses: 100,
        perUserLimit: 1,
        expiresAt: '2026-12-31T23:59:59.000Z',
        active: true,
      })

      expect(await validate(dto)).toEqual([])
    })

    it('rejects an invalid coupon type', async () => {
      const dto = Object.assign(new CreateCouponDto(), {
        code: 'BOGUS',
        type: 'half_price',
        value: 10,
      })

      const errors = await validate(dto)
      expect(errors.some((error) => error.property === 'type')).toBe(true)
    })

    it('rejects an invalid coupon scope', async () => {
      const dto = Object.assign(new CreateCouponDto(), {
        code: 'BOGUS',
        type: 'percent',
        value: 10,
        scope: 'everywhere',
      })

      const errors = await validate(dto)
      expect(errors.some((error) => error.property === 'scope')).toBe(true)
    })

    it('rejects a negative discount value', async () => {
      const dto = Object.assign(new CreateCouponDto(), {
        code: 'BOGUS',
        type: 'fixed',
        value: -5,
      })

      const errors = await validate(dto)
      expect(errors.some((error) => error.property === 'value')).toBe(true)
    })
  })

  describe('create', () => {
    it('stores the code trimmed and uppercased', async () => {
      couponDelegate.create.mockResolvedValueOnce({ id: 'c1', code: 'WELCOME10' })

      await service.create({ code: '  welcome10  ', type: 'percent', value: 10 })

      expect(couponDelegate.create).toHaveBeenCalledTimes(1)
      expect(couponDelegate.create.mock.calls[0][0].data.code).toBe('WELCOME10')
    })

    it('defaults optional fields when omitted', async () => {
      couponDelegate.create.mockResolvedValueOnce({ id: 'c1', code: 'WELCOME10' })

      await service.create({ code: 'welcome10', type: 'percent', value: 10 })

      const data = couponDelegate.create.mock.calls[0][0].data
      expect(data.scope).toBe('storewide')
      expect(data.scopeId).toBeNull()
      expect(data.minOrder).toBeNull()
      expect(data.maxUses).toBeNull()
      expect(data.perUserLimit).toBeNull()
      expect(data.expiresAt).toBeNull()
      expect(data.active).toBe(true)
    })

    it('maps a duplicate code (P2002) to ConflictException', async () => {
      couponDelegate.create.mockRejectedValueOnce({ code: 'P2002' })

      await expect(
        service.create({ code: 'welcome10', type: 'percent', value: 10 }),
      ).rejects.toBeInstanceOf(ConflictException)
    })
  })

  describe('findOne', () => {
    it('throws NotFoundException when the coupon does not exist', async () => {
      couponDelegate.findUnique.mockResolvedValueOnce(null)

      await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('update', () => {
    it('uppercases the code on update', async () => {
      couponDelegate.findUnique.mockResolvedValueOnce({ id: 'c1', code: 'OLD' })
      couponDelegate.update.mockResolvedValueOnce({ id: 'c1', code: 'NEW10' })

      await service.update('c1', { code: 'new10' })

      expect(couponDelegate.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { code: 'NEW10' },
      })
    })

    it('maps a duplicate code (P2002) to ConflictException', async () => {
      couponDelegate.findUnique.mockResolvedValueOnce({ id: 'c1', code: 'OLD' })
      couponDelegate.update.mockRejectedValueOnce({ code: 'P2002' })

      await expect(service.update('c1', { code: 'taken' })).rejects.toBeInstanceOf(
        ConflictException,
      )
    })
  })

  describe('remove', () => {
    it('deletes the coupon and returns a confirmation message', async () => {
      couponDelegate.findUnique.mockResolvedValueOnce({ id: 'c1', code: 'WELCOME10' })
      couponDelegate.delete.mockResolvedValueOnce({ id: 'c1' })

      const result = await service.remove('c1')

      expect(couponDelegate.delete).toHaveBeenCalledWith({ where: { id: 'c1' } })
      expect(result).toEqual({ message: 'Coupon with id c1 deleted successfully.' })
    })
  })
})