import { IsArray, IsString } from 'class-validator'

export class ValidateGuestCartDto {
  @IsArray()
  @IsString({ each: true })
  // list of productIds from the guest's localStorage cart
  productIds: string[]
}