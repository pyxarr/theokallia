import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { CreateShippingZoneDto } from './create-shipping-zone.dto'

/**
 * Validation tests for the POST body of a shipping zone.
 *
 * The global ValidationPipe runs with `transform: true` and
 * `enableImplicitConversion: true`, so the payload is converted exactly
 * like in production before it is validated.
 *
 * The name is stored trimmed, so a name made only of whitespace would
 * otherwise be persisted as an empty string.
 */
describe('CreateShippingZoneDto', () => {
  const toInstance = (payload: Record<string, unknown>) =>
    plainToInstance(CreateShippingZoneDto, payload, {
      enableImplicitConversion: true,
    })

  it('accepts a valid payload', async () => {
    const dto = toInstance({ name: 'Lagos', rate: 3000 })

    const errors = await validate(dto)

    expect(errors).toEqual([])
    expect(dto.name).toBe('Lagos')
    expect(dto.rate).toBe(3000)
  })

  it('rejects a whitespace-only name', async () => {
    const dto = toInstance({ name: '   ', rate: 3000 })

    const errors = await validate(dto)

    expect(errors).toHaveLength(1)
    expect(errors[0].property).toBe('name')
    expect(errors[0].constraints).toHaveProperty('matches')
  })

  it('rejects an empty name', async () => {
    const dto = toInstance({ name: '', rate: 3000 })

    const errors = await validate(dto)

    expect(errors).toHaveLength(1)
    expect(errors[0].property).toBe('name')
    expect(errors[0].constraints).toHaveProperty('isNotEmpty')
  })

  it('rejects an explicit null for a required field', async () => {
    const dto = toInstance({ name: null, rate: null })

    const errors = await validate(dto)

    expect(errors.map((error) => error.property).sort()).toEqual(['name', 'rate'])
  })

  it('rejects a negative rate', async () => {
    const dto = toInstance({ name: 'Lagos', rate: -1 })

    const errors = await validate(dto)

    expect(errors).toHaveLength(1)
    expect(errors[0].property).toBe('rate')
    expect(errors[0].constraints).toHaveProperty('min')
  })

  it('treats the active flag as optional', async () => {
    const dto = toInstance({ name: 'Lagos', rate: 3000 })

    const errors = await validate(dto)

    expect(errors).toEqual([])
    expect(dto.active).toBeUndefined()
  })
})
