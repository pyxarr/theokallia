import 'reflect-metadata'
import { ConflictException, NotFoundException, ValidationPipe } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { CouponsService } from './coupons.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCouponDto } from './dto/create-coupon.dto'
import { UpdateCouponDto } from './dto/update-coupon.dto'

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
    // The global ValidationPipe in main.ts runs with `transform: true` and
    // `enableImplicitConversion: true`, so the body is converted exactly
    // like in production before it is validated.
    const toInstance = (payload: Record<string, unknown>) =>
      plainToInstance(CreateCouponDto, payload, { enableImplicitConversion: true })

    it('accepts a valid percent coupon payload', async () => {
      const dto = toInstance({
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
      const dto = toInstance({ code: 'BOGUS', type: 'half_price', value: 10 })

      const errors = await validate(dto)
      expect(errors.some((error) => error.property === 'type')).toBe(true)
    })

    it('rejects an invalid coupon scope', async () => {
      const dto = toInstance({
        code: 'BOGUS',
        type: 'percent',
        value: 10,
        scope: 'everywhere',
      })

      const errors = await validate(dto)
      expect(errors.some((error) => error.property === 'scope')).toBe(true)
    })

    it('rejects a negative discount value', async () => {
      const dto = toInstance({ code: 'BOGUS', type: 'fixed', value: -5 })

      const errors = await validate(dto)
      expect(errors.some((error) => error.property === 'value')).toBe(true)
    })

    it('accepts a welcome coupon payload', async () => {
      const dto = toInstance({
        code: 'welcome10',
        type: 'percent',
        value: 10,
        source: 'welcome',
        autoIssue: true,
      })

      expect(await validate(dto)).toEqual([])
    })

    it('rejects an unknown coupon source', async () => {
      const dto = toInstance({
        code: 'BOGUS',
        type: 'percent',
        value: 10,
        source: 'promo',
      })

      const errors = await validate(dto)
      expect(errors.some((error) => error.property === 'source')).toBe(true)
    })

    it('rejects a non-boolean autoIssue', async () => {
      const dto = toInstance({
        code: 'BOGUS',
        type: 'percent',
        value: 10,
        autoIssue: 'yes',
      })

      const errors = await validate(dto)
      expect(errors.some((error) => error.property === 'autoIssue')).toBe(true)
    })

    it('parses the string "false" into the boolean false', async () => {
      const dto = toInstance({
        code: 'BOGUS',
        type: 'percent',
        value: 10,
        autoIssue: 'false',
      })

      // The strict parse turns "false" into the boolean `false` — the
      // implicit conversion would have turned it into `true` and issued
      // the coupon to every new customer.
      expect(await validate(dto)).toEqual([])
      expect(dto.autoIssue).toBe(false)
    })
  })

  /**
   * The exact bodies the admin's "Welcome coupon" card sends. The global
   * pipe runs with `forbidNonWhitelisted`, so a field the DTO does not
   * know — or a `null` the validators reject — would be a 400 instead of
   * a stored coupon.
   */
  describe("the admin's welcome coupon payloads", () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })

    it("accepts the card's create body", async () => {
      const dto = await pipe.transform(
        {
          code: 'WELCOME10',
          type: 'percent',
          value: 10,
          scope: 'storewide',
          minOrder: 20000,
          perUserLimit: 1,
          maxUses: null,
          expiresAt: null,
          active: true,
          source: 'welcome',
          autoIssue: true,
        },
        { type: 'body', metatype: CreateCouponDto },
      )

      expect(dto).toBeInstanceOf(CreateCouponDto)
      expect(dto.source).toBe('welcome')
      expect(dto.autoIssue).toBe(true)
    })

    it("accepts the card's toggle body", async () => {
      const dto = await pipe.transform(
        { autoIssue: false },
        { type: 'body', metatype: UpdateCouponDto },
      )

      expect(dto).toBeInstanceOf(UpdateCouponDto)
      expect(dto.autoIssue).toBe(false)
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
      expect(data.source).toBeNull()
      expect(data.autoIssue).toBe(false)
    })

    it('stores the welcome source and the auto-issue flag', async () => {
      couponDelegate.create.mockResolvedValueOnce({ id: 'c1', code: 'WELCOME10' })

      await service.create(
        Object.assign(new CreateCouponDto(), {
          code: 'welcome10',
          type: 'percent',
          value: 10,
          source: 'welcome',
          autoIssue: true,
        }),
      )

      const data = couponDelegate.create.mock.calls[0][0].data
      expect(data.source).toBe('welcome')
      expect(data.autoIssue).toBe(true)
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
    // The global ValidationPipe in main.ts runs with `transform: true` and
    // `enableImplicitConversion: true`, so the patch body is converted
    // exactly like in production before it reaches the service.
    const toInstance = (payload: Record<string, unknown>) =>
      plainToInstance(UpdateCouponDto, payload, { enableImplicitConversion: true })

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

    it('does not write autoIssue when the patch omits it', async () => {
      couponDelegate.findUnique.mockResolvedValueOnce({ id: 'c1', code: 'WELCOME10' })
      couponDelegate.update.mockResolvedValueOnce({ id: 'c1' })

      await service.update(
        'c1',
        Object.assign(new UpdateCouponDto(), { value: 15, autoIssue: undefined }),
      )

      expect(couponDelegate.update.mock.calls[0][0].data).not.toHaveProperty('autoIssue')
    })

    it('writes autoIssue when the patch carries it', async () => {
      couponDelegate.findUnique.mockResolvedValueOnce({ id: 'c1', code: 'WELCOME10' })
      couponDelegate.update.mockResolvedValueOnce({ id: 'c1' })

      await service.update('c1', Object.assign(new UpdateCouponDto(), { autoIssue: true }))

      expect(couponDelegate.update.mock.calls[0][0].data.autoIssue).toBe(true)
    })

    it('does not write autoIssue when the patch carries null', async () => {
      couponDelegate.findUnique.mockResolvedValueOnce({ id: 'c1', code: 'WELCOME10' })
      couponDelegate.update.mockResolvedValueOnce({ id: 'c1' })

      await service.update('c1', toInstance({ autoIssue: null }))

      // `null` counts as absent — the column is NOT NULL, so writing it
      // would fail at Prisma instead of leaving the flag alone.
      expect(couponDelegate.update.mock.calls[0][0].data).not.toHaveProperty('autoIssue')
    })

    it('parses the string "false" into the boolean false', async () => {
      couponDelegate.findUnique.mockResolvedValueOnce({ id: 'c1', code: 'WELCOME10' })
      couponDelegate.update.mockResolvedValueOnce({ id: 'c1' })

      await service.update('c1', toInstance({ autoIssue: 'false' }))

      expect(couponDelegate.update.mock.calls[0][0].data.autoIssue).toBe(false)
    })

    it('writes source when the patch carries it', async () => {
      couponDelegate.findUnique.mockResolvedValueOnce({ id: 'c1', code: 'WELCOME10' })
      couponDelegate.update.mockResolvedValueOnce({ id: 'c1' })

      await service.update('c1', Object.assign(new UpdateCouponDto(), { source: 'welcome' }))

      expect(couponDelegate.update.mock.calls[0][0].data.source).toBe('welcome')
    })

    it('does not write source when the patch omits it', async () => {
      couponDelegate.findUnique.mockResolvedValueOnce({ id: 'c1', code: 'WELCOME10' })
      couponDelegate.update.mockResolvedValueOnce({ id: 'c1' })

      await service.update('c1', Object.assign(new UpdateCouponDto(), { value: 15 }))

      expect(couponDelegate.update.mock.calls[0][0].data).not.toHaveProperty('source')
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