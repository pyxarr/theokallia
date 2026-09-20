import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { ReviewsService } from './reviews.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateReviewDto } from './dto/create-review.dto'

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
    create: jest.fn(),
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
      orderDelegate.findFirst.mockResolvedValueOnce({ id: 'ord_1', status: 'paid' })
      reviewDelegate.create.mockResolvedValueOnce({
        id: 'rev_1',
        rating: 5,
        comment: 'Nice bracelet',
        status: 'pending',
      })

      await service.create(slug, userId, { rating: 5, comment: 'Nice bracelet' })

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

      await expect(service.findAllBySlug(slug)).rejects.toBeInstanceOf(NotFoundException)
      expect(reviewDelegate.findMany).not.toHaveBeenCalled()
    })
  })
})
