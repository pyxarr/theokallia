import { Type } from 'class-transformer'
import { IsString, IsNotEmpty, IsNumber, IsArray, ValidateNested, Min } from 'class-validator'

export class CouponCartItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string

  @IsString()
  @IsNotEmpty()
  categoryId: string

  @IsNumber()
  @Min(0)
  price: number

  @IsNumber()
  @Min(1)
  quantity: number
}

export class ValidateCouponDto {
  @IsString()
  @IsNotEmpty()
  code: string

  @IsNumber()
  @Min(0)
  subtotal: number

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CouponCartItemDto)
  items: CouponCartItemDto[]
}