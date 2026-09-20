import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    ConflictException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateReviewDto } from './dto/create-review.dto'
import { UpdateReviewDto } from './dto/update-review.dto'

@Injectable()
export class ReviewsService {
    constructor(private readonly prisma: PrismaService) { }

    // Create Review
    // A user can only leave one review per product.
    // We look up the product by slug first to get its id,
    // then check if the user already has a review for it.

    async create(slug: string, userId: string, dto: CreateReviewDto) {
        // find product by slug
        const product = await this.prisma.client.product.findUnique({
            where: { slug },
        })

        if (!product) {
            throw new NotFoundException(`Product with slug "${slug}" not found`)
        }

        // prevent duplicate reviews from the same user
        const existing = await this.prisma.client.review.findFirst({
            where: { productId: product.id, userId },
        })

        if (existing) {
            throw new ConflictException('You have already reviewed this product')
        }

        // §8.1 — purchase verification: a review is only allowed for products the user has bought
        const hasPurchased = await this.prisma.client.order.findFirst({
            where: {
                userId,
                status: { in: ['paid', 'shipped', 'delivered'] },
                items: { some: { productId: product.id } },
            },
        })

        if (!hasPurchased) {
            throw new ForbiddenException('You can only review products you have purchased.')
        }

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

    async findAllBySlug(slug: string) {
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
}