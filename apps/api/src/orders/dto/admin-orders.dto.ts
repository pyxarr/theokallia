import { IsIn, IsInt, IsOptional, IsString, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'
import type { AdminOrderStatus } from '../order-transitions.config'

/** Filter for the admin order list. */
export class AdminOrdersFilterDto {
  @IsOptional()
  @IsIn(['pending', 'paid', 'shipped', 'delivered', 'cancelled'])
  status?: AdminOrderStatus

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

/** Body for the admin status update. */
export class UpdateOrderStatusDto {
  @IsIn(['pending', 'paid', 'shipped', 'delivered', 'cancelled'])
  status: AdminOrderStatus

  /**
   * Required when transitioning to 'shipped'. Presence is enforced in
   * OrdersService so the 400 carries a single, human-readable reason —
   * validating it here would reject with a bare "must be a string" first.
   */
  @IsOptional()
  @IsString()
  trackingNumber?: string
}
