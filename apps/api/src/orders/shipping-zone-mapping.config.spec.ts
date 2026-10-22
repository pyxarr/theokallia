/**
 * Unit tests for the state-to-zone resolution.
 *
 * The lookup deliberately does NOT filter on `active`: an inactive zone
 * still has to be found, so the caller can refuse the order with a clear
 * "not currently available" message instead of silently falling through
 * to the "Nationwide" fallback and charging the wrong rate.
 */
describe('resolveShippingZone', () => {
  const findFirst = jest.fn()

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn().mockImplementation(() => ({
        shippingZoneState: { findFirst },
      })),
    }))
  })

  afterEach(() => {
    jest.dontMock('@prisma/client')
  })

  const loadResolver = async () => {
    const module = await import('./shipping-zone-mapping.config')
    return module.resolveShippingZone
  }

  it('resolves a non-Nigerian address to International', async () => {
    const resolveShippingZone = await loadResolver()

    const zone = await resolveShippingZone({
      state: 'Ontario',
      country: 'Canada',
    })

    expect(zone).toBe('International')
    expect(findFirst).not.toHaveBeenCalled()
  })

  it('resolves a mapped Nigerian state to the zone of the state row', async () => {
    findFirst.mockResolvedValueOnce({
      shippingZone: { name: 'Lagos' },
    })
    const resolveShippingZone = await loadResolver()

    const zone = await resolveShippingZone({
      state: 'Lagos',
      country: 'Nigeria',
    })

    expect(zone).toBe('Lagos')
  })

  it('does not filter the lookup on the zone being active', async () => {
    findFirst.mockResolvedValueOnce({
      shippingZone: { name: 'Lagos' },
    })
    const resolveShippingZone = await loadResolver()

    await resolveShippingZone({ state: 'Lagos', country: 'Nigeria' })

    // No `shippingZone: { active: true }` filter: an inactive zone has
    // to be found so the order can be refused with a clear message.
    expect(findFirst).toHaveBeenCalledWith({
      where: { state: { equals: 'lagos', mode: 'insensitive' } },
      select: { shippingZone: { select: { name: true } } },
    })
  })

  it('falls back to Nationwide for an unmapped Nigerian state', async () => {
    findFirst.mockResolvedValueOnce(null)
    const resolveShippingZone = await loadResolver()

    const zone = await resolveShippingZone({
      state: 'Bauchi',
      country: 'Nigeria',
    })

    expect(zone).toBe('Nationwide')
  })
})
