import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Min, Max } from 'class-validator'

/** Filter for the admin customer directory. */
export class AdminCustomersFilterDto {
  /** Case-insensitive match against email, first name, or last name. */
  @IsOptional()
  @IsString()
  q?: string

  /** Restrict the directory to customers or staff accounts. */
  @IsOptional()
  @IsIn(['customer', 'admin'])
  role?: 'customer' | 'admin'

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number
}
