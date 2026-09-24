import { ContentService } from './content.service'
import { PrismaService } from '../prisma/prisma.service'

/**
 * Unit tests for the Phase 5 content-block query filters.
 * Public reads must be limited to active blocks inside their start/end window
 * (null bounds meaning "no restriction") and returned in sortOrder ascending.
 * Admin reads return every block unfiltered.
 */
describe('ContentService', () => {
  const contentBlockDelegate = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
  const prisma = { client: { contentBlock: contentBlockDelegate } }
  let service: ContentService

  beforeEach(() => {
    jest.resetAllMocks()
    service = new ContentService(prisma as unknown as PrismaService)
  })

  describe('findAll (public)', () => {
    it('filters to active blocks inside their start/end window and sorts by sortOrder', async () => {
      contentBlockDelegate.findMany.mockResolvedValueOnce([])
      const before = new Date()

      await service.findAll()

      const args = contentBlockDelegate.findMany.mock.calls[0][0]
      expect(args.orderBy).toEqual({ sortOrder: 'asc' })
      expect(args.where.active).toBe(true)

      // Two independent OR windows: startsAt (already open) and endsAt (not yet passed)
      expect(args.where.AND).toHaveLength(2)
      expect(args.where.AND[0].OR[0]).toEqual({ startsAt: null })
      expect(args.where.AND[1].OR[0]).toEqual({ endsAt: null })

      const startsAtBound = args.where.AND[0].OR[1].startsAt.lte
      const endsAtBound = args.where.AND[1].OR[1].endsAt.gte
      expect(startsAtBound).toBeInstanceOf(Date)
      expect(endsAtBound).toBeInstanceOf(Date)
      expect(startsAtBound.getTime()).toBeGreaterThanOrEqual(before.getTime())
    })

    it('omits the type filter when none is supplied', async () => {
      contentBlockDelegate.findMany.mockResolvedValueOnce([])

      await service.findAll()

      expect(contentBlockDelegate.findMany.mock.calls[0][0].where.type).toBeUndefined()
    })

    it('applies the optional type filter', async () => {
      contentBlockDelegate.findMany.mockResolvedValueOnce([])

      await service.findAll({ type: 'promotion' })

      expect(contentBlockDelegate.findMany.mock.calls[0][0].where.type).toBe('promotion')
    })
  })

  describe('findAllForAdmin', () => {
    it('returns every block unfiltered, sorted by sortOrder', async () => {
      contentBlockDelegate.findMany.mockResolvedValueOnce([])

      await service.findAllForAdmin()

      expect(contentBlockDelegate.findMany).toHaveBeenCalledWith({
        orderBy: { sortOrder: 'asc' },
      })
    })
  })
})
