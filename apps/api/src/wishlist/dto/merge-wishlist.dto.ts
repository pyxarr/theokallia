import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsString } from 'class-validator'

export class MergeWishlistDto {
  @ApiProperty({
    description: 'Array of productIds from the guest localStorage wishlist to merge into the DB wishlist',
    type: [String],
    example: ['clxyz123abc', 'clxyz456def'],
  })
  @IsArray()
  @IsString({ each: true })
  productIds: string[]
}