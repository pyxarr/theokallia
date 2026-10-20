import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  Min,
  ValidateIf,
} from 'class-validator'
import { StrictValue } from '../../../utils/strict-value'

/**
 * DTO for creating a shipping zone.
 * Names are unique in the DB and are stored trimmed; the flat NGN rate is
 * the delivery fee charged for the zone.
 *
 * `@StrictValue()` parses the raw body value itself, so the global
 * ValidationPipe's implicit conversion cannot turn a cleared form field
 * (`""`) into `0` — see `utils/strict-value.ts`.
 */
export class CreateShippingZoneDto {
  /** Zone name (e.g. "Nationwide"). Unique in the DB, stored trimmed. */
  @ApiProperty({ example: 'Nationwide' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  name: string

  /** Flat NGN delivery rate charged for this zone. */
  @ApiProperty({ example: 2500 })
  @StrictValue()
  @IsNumber()
  @Min(0)
  rate: number

  /**
   * Whether the zone is offered to customers. Defaults to active.
   *
   * `@ValidateIf` (rather than `@IsOptional`) is what makes an explicit
   * `null` a 400 instead of a silent `true`: the field is skipped when
   * absent — the service then defaults it to `true` — but a `null` that
   * reached Prisma's non-nullable column would throw.
   */
  @ApiPropertyOptional({ default: true })
  @ValidateIf((_object, value) => value !== undefined)
  @StrictValue()
  @IsBoolean()
  active?: boolean
}
