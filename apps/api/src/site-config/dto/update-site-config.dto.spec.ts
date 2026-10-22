import 'reflect-metadata'
import { BadRequestException, ValidationPipe } from '@nestjs/common'
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

  /**
   * The app's global pipe, with the same options as `main.ts`. It is the
   * edge the admin's own requests go through, so it is the edge a stale
   * field has to fail on.
   */
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  })

  const transform = (payload: Record<string, unknown>) =>
    pipe.transform(payload, { type: 'body', metatype: UpdateSiteConfigDto })

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
    })

    const errors = await validate(dto)

    expect(errors.map((error) => error.property).sort()).toEqual([
      'vipOrderThreshold',
      'vipSpendThreshold',
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
      vipSpendThreshold: -1,
    })

    const errors = await validate(dto)

    expect(errors.map((error) => error.property).sort()).toEqual([
      'vipOrderThreshold',
      'vipSpendThreshold',
    ])
  })

  it('rejects a body that still carries a retired welcome-discount field', async () => {
    // The welcome offer is a coupon now, so the site_config columns it
    // used are gone. A client still sending one must get a 400, not a
    // silently dropped value.
    await expect(
      transform({ welcomeDiscountPercent: 10 }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('accepts a body carrying only the remaining fields', async () => {
    const dto = await transform({
      vipOrderThreshold: 5,
      vipSpendThreshold: 1000,
    })

    expect(dto).toBeInstanceOf(UpdateSiteConfigDto)
    expect(dto.vipOrderThreshold).toBe(5)
    expect(dto.vipSpendThreshold).toBe(1000)
  })

  it('rejects a blank string instead of storing it as 0', async () => {
    const dto = toInstance({ vipOrderThreshold: '' })

    const errors = await validate(dto)

    expect(errors).toHaveLength(1)
    expect(errors[0].property).toBe('vipOrderThreshold')
    expect(errors[0].constraints).toHaveProperty('isInt')
  })

  it('parses the string "false" as a boolean, not as a number', async () => {
    const dto = toInstance({ vipOrderThreshold: 'false' })

    const errors = await validate(dto)

    // The strict parse turns "false" into the boolean `false`, so the
    // numeric validators reject it — the implicit conversion would have
    // turned it into a truthy 1 and promoted every customer to VIP.
    expect(dto.vipOrderThreshold).toBe(false)
    expect(errors).toHaveLength(1)
    expect(errors[0].property).toBe('vipOrderThreshold')
    expect(errors[0].constraints).toHaveProperty('isInt')
  })

  it('accepts a numeric string and holds it as a number', async () => {
    const dto = toInstance({ vipOrderThreshold: '3000' })

    const errors = await validate(dto)

    expect(errors).toEqual([])
    expect(dto.vipOrderThreshold).toBe(3000)
  })

  it('rejects a boolean sent to a numeric field', async () => {
    const dto = toInstance({ vipOrderThreshold: true })

    const errors = await validate(dto)

    expect(errors).toHaveLength(1)
    expect(errors[0].property).toBe('vipOrderThreshold')
    expect(errors[0].constraints).toHaveProperty('isInt')
  })
})
