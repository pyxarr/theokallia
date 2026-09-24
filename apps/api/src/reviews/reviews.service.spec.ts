import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { ReviewsService } from './reviews.service'
import { PrismaService } from '../prisma/prisma.service'

/**
 * Unit tests for review purchase verification (§8.1) and moderation
 * filtering (§8.2) added in Phase 4.
 *
 * A review can only be created by a user who has a paid/shipped/delivered
 * order containing the product, and the public listing must expose only
 * status === 'approved' reviews (pending/rejected are hidden).
 */
describe('ReviewsService', () => {
  const productDelegate = { findUnique: jest.fn() }
  const orderDelegate = { findFirst: jest.fn() }
  const reviewDelegate = {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  }
  const prisma = {
    client: {
      product: productDelegate,
      order: orderDelegate,
      review: reviewDelegate,
    },
  }
  let service: ReviewsService

  const slug = 'temi-gold-bracelet'
  const userId = 'usr_1'
  const product = { id: 'prod_1', slug, name: 'Temi Gold Bracelet' }

  beforeEach(() => {
    jest.resetAllMocks()
    service = new ReviewsService(prisma as unknown as PrismaService)
  })

  describe('create', () => {
    it('throws NotFoundException when the product does not exist', async () => {
      productDelegate.findUnique.mockResolvedValueOnce(null)

      await expect(
        service.create(slug, userId, { rating: 5, comment: 'Nice bracelet' }),
      ).rejects.toBeInstanceOf(NotFoundException)
      expect(orderDelegate.findFirst).not.toHaveBeenCalled()
      expect(reviewDelegate.create).not.toHaveBeenCalled()
    })

    it('throws ForbiddenException when the user has not purchased the product', async () => {
      productDelegate.findUnique.mockResolvedValueOnce(product)
      reviewDelegate.findFirst.mockResolvedValueOnce(null) // no prior review
      orderDelegate.findFirst.mockResolvedValueOnce(null) // no qualifying order

      await expect(
        service.create(slug, userId, { rating: 5, comment: 'Nice bracelet' }),
      ).rejects.toBeInstanceOf(ForbiddenException)
      expect(reviewDelegate.create).not.toHaveBeenCalled()
    })

    it('throws ForbiddenException when the only matching order is cancelled', async () => {
      productDelegate.findUnique.mockResolvedValueOnce(product)
      reviewDelegate.findFirst.mockResolvedValueOnce(null)
      // 'cancelled' is excluded by the paid/shipped/delivered filter, so no qualifying order
      orderDelegate.findFirst.mockResolvedValueOnce(null)

      await expect(
        service.create(slug, userId, { rating: 5, comment: 'Nice bracelet' }),
      ).rejects.toBeInstanceOf(ForbiddenException)
    })

    it('throws ConflictException if the user already reviewed the product', async () => {
      productDelegate.findUnique.mockResolvedValueOnce(product)
      reviewDelegate.findFirst.mockResolvedValueOnce({
        id: 'rev_1',
        productId: product.id,
        userId,
      })

      await expect(
        service.create(slug, userId, { rating: 5, comment: 'Nice bracelet' }),
      ).rejects.toBeInstanceOf(ConflictException)
      expect(orderDelegate.findFirst).not.toHaveBeenCalled()
      expect(reviewDelegate.create).not.toHaveBeenCalled()
    })

    it('creates a pending review for a purchaser', async () => {
      productDelegate.findUnique.mockResolvedValueOnce(product)
      reviewDelegate.findFirst.mockResolvedValueOnce(null)
      orderDelegate.findFirst.mockResolvedValueOnce({
        id: 'ord_1',
        status: 'paid',
      })
      reviewDelegate.create.mockResolvedValueOnce({
        id: 'rev_1',
        rating: 5,
        comment: 'Nice bracelet',
        status: 'pending',
      })

      await service.create(slug, userId, {
        rating: 5,
        comment: 'Nice bracelet',
      })

      const call = reviewDelegate.create.mock.calls[0][0]
      expect(call.data.status).toBe('pending')
      expect(call.data.productId).toBe(product.id)
      expect(call.data.userId).toBe(userId)
    })
  })

  describe('findAllBySlug', () => {
    it('returns only approved reviews and computes the summary from them', async () => {
      productDelegate.findUnique.mockResolvedValueOnce({ id: product.id })
      reviewDelegate.findMany.mockResolvedValueOnce([
        {
          id: 'rev_1',
          rating: 5,
          status: 'approved',
          user: { firstName: 'Ada', lastName: 'Lovelace' },
        },
      ])

      const result = await service.findAllBySlug(slug)

      expect(reviewDelegate.findMany).toHaveBeenCalledWith({
        where: { productId: product.id, status: 'approved' },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true } } },
      })
      expect(result.reviews).toHaveLength(1)
      expect(result.rating).toBe(5)
      expect(result.reviewCount).toBe(1)
    })

    it('throws NotFoundException when the product does not exist', async () => {
      productDelegate.findUnique.mockResolvedValueOnce(null)

      await expect(service.findAllBySlug(slug)).rejects.toBeInstanceOf(
        NotFoundException,
      )
      expect(reviewDelegate.findMany).not.toHaveBeenCalled()
    })
  })

  describe('findAllAdmin', () => {
    it('lists every status when no filter is given, newest first', async () => {
      reviewDelegate.findMany.mockResolvedValueOnce([
        { id: 'rev_1', status: 'pending' },
      ])
      reviewDelegate.count.mockResolvedValueOnce(1)

      const result = await service.findAllAdmin({})

      expect(reviewDelegate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 20,
        }),
      )
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      })
      expect(productDelegate.findUnique).not.toHaveBeenCalled()
    })

    it('filters by status and paginates', async () => {
      reviewDelegate.findMany.mockResolvedValueOnce([])
      reviewDelegate.count.mockResolvedValueOnce(45)

      const result = await service.findAllAdmin({
        status: 'pending',
        page: 3,
        limit: 20,
      })

      expect(reviewDelegate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'pending' },
          skip: 40,
          take: 20,
        }),
      )
      expect(result.meta.totalPages).toBe(3)
    })
  })

  describe('countByStatusAdmin', () => {
    it('returns a count per status', async () => {
      reviewDelegate.count
        .mockResolvedValueOnce(4) // pending
        .mockResolvedValueOnce(9) // approved
        .mockResolvedValueOnce(1) // rejected

      await expect(service.countByStatusAdmin()).resolves.toEqual({
        pending: 4,
        approved: 9,
        rejected: 1,
      })
    })
  })

  describe('moderate', () => {
    it('throws NotFoundException for an unknown review', async () => {
      reviewDelegate.findUnique.mockResolvedValueOnce(null)

      await expect(
        service.moderate('missing', 'approved'),
      ).rejects.toBeInstanceOf(NotFoundException)
      expect(reviewDelegate.update).not.toHaveBeenCalled()
    })

    it('approves a pending review', async () => {
      reviewDelegate.findUnique.mockResolvedValueOnce({
        id: 'rev_1',
        status: 'pending',
      })
      reviewDelegate.update.mockResolvedValueOnce({
        id: 'rev_1',
        status: 'approved',
      })

      await service.moderate('rev_1', 'approved')

      expect(reviewDelegate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rev_1' },
          data: { status: 'approved' },
        }),
      )
    })

    it('allows reversing a decision (rejected -> approved)', async () => {
      reviewDelegate.findUnique.mockResolvedValueOnce({
        id: 'rev_1',
        status: 'rejected',
      })
      reviewDelegate.update.mockResolvedValueOnce({
        id: 'rev_1',
        status: 'approved',
      })

      await service.moderate('rev_1', 'approved')

      expect(reviewDelegate.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'approved' } }),
      )
    })
  })

  describe('removeAdmin', () => {
    it('throws NotFoundException for an unknown review', async () => {
      reviewDelegate.findUnique.mockResolvedValueOnce(null)

      await expect(service.removeAdmin('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      )
      expect(reviewDelegate.delete).not.toHaveBeenCalled()
    })

    it('deletes any review regardless of author', async () => {
      reviewDelegate.findUnique.mockResolvedValueOnce({
        id: 'rev_1',
        userId: 'someone-else',
      })
      reviewDelegate.delete.mockResolvedValueOnce({ id: 'rev_1' })

      const result = await service.removeAdmin('rev_1')

      expect(reviewDelegate.delete).toHaveBeenCalledWith({
        where: { id: 'rev_1' },
      })
      expect(result).toEqual({ message: 'Review deleted successfully' })
    })
  })

  describe('canReview', () => {
    it('throws NotFoundException when the product does not exist', async () => {
      productDelegate.findUnique.mockResolvedValueOnce(null)

      await expect(service.canReview(slug, userId)).rejects.toBeInstanceOf(
        NotFoundException,
      )
      expect(reviewDelegate.findFirst).not.toHaveBeenCalled()
    })

    it('asks anonymous visitors to sign in without running further checks', async () => {
      productDelegate.findUnique.mockResolvedValueOnce(product)

      await expect(service.canReview(slug, null)).resolves.toEqual({
        canReview: false,
        reason: 'signin',
      })
      expect(reviewDelegate.findFirst).not.toHaveBeenCalled()
      expect(orderDelegate.findFirst).not.toHaveBeenCalled()
    })

    it('reports already-reviewed regardless of review status', async () => {
      productDelegate.findUnique.mockResolvedValueOnce(product)
      reviewDelegate.findFirst.mockResolvedValueOnce({
        id: 'rev_1',
        status: 'pending',
      })

      await expect(service.canReview(slug, userId)).resolves.toEqual({
        canReview: false,
        reason: 'already-reviewed',
      })
      expect(orderDelegate.findFirst).not.toHaveBeenCalled()
    })

    it('reports not-purchased when no qualifying order exists', async () => {
      productDelegate.findUnique.mockResolvedValueOnce(product)
      reviewDelegate.findFirst.mockResolvedValueOnce(null)
      orderDelegate.findFirst.mockResolvedValueOnce(null)

      await expect(service.canReview(slug, userId)).resolves.toEqual({
        canReview: false,
        reason: 'not-purchased',
      })
    })

    it('allows a purchaser who has not reviewed yet', async () => {
      productDelegate.findUnique.mockResolvedValueOnce(product)
      reviewDelegate.findFirst.mockResolvedValueOnce(null)
      orderDelegate.findFirst.mockResolvedValueOnce({
        id: 'ord_1',
        status: 'delivered',
      })

      await expect(service.canReview(slug, userId)).resolves.toEqual({
        canReview: true,
      })
    })
  })
})
