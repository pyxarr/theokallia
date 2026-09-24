import { IsOptional, IsString, IsUrl } from 'class-validator'

export class CreateSubcategoryDto {
  // display name e.g. "Gold Rings"
  @IsString()
  name: string

  // URL-friendly identifier e.g. "gold-rings"
  @IsString()
  slug: string

  // optional Cloudinary image URL
  @IsOptional()
  @IsUrl()
  image?: string
}
