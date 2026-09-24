import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateReviewDto } from './dto/create-review.dto'
import { UpdateReviewDto } from './dto/update-review.dto'
import {
  AdminReviewsFilterDto,
  ModerationStatus,
  ReviewEligibilityReason,
} from './dto/admin-reviews.dto'

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  // Create Review
  // A user can only leave one review per product.
  // We look up the product by slug first to get its id,
  // then check if the user already has a review for it.

  async create(slug: string, userId: string, dto: CreateReviewDto) {
    const eligibility = await this.checkReviewEligibility(slug, userId)

    if (!eligibility.canReview) {
      if (eligibility.reason === 'already-reviewed') {
        throw new ConflictException('You have already reviewed this product')
      }
      throw new ForbiddenException(
        'You can only review products you have purchased.',
      )
    }

    const product = await this.prisma.client.product.findUnique({
      where: { slug },
    })

    return this.prisma.client.review.create({
      data: {
        rating: dto.rating,
        comment: dto.comment,
        productId: product.id,
        userId,
        status: 'pending',
      },
      // return reviewer's name alongside the review
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })
  }

  // List Reviews
  // Returns all reviews for a product ordered by newest first.
  // Also returns computed rating summary so the frontend
  // doesn't need a separate request for it.

  async findAllBySlug(slug: string, limit = 50) {
    // verify the product exists
    const product = await this.prisma.client.product.findUnique({
      where: { slug },
    })

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`)
    }

    const reviews = await this.prisma.client.review.findMany({
      where: { productId: product.id, status: 'approved' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // compute rating summary from reviews
    const reviewCount = reviews.length
    const rating =
      reviewCount > 0
        ? parseFloat(
            (
              reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
            ).toFixed(1),
          )
        : 0

    // build star breakdown — count how many reviews have each star rating
    // after
    const ratingBreakdown: Record<1 | 2 | 3 | 4 | 5, number> = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    }
    for (const review of reviews) {
      const star = review.rating as 1 | 2 | 3 | 4 | 5
      ratingBreakdown[star]++
    }

    return { reviews, rating, reviewCount, ratingBreakdown }
  }

  // Shared eligibility check used by create() and canReview()
  private async checkReviewEligibility(
    slug: string,
    userId: string,
  ): Promise<{ canReview: true } | { canReview: false; reason: ReviewEligibilityReason }> {
    const product = await this.prisma.client.product.findUnique({
      where: { slug },
    })

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`)
    }

    const existing = await this.prisma.client.review.findFirst({
      where: { productId: product.id, userId },
    })

    if (existing) {
      return { canReview: false, reason: 'already-reviewed' as const }
    }

    const hasPurchased = await this.prisma.client.order.findFirst({
      where: {
        userId,
        status: { in: ['paid', 'shipped', 'delivered'] },
        items: { some: { productId: product.id } },
      },
    })

    if (!hasPurchased) {
      return { canReview: false, reason: 'not-purchased' as const }
    }

    return { canReview: true }
  }

  // Update Review
  // Only the review author can update their own review.
  // We verify ownership before applying any changes.

  async update(reviewId: string, userId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.client.review.findUnique({
      where: { id: reviewId },
    })

    if (!review) {
      throw new NotFoundException(`Review not found`)
    }

    // block any user who didn't write this review
    if (review.userId !== userId) {
      throw new ForbiddenException('You can only edit your own reviews')
    }

    return this.prisma.client.review.update({
      where: { id: reviewId },
      data: {
        ...(dto.rating !== undefined && { rating: dto.rating }),
        ...(dto.comment !== undefined && { comment: dto.comment }),
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })
  }

  // Delete Review
  // A user can delete their own review.
  // An admin can delete any review.

  async remove(reviewId: string, userId: string, userRole: string) {
    const review = await this.prisma.client.review.findUnique({
      where: { id: reviewId },
    })

    if (!review) {
      throw new NotFoundException(`Review not found`)
    }

    // allow if admin OR the review author
    if (userRole !== 'admin' && review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews')
    }

    await this.prisma.client.review.delete({
      where: { id: reviewId },
    })

    return { message: 'Review deleted successfully' }
  }

  // Review eligibility — drives whether the storefront renders the write form.
  // Mirrors the create() rules up front so the form only appears for a signed-in
  // buyer who hasn't reviewed yet; anonymous visitors get 'signin'.
  async canReview(
    slug: string,
    userId: string | null,
  ): Promise<
    { canReview: true } | { canReview: false; reason: ReviewEligibilityReason }
  > {
    if (!userId) {
      return { canReview: false, reason: 'signin' as const }
    }

    return this.checkReviewEligibility(slug, userId)
  }

  // Admin — Moderation Queue
  // Reviews are created as 'pending' and only 'approved' ones reach the
  // storefront, so these methods are the only way a review becomes visible.

  async findAllAdmin(filters: AdminReviewsFilterDto) {
    const { status, page = 1, limit = 20 } = filters
    const skip = (page - 1) * limit
    const where = status ? { status } : {}

    const [data, total] = await Promise.all([
      this.prisma.client.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.client.review.count({ where }),
    ])

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  // Per-status totals for the moderation tabs.
  async countByStatusAdmin() {
    const [pending, approved, rejected] = await Promise.all([
      this.prisma.client.review.count({ where: { status: 'pending' } }),
      this.prisma.client.review.count({ where: { status: 'approved' } }),
      this.prisma.client.review.count({ where: { status: 'rejected' } }),
    ])

    return { pending, approved, rejected }
  }

  // Approve or reject a review. Re-moderating an already-decided review is
  // allowed so a mistaken decision can be reversed.
  async moderate(
    reviewId: string,
    status: Exclude<ModerationStatus, 'pending'>,
  ) {
    const review = await this.prisma.client.review.findUnique({
      where: { id: reviewId },
    })

    if (!review) {
      throw new NotFoundException('Review not found')
    }

    return this.prisma.client.review.update({
      where: { id: reviewId },
      data: { status },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        product: { select: { id: true, name: true, slug: true } },
      },
    })
  }

  // Admin delete — any review, regardless of who wrote it.
  async removeAdmin(reviewId: string) {
    const review = await this.prisma.client.review.findUnique({
      where: { id: reviewId },
    })

    if (!review) {
      throw new NotFoundException('Review not found')
    }

    await this.prisma.client.review.delete({
      where: { id: reviewId },
    })

    return { message: 'Review deleted successfully' }
  }
}
