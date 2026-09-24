import { ApiProperty } from '@nestjs/swagger'
import { IsInt, IsString, Min } from 'class-validator'

export class AddToCartDto {
  @ApiProperty({
    description: 'The ID of the product to add to the cart',
    example: 'clxyz123abc',
  })
  @IsString()
  productId: string

  @ApiProperty({
    description: 'How many units to add — must be at least 1',
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number
}