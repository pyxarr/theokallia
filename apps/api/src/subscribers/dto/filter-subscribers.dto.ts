import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, Min } from 'class-validator'

export type SubscriberTag = 'guest' | 'registered' | 'vip'

/**
 * Query DTO for the admin subscriber list.
 * `tag` narrows the result to a single tag; pagination mirrors the products listing.
 */
export class FilterSubscribersDto {
  /** Optional tag filter. */
  @ApiPropertyOptional({ enum: ['guest', 'registered', 'vip'] })
  @IsOptional()
  @IsIn(['guest', 'registered', 'vip'])
  tag?: SubscriberTag

  /** Current page number — defaults to 1. */
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  /** Number of subscribers per page — defaults to 20. */
  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number
}
