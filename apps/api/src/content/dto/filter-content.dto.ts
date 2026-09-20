import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional } from 'class-validator'

/**
 * Query DTO for the public content listing.
 * `type` narrows the result to a single placement; omitting it returns all types.
 */
export class FilterContentDto {
  /** Optional placement filter — one of "hero", "banner", or "promotion". */
  @ApiPropertyOptional({ enum: ['hero', 'banner', 'promotion'], example: 'hero' })
  @IsOptional()
  @IsIn(['hero', 'banner', 'promotion'])
  type?: 'hero' | 'banner' | 'promotion'
}
