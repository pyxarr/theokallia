import { ApiProperty } from '@nestjs/swagger'
import { IsInt, Min } from 'class-validator'

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'The new quantity for this cart item — must be at least 1. To remove an item use DELETE instead',
    example: 3,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number
}