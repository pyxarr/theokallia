import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator'

/**
 * DTO for updating a content block — all fields optional (PATCH semantics).
 * If section is changed, the service validates uniqueness against existing blocks.
 */
export class UpdateContentBlockDto {
  /** New section identifier — must not conflict with an existing block. */
  @ApiPropertyOptional({ example: 'hero' })
  @IsOptional()
  @IsString()
  section?: string

  /** Updated main heading. */
  @ApiPropertyOptional({ example: 'Discover Divine Beauty' })
  @IsOptional()
  @IsString()
  title?: string

  /** Updated supporting text. */
  @ApiPropertyOptional({ example: 'Handcrafted luxury jewellery for the modern woman.' })
  @IsOptional()
  @IsString()
  subtitle?: string

  /** Updated CTA button label. */
  @ApiPropertyOptional({ example: 'Shop Now' })
  @IsOptional()
  @IsString()
  ctaText?: string

  /** Updated CTA link URL. */
  @ApiPropertyOptional({ example: '/shop' })
  @IsOptional()
  @IsString()
  ctaLink?: string

  /** Updated sort order among sections. */
  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number

  /** Toggle section visibility on the homepage. */
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean

  /** Placement type — which part of the homepage this block renders. */
  @ApiPropertyOptional({ enum: ['hero', 'banner', 'promotion'], example: 'hero' })
  @IsOptional()
  @IsIn(['hero', 'banner', 'promotion'])
  type?: 'hero' | 'banner' | 'promotion'

  /** New ISO date the block becomes visible. Omit to activate immediately. */
  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startsAt?: string

  /** New ISO date the block stops being visible. Omit for no expiry. */
  @ApiPropertyOptional({ example: '2026-01-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endsAt?: string
}
