import { Prisma } from '@prisma/client'
import { SiteConfigService } from './site-config.service'
import { PrismaService } from '../prisma/prisma.service'

/**
 * Unit tests for the singleton site settings row.
 * The table only ever holds one row (id: 'singleton'), so the service
 * must create it with the schema defaults when it is missing and patch
 * only the fields the admin actually sent.
 */
describe('SiteConfigService', () => {
  const siteConfigDelegate = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  }
  const prisma = { client: { siteConfig: siteConfigDelegate } }
  let service: SiteConfigService

  beforeEach(() => {
    jest.resetAllMocks()
    service = new SiteConfigService(prisma as unknown as PrismaService)
  })

  it('reads a row with only the remaining settings columns', () => {
    // The welcome offer is a coupon now, so the site_config columns it
    // used are gone. The Prisma data model is the row shape this
    // service hands out.
    const model = Prisma.dmmf.datamodel.models.find(
      (candidate) => candidate.name === 'SiteConfig',
    )

    expect(model).toBeDefined()
    expect(model?.fields.map((field) => field.name).sort()).toEqual([
      'id',
      'updatedAt',
      'vipOrderThreshold',
      'vipSpendThreshold',
    ])
  })

  it('returns the existing singleton row without creating one', async () => {
    const row = {
      id: 'singleton',
      vipOrderThreshold: 3,
      vipSpendThreshold: 200000,
    }
    siteConfigDelegate.findUnique.mockResolvedValueOnce(row)

    const result = await service.get()

    expect(result).toEqual(row)
    expect(siteConfigDelegate.findUnique).toHaveBeenCalledWith({
      where: { id: 'singleton' },
    })
    expect(siteConfigDelegate.create).not.toHaveBeenCalled()
  })

  it('creates the singleton row with schema defaults when it is absent', async () => {
    const created = {
      id: 'singleton',
      vipOrderThreshold: 3,
      vipSpendThreshold: 200000,
    }
    siteConfigDelegate.findUnique.mockResolvedValueOnce(null)
    siteConfigDelegate.create.mockResolvedValueOnce(created)

    const result = await service.get()

    expect(result).toEqual(created)
    expect(siteConfigDelegate.create).toHaveBeenCalledTimes(1)
    expect(siteConfigDelegate.create).toHaveBeenCalledWith({
      data: { id: 'singleton' },
    })
  })

  it('applies only the provided fields on update', async () => {
    const updated = { id: 'singleton', vipOrderThreshold: 5 }
    siteConfigDelegate.findUnique.mockResolvedValueOnce({ id: 'singleton' })
    siteConfigDelegate.update.mockResolvedValueOnce(updated)

    const result = await service.update({ vipOrderThreshold: 5 })

    expect(result).toEqual(updated)
    expect(siteConfigDelegate.update).toHaveBeenCalledWith({
      where: { id: 'singleton' },
      data: { vipOrderThreshold: 5 },
    })
  })

  it('creates the row before updating when it does not exist yet', async () => {
    siteConfigDelegate.findUnique.mockResolvedValueOnce(null)
    siteConfigDelegate.create.mockResolvedValueOnce({ id: 'singleton' })
    siteConfigDelegate.update.mockResolvedValueOnce({
      id: 'singleton',
      vipOrderThreshold: 5,
    })

    await service.update({ vipOrderThreshold: 5 })

    expect(siteConfigDelegate.create).toHaveBeenCalledTimes(1)
    expect(siteConfigDelegate.update).toHaveBeenCalledTimes(1)
  })

  it('re-reads the row when a concurrent request created it first', async () => {
    const created = {
      id: 'singleton',
      vipOrderThreshold: 3,
      vipSpendThreshold: 200000,
    }
    // First read: no row. Second read (after the create lost the race):
    // the row the winner wrote.
    siteConfigDelegate.findUnique.mockResolvedValueOnce(null)
    siteConfigDelegate.create.mockRejectedValueOnce({ code: 'P2002' })
    siteConfigDelegate.findUnique.mockResolvedValueOnce(created)

    const result = await service.get()

    expect(result).toEqual(created)
    expect(siteConfigDelegate.create).toHaveBeenCalledTimes(1)
    expect(siteConfigDelegate.findUnique).toHaveBeenCalledTimes(2)
  })

  it('re-throws the original error when the re-read finds nothing', async () => {
    const failure = { code: 'P2002' }
    siteConfigDelegate.findUnique.mockResolvedValueOnce(null)
    siteConfigDelegate.create.mockRejectedValueOnce(failure)
    siteConfigDelegate.findUnique.mockResolvedValueOnce(null)

    await expect(service.get()).rejects.toBe(failure)
  })
})
