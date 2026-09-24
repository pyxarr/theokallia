import { BadRequestException } from '@nestjs/common'
import { validateStatusTransition } from './order-transitions.config'

describe('validateStatusTransition', () => {
  describe('allowed transitions', () => {
    it.each([
      ['pending', 'cancelled'],
      ['paid', 'shipped'],
      ['paid', 'cancelled'],
      ['shipped', 'delivered'],
      ['shipped', 'cancelled'],
    ])('allows %s -> %s', (from, to) => {
      expect(() => validateStatusTransition(from, to as never)).not.toThrow()
    })
  })

  describe('disallowed transitions', () => {
    it.each([
      ['pending', 'paid'],
      ['pending', 'shipped'],
      ['pending', 'delivered'],
      ['paid', 'pending'],
      ['paid', 'delivered'],
      ['shipped', 'pending'],
      ['shipped', 'paid'],
      ['delivered', 'pending'],
      ['delivered', 'shipped'],
      ['delivered', 'cancelled'],
      ['cancelled', 'paid'],
      ['cancelled', 'shipped'],
      ['cancelled', 'delivered'],
    ])('rejects %s -> %s', (from, to) => {
      expect(() => validateStatusTransition(from, to as never)).toThrow(
        BadRequestException,
      )
    })

    it('rejects unknown current statuses', () => {
      expect(() => validateStatusTransition('unknown', 'paid')).toThrow(BadRequestException)
    })
  })

  describe('error message', () => {
    it('names both the current and target status', () => {
      try {
        validateStatusTransition('delivered', 'shipped')
        fail('expected transition to be rejected')
      } catch (err) {
        expect((err as Error).message).toBe(
          'Cannot transition order from "delivered" to "shipped".',
        )
      }
    })
  })
})
