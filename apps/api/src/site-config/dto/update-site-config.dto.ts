import { ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsDefined,
  IsInt,
  IsNumber,
  Min,
  ValidateIf,
} from 'class-validator'
import { StrictValue } from '../../utils/strict-value'

/**
 * DTO for patching the singleton site settings row.
 * There is no create DTO — the row is created by the service with the
 * schema defaults, never by a client — so every field is optional.
 *
 * The welcome offer is a coupon, so it has no settings columns here.
 *
 * A field may be omitted (it is then left untouched — PATCH semantics),
 * but it may never be `null`: every column is non-nullable, so an explicit
 * `null` would otherwise reach Prisma and fail there as an unhandled
 * error instead of a 400. `@ValidateIf` skips the validators only for
 * `undefined`; `@IsDefined()` rejects an explicit `null` with a 400.
 *
 * `@StrictValue()` parses the raw body value itself, so the global
 * ValidationPipe's implicit conversion cannot turn a cleared form field
 * (`""`) into `0` — see `utils/strict-value.ts`.
 */
export class UpdateSiteConfigDto {
  /** Number of completed orders that promotes a customer to VIP. */
  @ApiPropertyOptional({ example: 3 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsDefined()
  @StrictValue()
  @IsInt()
  @Min(0)
  vipOrderThreshold?: number

  /** Lifetime NGN spend that promotes a customer to VIP. */
  @ApiPropertyOptional({ example: 200000 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsDefined()
  @StrictValue()
  @IsNumber()
  @Min(0)
  vipSpendThreshold?: number
}
