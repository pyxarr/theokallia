import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import {
  AllowAnonymous,
  OptionalAuth,
  Session,
  UserSession,
} from '@thallesp/nestjs-better-auth'
import { CreateReviewDto } from './dto/create-review.dto'
import { UpdateReviewDto } from './dto/update-review.dto'
import { ReviewsService } from './reviews.service'

@ApiTags('Reviews')
@Controller('products/:slug/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // Create Review

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave a review for a product' })
  @ApiParam({
    name: 'slug',
    description: 'Product slug',
    example: 'temi-gold-bracelets',
  })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorised — not logged in' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({
    status: 409,
    description: 'You have already reviewed this product',
  })
  create(
    @Param('slug') slug: string,
    @Body() dto: CreateReviewDto,
    @Session() session: UserSession,
  ) {
    return this.reviewsService.create(slug, session.user.id, dto)
  }

  // List Reviews

  @Get()
  @AllowAnonymous()
  @ApiOperation({ summary: 'Get all reviews for a product' })
  @ApiParam({
    name: 'slug',
    description: 'Product slug',
    example: 'temi-gold-bracelets',
  })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findAll(@Param('slug') slug: string) {
    return this.reviewsService.findAllBySlug(slug)
  }

  // Review Eligibility
  // Public so the page can render for anonymous visitors too — the response
  // tells them to sign in rather than showing a form that would fail.

  @Get('eligibility')
  @AllowAnonymous()
  @OptionalAuth()
  @ApiOperation({
    summary: 'Whether the current visitor can review this product',
  })
  @ApiParam({
    name: 'slug',
    description: 'Product slug',
    example: 'temi-gold-bracelets',
  })
  eligibility(@Param('slug') slug: string, @Session() session?: UserSession) {
    return this.reviewsService.canReview(slug, session?.user?.id ?? null)
  }

  // Update Review

  @Patch(':reviewId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update your own review' })
  @ApiParam({
    name: 'slug',
    description: 'Product slug',
    example: 'temi-gold-bracelets',
  })
  @ApiParam({ name: 'reviewId', description: 'ID of the review to update' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorised — not logged in' })
  @ApiResponse({ status: 403, description: 'Forbidden — not your review' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  update(
    @Param('reviewId') reviewId: string,
    @Body() dto: UpdateReviewDto,
    @Session() session: UserSession,
  ) {
    return this.reviewsService.update(reviewId, session.user.id, dto)
  }

  // Delete Review

  @Delete(':reviewId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review — own review or admin' })
  @ApiParam({
    name: 'slug',
    description: 'Product slug',
    example: 'temi-gold-bracelets',
  })
  @ApiParam({ name: 'reviewId', description: 'ID of the review to delete' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorised — not logged in' })
  @ApiResponse({ status: 403, description: 'Forbidden — not your review' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  remove(@Param('reviewId') reviewId: string, @Session() session: UserSession) {
    return this.reviewsService.remove(
      reviewId,
      session.user.id,
      session.user.role as string,
    )
  }
}
