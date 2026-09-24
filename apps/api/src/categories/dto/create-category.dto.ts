import { IsOptional, IsString, IsUrl } from 'class-validator'

export class CreateCategoryDto {
  // display name e.g. "Rings"
  @IsString()
  name: string

  // URL-friendly identifier e.g. "rings"
  @IsString()
  slug: string

  // optional Cloudinary image URL for the category card
  @IsOptional()
  @IsUrl()
  image?: string
}
