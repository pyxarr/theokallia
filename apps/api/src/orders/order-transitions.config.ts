import { BadRequestException } from '@nestjs/common'

/** Order statuses. */
export type AdminOrderStatus =
  'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'

/** Allowed order status transitions for the admin fulfillment flow. */
const ALLOWED_TRANSITIONS: Record<string, AdminOrderStatus[]> = {
  pending: ['cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

/**
 * Validates an order status transition. Throws BadRequestException when the
 * transition is not allowed from the current status.
 */
export function validateStatusTransition(
  currentStatus: string,
  nextStatus: AdminOrderStatus,
): void {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? []
  if (!allowed.includes(nextStatus)) {
    throw new BadRequestException(
      `Cannot transition order from "${currentStatus}" to "${nextStatus}".`,
    )
  }
}
