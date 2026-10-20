import { ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsDefined,
  IsInt,
  IsNumber,
  Max,
  Min,
  ValidateIf,
} from 'class-validator'

/**
 * DTO for patching the singleton site settings row.
 * There is no create DTO — the row is created by the service with the
 * schema defaults, never by a client — so every field is optional.
 *
 * A field may be omitted (it is then left untouched — PATCH semantics),
 * but it may never be `null`: every column is non-nullable, so an explicit
 * `null` would otherwise reach Prisma and fail there as an unhandled
 * error instead of a 400. `@ValidateIf` skips the validators only for
 * `undefined`; `@IsDefined()` rejects an explicit `null` with a 400.
 */
export class UpdateSiteConfigDto {
  /** Number of completed orders that promotes a customer to VIP. */
  @ApiPropertyOptional({ example: 3 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsDefined()
  @IsInt()
  @Min(0)
  vipOrderThreshold?: number

  /** Lifetime NGN spend that promotes a customer to VIP. */
  @ApiPropertyOptional({ example: 200000 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsDefined()
  @IsNumber()
  @Min(0)
  vipSpendThreshold?: number

  /** Percentage off granted by the welcome discount coupon. */
  @ApiPropertyOptional({ example: 10 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsDefined()
  @IsInt()
  @Min(0)
  @Max(100)
  welcomeDiscountPercent?: number

  /** Minimum NGN order subtotal required for the welcome discount. */
  @ApiPropertyOptional({ example: 20000 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsDefined()
  @IsNumber()
  @Min(0)
  welcomeDiscountMinOrder?: number

  /** Days from coupon creation until the welcome discount expires. */
  @ApiPropertyOptional({ example: 30 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsDefined()
  @IsInt()
  @Min(1)
  welcomeDiscountExpiry?: number
}
