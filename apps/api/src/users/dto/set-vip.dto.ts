import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean } from 'class-validator'

/**
 * Body for the admin VIP toggle.
 * isVip is required so the caller states the intended final state explicitly
 * rather than relying on a flip.
 */
export class SetVipDto {
  /** Desired VIP status for the customer. */
  @ApiProperty({ example: true })
  @IsBoolean()
  isVip: boolean
}
