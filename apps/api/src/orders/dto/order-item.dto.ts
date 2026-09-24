import { IsString, IsInt, IsNumber } from 'class-validator'

export class OrderItemDto {
  @IsString()
  productId: string

  @IsInt()
  quantity: number

  @IsNumber()
  price: number
}
