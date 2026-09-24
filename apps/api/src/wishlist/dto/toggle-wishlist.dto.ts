import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

// wishlist is a simple toggle — add if not present, remove if already there
// no quantity needed, just the productId
export class ToggleWishlistDto {
  @ApiProperty({
    description: 'The ID of the product to add or remove from the wishlist',
    example: 'clxyz123abc',
  })
  @IsString()
  productId: string
}