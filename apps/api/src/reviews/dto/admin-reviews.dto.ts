import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, Min, Max } from 'class-validator'
import type { ModerationStatus } from '@theokallia/types'

export type { ModerationStatus } from '@theokallia/types'

/** Why the write-review form is hidden for the current visitor. */
export type ReviewEligibilityReason =
  'signin' | 'not-purchased' | 'already-reviewed'

/** Filter for the admin moderation queue. */
export class AdminReviewsFilterDto {
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected'])
  status?: ModerationStatus

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number
}

/**
 * Moderation decision for a review. Only the two terminal states are accepted —
 * 'pending' is the creation state and is never set by an admin.
 */
export class ModerateReviewDto {
  @IsIn(['approved', 'rejected'])
  status: Exclude<ModerationStatus, 'pending'>
}
