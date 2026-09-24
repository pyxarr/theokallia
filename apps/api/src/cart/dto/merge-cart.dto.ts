import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsArray, IsInt, IsString, Min, ValidateNested } from 'class-validator'

// represents a single item from the guest's localStorage cart
class LocalCartItemDto {
  @ApiProperty({ example: 'clxyz123abc' })
  @IsString()
  productId: string

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number
}

export class MergeCartDto {
  @ApiProperty({
    description: 'Array of cart items from localStorage to merge into the user\'s DB cart on login',
    type: [LocalCartItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true }) // validate every item in the array, not just the array itself
  @Type(() => LocalCartItemDto)  // class-transformer needs this to instantiate the nested class
  items: LocalCartItemDto[]
}