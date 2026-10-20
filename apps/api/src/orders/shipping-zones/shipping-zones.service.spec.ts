import { ShippingZonesService } from './shipping-zones.service'
import { PrismaService } from '../../prisma/prisma.service'

/**
 * Unit tests for the admin shipping-zone surface.
 * The public route only exposes active zones, so the admin list must
 * return every zone (active and inactive) with its id, and the write
 * methods must reject duplicate names and unknown ids.
 */
describe('ShippingZonesService', () => {
  const zoneDelegate = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  }
  const prisma = { client: { shippingZone: zoneDelegate } }
  let service: ShippingZonesService

  beforeEach(() => {
    jest.resetAllMocks()
    service = new ShippingZonesService(prisma as unknown as PrismaService)
  })

  it('lists every zone including inactive ones, with ids', async () => {
    const zones = [
      { id: 'a', name: 'Nationwide', rate: 2500, active: true },
      { id: 'b', name: 'International', rate: 15000, active: false },
    ]
    zoneDelegate.findMany.mockResolvedValueOnce(zones)

    const result = await service.findAll()

    expect(result).toEqual(zones)
    expect(zoneDelegate.findMany).toHaveBeenCalledWith({
      select: { id: true, name: true, rate: true, active: true },
      orderBy: { createdAt: 'asc' },
    })
  })

  it('creates a zone', async () => {
    const created = { id: 'c', name: 'Lagos', rate: 3000, active: true }
    zoneDelegate.create.mockResolvedValueOnce(created)

    const result = await service.create({ name: 'Lagos', rate: 3000 })

    expect(result).toEqual(created)
  })

  it('rejects a duplicate zone name with a conflict', async () => {
    zoneDelegate.create.mockRejectedValueOnce({ code: 'P2002' })

    await expect(service.create({ name: 'Lagos', rate: 3000 })).rejects.toThrow(
      /already exists/i,
    )
  })

  it('throws not found when updating an unknown zone', async () => {
    zoneDelegate.findUnique.mockResolvedValueOnce(null)

    await expect(service.update('missing', { rate: 100 })).rejects.toThrow(/not found/i)
  })

  it('updates the rate of an existing zone', async () => {
    const existing = { id: 'a', name: 'Nationwide', rate: 2500, active: true }
    const updated = { ...existing, rate: 4000 }
    zoneDelegate.findUnique.mockResolvedValueOnce(existing)
    zoneDelegate.update.mockResolvedValueOnce(updated)

    const result = await service.update('a', { rate: 4000 })

    expect(result).toEqual(updated)
  })

  it('rejects an update that collides with another zone name', async () => {
    const existing = { id: 'a', name: 'Nationwide', rate: 2500, active: true }
    zoneDelegate.findUnique.mockResolvedValueOnce(existing)
    zoneDelegate.update.mockRejectedValueOnce({ code: 'P2002' })

    await expect(service.update('a', { name: 'Lagos' })).rejects.toThrow(/already exists/i)
  })
})
