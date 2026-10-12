import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator'
import type { CouponScope, CouponType } from '@theokallia/types'

/**
 * Query DTO for the admin coupon list.
 * Search, type, scope and active narrow the result; pagination mirrors the
 * subscribers and products listings.
 */
export class FilterCouponsDto {
  /** Case-insensitive match against the coupon code. */
  @ApiPropertyOptional({ example: 'WELCOME' })
  @IsOptional()
  @IsString()
  q?: string

  /**
   * Restrict to active or inactive coupons. String form on purpose:
   * `@Type(() => Boolean)` would coerce the literal 'false' to true.
   */
  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  @IsIn(['true', 'false'])
  active?: string

  /** Restrict to a single discount type. */
  @ApiPropertyOptional({ enum: ['percent', 'fixed', 'free_shipping'] })
  @IsOptional()
  @IsIn(['percent', 'fixed', 'free_shipping'])
  type?: CouponType

  /** Restrict to a single scope. */
  @ApiPropertyOptional({ enum: ['storewide', 'category', 'product'] })
  @IsOptional()
  @IsIn(['storewide', 'category', 'product'])
  scope?: CouponScope

  /** Current page number — defaults to 1. */
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  /** Number of coupons per page — defaults to 20. */
  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number
}