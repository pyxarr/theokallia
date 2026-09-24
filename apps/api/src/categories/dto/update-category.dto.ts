import { IsOptional, IsString, IsUrl } from 'class-validator'

// all fields optional — PATCH semantics
export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  slug?: string

  @IsOptional()
  @IsUrl()
  image?: string
}
