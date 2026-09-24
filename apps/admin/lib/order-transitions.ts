import type { AdminOrderStatus } from '@/lib/hooks/use-admin-orders'

/**
 * Allowed order status transitions — mirrors
 * apps/api/src/orders/order-transitions.config.ts.
 *
 * The API rejects anything else with a 400, so the admin UI only offers the
 * legal next steps for the order's current status. Keep the two in sync.
 */
export const ALLOWED_NEXT_STATUSES: Record<
  AdminOrderStatus,
  AdminOrderStatus[]
> = {
  pending: ['cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

/** Statuses that require a tracking number before saving. */
export const STATUSES_REQUIRING_TRACKING: AdminOrderStatus[] = ['shipped']

export function nextStatusesFor(status: AdminOrderStatus): AdminOrderStatus[] {
  return ALLOWED_NEXT_STATUSES[status] ?? []
}

export function requiresTrackingNumber(status: AdminOrderStatus): boolean {
  return STATUSES_REQUIRING_TRACKING.includes(status)
}
