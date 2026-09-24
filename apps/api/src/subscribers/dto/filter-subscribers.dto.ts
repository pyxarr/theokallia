import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'

export type SubscriberTag = 'guest' | 'registered' | 'vip'

/**
 * Query DTO for the admin subscriber list.
 * `tag` narrows the result to a single tag; pagination mirrors the products listing.
 */
export class FilterSubscribersDto {
  /** Optional tag filter. */
  @ApiPropertyOptional({ enum: ['guest', 'registered', 'vip'] })
  @IsOptional()
  @IsIn(['guest', 'registered', 'vip'])
  tag?: SubscriberTag

  /** Case-insensitive match against the subscriber email. */
  @ApiPropertyOptional({ example: 'ada@example.com' })
  @IsOptional()
  @IsString()
  q?: string

  /**
   * Restrict to active or archived subscribers. String form on purpose:
   * `@Type(() => Boolean)` would coerce the literal 'false' to true.
   */
  @ApiPropertyOptional({ example: 'false' })
  @IsOptional()
  @IsIn(['true', 'false'])
  active?: string

  /** Current page number — defaults to 1. */
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  /** Number of subscribers per page — defaults to 20. */
  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number
}

/**
 * Body for the admin active toggle. Tags are engine-managed and cannot be
 * edited here; `active: false` archives the subscriber and marks the Resend
 * contact unsubscribed, while `active: true` reactivates them.
 */
export class SetSubscriberActiveDto {
  /** Desired active state. */
  @IsBoolean()
  active: boolean
}
