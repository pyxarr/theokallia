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
 */
describe('UpdateShippingZoneDto', () => {
  const toInstance = (payload: Record<string, unknown>) =>
    plainToInstance(UpdateShippingZoneDto, payload, {
      enableImplicitConversion: true,
    })

  it('rejects an explicit null for a field', async () => {
    const dto = toInstance({ name: null })

    const errors = await validate(dto)

    expect(errors).toHaveLength(1)
    expect(errors[0].property).toBe('name')
    expect(errors[0].constraints).toHaveProperty('isString')
  })

  it('rejects an explicit null for every field', async () => {
    const dto = toInstance({ name: null, rate: null, active: null })

    const errors = await validate(dto)

    expect(errors.map((error) => error.property).sort()).toEqual([
      'active',
      'name',
      'rate',
    ])
    const rate = errors.find((error) => error.property === 'rate')
    const active = errors.find((error) => error.property === 'active')
    expect(rate?.constraints).toHaveProperty('isNumber')
    expect(active?.constraints).toHaveProperty('isBoolean')
  })

  it('accepts a payload that omits every field (PATCH no-op)', async () => {
    const dto = toInstance({})

    const errors = await validate(dto)

    expect(errors).toEqual([])
    // An omitted field stays `undefined`, which Prisma treats as
    // "do not change" — so the column keeps its current value.
    expect(dto.name).toBeUndefined()
    expect(dto.rate).toBeUndefined()
    expect(dto.active).toBeUndefined()
  })

  it('accepts a partial payload with valid values', async () => {
    const dto = toInstance({ name: 'Lagos' })

    const errors = await validate(dto)

    expect(errors).toEqual([])
    expect(dto.name).toBe('Lagos')
    // Only the field the client sent carries a value.
    expect(dto.rate).toBeUndefined()
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

  it('rejects an empty name', async () => {
    const dto = toInstance({ name: '' })

    const errors = await validate(dto)

    expect(errors).toHaveLength(1)
    expect(errors[0].property).toBe('name')
    expect(errors[0].constraints).toHaveProperty('isNotEmpty')
  })

  it('rejects a whitespace-only name', async () => {
    const dto = toInstance({ name: '   ' })

    const errors = await validate(dto)

    expect(errors).toHaveLength(1)
    expect(errors[0].property).toBe('name')
    expect(errors[0].constraints).toHaveProperty('matches')
  })
})
