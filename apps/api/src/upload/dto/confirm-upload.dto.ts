import { IsString, IsOptional, IsIn } from 'class-validator'

export class ConfirmUploadDto {
  @IsString()
  publicId: string

  @IsString()
  entityId: string

  @IsString()
  @IsIn(['Product', 'ContentBlock', 'Category'])
  entityType: string

  @IsOptional()
  @IsString()
  altText?: string
}
