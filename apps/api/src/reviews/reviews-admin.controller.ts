import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ReviewsService } from './reviews.service'
import {
  AdminReviewsFilterDto,
  ModerateReviewDto,
} from './dto/admin-reviews.dto'
import { RolesGuard, Roles } from '../auth/guards/roles.guard'

/**
 * Review moderation for the admin dashboard.
 *
 * Reviews are created as 'pending' and the storefront only lists 'approved'
 * ones, so without these routes a review can never become visible. The whole
 * controller is admin-only — the guard runs before every handler.
 */
@ApiTags('Reviews (admin)')
@Controller('reviews/admin')
@UseGuards(RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class ReviewsAdminController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * GET /reviews/admin
   * Moderation queue with optional status filter and pagination.
   */
  @Get()
  @ApiOperation({ summary: 'List reviews for moderation (admin only)' })
  findAll(@Query() filters: AdminReviewsFilterDto) {
    return this.reviewsService.findAllAdmin(filters)
  }

  /**
   * GET /reviews/admin/counts
   * Per-status totals for the moderation tabs.
   */
  @Get('counts')
  @ApiOperation({ summary: 'Count reviews per status (admin only)' })
  counts() {
    return this.reviewsService.countByStatusAdmin()
  }

  /**
   * PATCH /reviews/admin/:reviewId/status
   * Approves or rejects a review.
   */
  @Patch(':reviewId/status')
  @ApiOperation({ summary: 'Approve or reject a review (admin only)' })
  moderate(
    @Param('reviewId') reviewId: string,
    @Body() dto: ModerateReviewDto,
  ) {
    return this.reviewsService.moderate(reviewId, dto.status)
  }

  /**
   * DELETE /reviews/admin/:reviewId
   * Deletes any review regardless of author.
   */
  @Delete(':reviewId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete any review (admin only)' })
  remove(@Param('reviewId') reviewId: string) {
    return this.reviewsService.removeAdmin(reviewId)
  }
}
