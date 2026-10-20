import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { UpdateSiteConfigDto } from './update-site-config.dto'

/**
 * Validation tests for the PATCH body of the singleton settings row.
 *
 * The global ValidationPipe runs with `transform: true` and
 * `enableImplicitConversion: true`, so the payload is converted exactly
 * like in production before it is validated.
 */
describe('UpdateSiteConfigDto', () => {
  const toInstance = (payload: Record<string, unknown>) =>
    plainToInstance(UpdateSiteConfigDto, payload, {
      enableImplicitConversion: true,
    })

  it('rejects an explicit null for a field', async () => {
    const dto = toInstance({ vipOrderThreshold: null })

    const errors = await validate(dto)

    expect(errors).toHaveLength(1)
    expect(errors[0].property).toBe('vipOrderThreshold')
    expect(errors[0].constraints).toHaveProperty('isDefined')
  })

  it('rejects an explicit null for every field', async () => {
    const dto = toInstance({
      vipOrderThreshold: null,
      vipSpendThreshold: null,
      welcomeDiscountPercent: null,
      welcomeDiscountMinOrder: null,
      welcomeDiscountExpiry: null,
    })

    const errors = await validate(dto)

    expect(errors.map((error) => error.property).sort()).toEqual([
      'vipOrderThreshold',
      'vipSpendThreshold',
      'welcomeDiscountExpiry',
      'welcomeDiscountMinOrder',
      'welcomeDiscountPercent',
    ])
  })

  it('accepts a payload that omits every field (PATCH no-op)', async () => {
    const dto = toInstance({})

    const errors = await validate(dto)

    expect(errors).toEqual([])
    // An omitted field stays `undefined`, which Prisma treats as
    // "do not change" — so the column keeps its current value.
    expect(dto.vipOrderThreshold).toBeUndefined()
    expect(dto.vipSpendThreshold).toBeUndefined()
    expect(dto.welcomeDiscountPercent).toBeUndefined()
    expect(dto.welcomeDiscountMinOrder).toBeUndefined()
    expect(dto.welcomeDiscountExpiry).toBeUndefined()
  })

  it('accepts a partial payload with valid values', async () => {
    const dto = toInstance({ vipOrderThreshold: 5 })

    const errors = await validate(dto)

    expect(errors).toEqual([])
    expect(dto.vipOrderThreshold).toBe(5)
    // Only the field the client sent carries a value.
    expect(dto.vipSpendThreshold).toBeUndefined()
  })

  it('still rejects out-of-range and non-numeric values', async () => {
    const dto = toInstance({
      vipOrderThreshold: 1.5,
      welcomeDiscountPercent: 101,
      welcomeDiscountExpiry: 0,
    })

    const errors = await validate(dto)

    expect(errors.map((error) => error.property).sort()).toEqual([
      'vipOrderThreshold',
      'welcomeDiscountExpiry',
      'welcomeDiscountPercent',
    ])
  })
})
