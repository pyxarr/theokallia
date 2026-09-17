import { PartialType } from '@nestjs/swagger'
import { CreateCouponDto } from './create-coupon.dto'

/**
 * DTO for updating an existing coupon — all fields optional (PATCH semantics).
 * `code` is uppercased before any uniqueness check.
 * `usedCount`, `createdAt`, and `updatedAt` are managed by Prisma — never set here.
 */
export class UpdateCouponDto extends PartialType(CreateCouponDto) {}
