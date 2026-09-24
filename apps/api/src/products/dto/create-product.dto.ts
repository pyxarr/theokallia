import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'

export class CreateProductDto {
  @ApiProperty({ example: 'Temi' })
  @IsString()
  name: string

  @ApiProperty({ example: 'temi-gold-bracelet' })
  @IsString()
  slug: string

  @ApiProperty({ example: 'A beautiful gold bracelet...' })
  @IsString()
  description: string

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  price: number

  @ApiPropertyOptional({ example: 30.5, description: 'Optional fixed price in USD' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  usdPrice?: number

  @ApiPropertyOptional({ example: 24, description: 'Optional fixed price in GBP' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  gbpPrice?: number

  @ApiPropertyOptional({ example: ['public_id_1', 'public_id_2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  inStock?: boolean

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  stock: number

  @ApiProperty({ example: 'bracelets' })
  @IsString()
  categorySlug: string

  @ApiPropertyOptional({ example: 'gold-bracelets' })
  @IsOptional()
  @IsString()
  subcategorySlug?: string
}