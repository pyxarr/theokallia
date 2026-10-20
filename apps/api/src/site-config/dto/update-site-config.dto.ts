import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator'

/**
 * DTO for patching the singleton site settings row.
 * There is no create DTO — the row is created by the service with the
 * schema defaults, never by a client — so every field is optional.
 */
export class UpdateSiteConfigDto {
  /** Number of completed orders that promotes a customer to VIP. */
  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(0)
  vipOrderThreshold?: number

  /** Lifetime NGN spend that promotes a customer to VIP. */
  @ApiPropertyOptional({ example: 200000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  vipSpendThreshold?: number

  /** Percentage off granted by the welcome discount coupon. */
  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  welcomeDiscountPercent?: number

  /** Minimum NGN order subtotal required for the welcome discount. */
  @ApiPropertyOptional({ example: 20000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  welcomeDiscountMinOrder?: number

  /** Days from coupon creation until the welcome discount expires. */
  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  welcomeDiscountExpiry?: number
}
