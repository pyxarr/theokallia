import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class FilterProductsDto {
  // comma separated category slugs e.g. rings,bracelets
  // if not provided, all categories are returned
  @ApiPropertyOptional({ example: 'rings,bracelets' })
  @IsOptional()
  @IsString()
  category?: string

  // what to sort by — best-seller or new-arrival
  // if not provided, products are ordered by createdAt desc by default
  @ApiPropertyOptional({ enum: ['best-seller', 'new-arrival'] })
  @IsOptional()
  @IsIn(['best-seller', 'new-arrival'])
  sort?: 'best-seller' | 'new-arrival'

  // sort direction — only relevant when sort is provided
  // if not provided, defaults to desc
  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc'

  // single price range lower bound e.g. 1000
  // if not provided, no lower bound is applied
  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number

  // single price range upper bound e.g. 5000
  // if not provided, no upper bound is applied
  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number

  // current page number — defaults to 1
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  // number of products per page — defaults to 12 (3 col grid, 4 rows)
  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number
}