import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { UpdateShippingZoneDto } from './update-shipping-zone.dto'

/**
 * Validation tests for the PATCH body of a shipping zone.
 *
 * The global ValidationPipe runs with `transform: true` and
 * `enableImplicitConversion: true`, so the payload is converted exactly
 * like in production before it is validated.
 *
 * Every column of the shipping zone table is non-nullable, so an
 * explicit `null` has to be rejected here — otherwise it would reach
 * Prisma and surface as an unhandled 500 instead of a 400.
 *
 * The zone name is NOT part of the body: checkout resolves a zone by
 * name, so a rename would break every order routed through it. The
 * global ValidationPipe runs with `forbidNonWhitelisted: true`, so a
 * payload that still carries a name is a 400.
 */
describe('UpdateShippingZoneDto', () => {
  const toInstance = (payload: Record<string, unknown>) =>
    plainToInstance(UpdateShippingZoneDto, payload, {
      enableImplicitConversion: true,
    })

  it('rejects an explicit null for a field', async () => {
    const dto = toInstance({ rate: null })

    const errors = await validate(dto)

    expect(errors).toHaveLength(1)
    expect(errors[0].property).toBe('rate')
    expect(errors[0].constraints).toHaveProperty('isNumber')
  })

  it('rejects an explicit null for every field', async () => {
    const dto = toInstance({ rate: null, active: null })

    const errors = await validate(dto)

    expect(errors.map((error) => error.property).sort()).toEqual([
      'active',
      'rate',
    ])
    const rate = errors.find((error) => error.property === 'rate')
    const active = errors.find((error) => error.property === 'active')
    expect(rate?.constraints).toHaveProperty('isNumber')
    expect(active?.constraints).toHaveProperty('isBoolean')
  })

  it('rejects a rename — the zone name is not an updatable field', async () => {
    const dto = toInstance({ name: 'Lagos' })

    // `whitelist` + `forbidNonWhitelisted` mirror the global pipe.
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    })

    expect(errors.map((error) => error.property)).toContain('name')
  })

  it('accepts a payload that omits every field (PATCH no-op)', async () => {
    const dto = toInstance({})

    const errors = await validate(dto)

    expect(errors).toEqual([])
    // An omitted field stays `undefined`, which Prisma treats as
    // "do not change" — so the column keeps its current value.
    expect(dto.rate).toBeUndefined()
    expect(dto.active).toBeUndefined()
  })

  it('accepts a partial payload with valid values', async () => {
    const dto = toInstance({ rate: 3000 })

    const errors = await validate(dto)

    expect(errors).toEqual([])
    expect(dto.rate).toBe(3000)
    // Only the field the client sent carries a value.
    expect(dto.active).toBeUndefined()
  })

  it('still rejects out-of-range values', async () => {
    const dto = toInstance({ rate: -5 })

    const errors = await validate(dto)

    expect(errors).toHaveLength(1)
    expect(errors[0].property).toBe('rate')
    expect(errors[0].constraints).toHaveProperty('min')
  })

  it('still rejects a non-numeric rate', async () => {
    const dto = toInstance({ rate: 'abc' })

    const errors = await validate(dto)

    expect(errors).toHaveLength(1)
    expect(errors[0].property).toBe('rate')
    expect(errors[0].constraints).toHaveProperty('isNumber')
  })

  it('rejects a blank rate instead of storing it as 0', async () => {
    const dto = toInstance({ rate: '' })

    const errors = await validate(dto)

    expect(errors).toHaveLength(1)
    expect(errors[0].property).toBe('rate')
    expect(errors[0].constraints).toHaveProperty('isNumber')
  })

  it('parses the string "false" into the boolean false', async () => {
    const dto = toInstance({ active: 'false' })

    const errors = await validate(dto)

    // The strict parse turns "false" into the boolean `false` — the
    // implicit conversion would have turned it into `true` and left the
    // zone switched on after the admin asked to switch it off.
    expect(errors).toEqual([])
    expect(dto.active).toBe(false)
  })

  it('accepts a numeric string rate and holds it as a number', async () => {
    const dto = toInstance({ rate: '3000' })

    const errors = await validate(dto)

    expect(errors).toEqual([])
    expect(dto.rate).toBe(3000)
  })

  it('rejects a boolean sent to the numeric rate', async () => {
    const dto = toInstance({ rate: true })

    const errors = await validate(dto)

    expect(errors).toHaveLength(1)
    expect(errors[0].property).toBe('rate')
    expect(errors[0].constraints).toHaveProperty('isNumber')
  })
})
