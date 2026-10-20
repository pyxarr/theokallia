import { ApiPropertyOptional } from '@nestjs/swagger'
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
 * DTO for updating an existing shipping zone — all fields optional
 * (PATCH semantics). Fields left out keep their current value.
 *
 * `@ValidateIf` (rather than `@IsOptional`) is what makes an explicit
 * `null` a 400 instead of a 500: the field is skipped when absent, but
 * a `null` that reaches Prisma's non-nullable columns would throw.
 *
 * `@StrictValue()` parses the raw body value itself, so the global
 * ValidationPipe's implicit conversion cannot turn a cleared form field
 * (`""`) into `0` — see `utils/strict-value.ts`.
 */
export class UpdateShippingZoneDto {
  /** Zone name. Unique in the DB, stored trimmed. */
  @ApiPropertyOptional({ example: 'Nationwide' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  name?: string

  /** Flat NGN delivery rate charged for this zone. */
  @ApiPropertyOptional({ example: 2500 })
  @ValidateIf((_object, value) => value !== undefined)
  @StrictValue()
  @IsNumber()
  @Min(0)
  rate?: number

  /** Whether the zone is offered to customers. */
  @ApiPropertyOptional({ default: true })
  @ValidateIf((_object, value) => value !== undefined)
  @StrictValue()
  @IsBoolean()
  active?: boolean
}
