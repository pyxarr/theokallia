import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'

export type CouponType = 'percent' | 'fixed' | 'free_shipping'
export type CouponScope = 'storewide' | 'category' | 'product'

/**
 * DTO for creating a new coupon.
 * Code is uppercased before storage and enforced unique at the DB level.
 * `usedCount`, `createdAt`, and `updatedAt` are managed by Prisma — never set here.
 */
export class CreateCouponDto {
  /** Unique alphanumeric code (e.g. "WELCOME10"). Stored uppercased. */
  @ApiProperty({ example: 'WELCOME10' })
  @IsString()
  @IsNotEmpty()
  code: string

  /** Discount type: percentage off, fixed NGN amount, or free shipping. */
  @ApiProperty({ enum: ['percent', 'fixed', 'free_shipping'], example: 'percent' })
  @IsIn(['percent', 'fixed', 'free_shipping'])
  type: CouponType

  /**
   * For `percent`: the percentage (e.g. 10 = 10%).
   * For `fixed`: the NGN amount to subtract.
   * For `free_shipping`: ignored — the discount equals the shipping fee.
   */
  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  value: number

  /** Scope limits which cart items the discount applies to. */
  @ApiPropertyOptional({ enum: ['storewide', 'category', 'product'], default: 'storewide' })
  @IsOptional()
  @IsIn(['storewide', 'category', 'product'])
  scope?: CouponScope

  /**
   * Required when scope is `category` (categoryId) or `product` (productId).
   * Ignored when scope is `storewide`.
   */
  @ApiPropertyOptional({ example: 'cat_123', description: 'Category or product ID' })
  @IsOptional()
  @IsString()
  scopeId?: string

  /** Minimum order subtotal (NGN) required before the coupon can be applied. */
  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrder?: number

  /** Maximum total redemptions across all users. `null` = unlimited. */
  @ApiPropertyOptional({ example: 100, description: 'null = unlimited' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number

  /** Maximum redemptions per user. `null` = unlimited per user. Enforced in application logic. */
  @ApiPropertyOptional({ example: 1, description: 'null = unlimited per user' })
  @IsOptional()
  @IsInt()
  @Min(1)
  perUserLimit?: number

  /** ISO date string after which the coupon is no longer valid. Omit for no expiry. */
  @ApiPropertyOptional({ example: '2025-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string

  /** Whether the coupon is currently active and can be redeemed. */
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean
}
