import { Type } from 'class-transformer'
import { IsString, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator'

export class ShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  street: string

  @IsString()
  @IsNotEmpty()
  city: string

  @IsString()
  @IsNotEmpty()
  state: string

  @IsString()
  @IsNotEmpty()
  country: string
}

export class CreateOrderDto {
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto

  @IsString()
  @IsOptional()
  couponCode?: string
}