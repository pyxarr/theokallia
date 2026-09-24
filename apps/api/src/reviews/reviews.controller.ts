import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
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
import {
  AdminReviewsFilterDto,
  ModerateReviewDto,
} from './dto/admin-reviews.dto'
import { ReviewsService } from './reviews.service'
import { RolesGuard, Roles } from '../auth/guards/roles.guard'

@ApiTags('Reviews')
@Controller('products/:slug/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ============ PUBLIC ENDPOINTS ============

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

  // ============ USER ENDPOINTS (authenticated) ============

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

  // ============ ADMIN ENDPOINTS ============

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List reviews for moderation (admin only)' })
  findAllAdmin(@Query() filters: AdminReviewsFilterDto) {
    return this.reviewsService.findAllAdmin(filters)
  }

  @Get('admin/counts')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Count reviews per status (admin only)' })
  counts() {
    return this.reviewsService.countByStatusAdmin()
  }

  @Patch('admin/:reviewId/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or reject a review (admin only)' })
  moderate(
    @Param('reviewId') reviewId: string,
    @Body() dto: ModerateReviewDto,
  ) {
    return this.reviewsService.moderate(reviewId, dto.status)
  }

  @Delete('admin/:reviewId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete any review (admin only)' })
  removeAdmin(@Param('reviewId') reviewId: string) {
    return this.reviewsService.removeAdmin(reviewId)
  }
}
