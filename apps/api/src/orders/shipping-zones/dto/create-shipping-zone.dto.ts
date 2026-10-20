import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator'

/**
 * DTO for creating a shipping zone.
 * Names are unique in the DB and are stored trimmed; the flat NGN rate is
 * the delivery fee charged for the zone.
 */
export class CreateShippingZoneDto {
  /** Zone name (e.g. "Nationwide"). Unique in the DB, stored trimmed. */
  @ApiProperty({ example: 'Nationwide' })
  @IsString()
  @IsNotEmpty()
  name: string

  /** Flat NGN delivery rate charged for this zone. */
  @ApiProperty({ example: 2500 })
  @IsNumber()
  @Min(0)
  rate: number

  /** Whether the zone is offered to customers. Defaults to active. */
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean
}
