import type { CouponScope, CouponSource, CouponType } from './enums'

/** A promotional code as returned by the admin coupon endpoints. */
export interface Coupon {
  id: string
  code: string
  type: CouponType
  value: number
  scope: CouponScope
  scopeId: string | null
  minOrder: number | null
  maxUses: number | null
  perUserLimit: number | null
  usedCount: number
  expiresAt: string | null
  active: boolean
  /** 'welcome' for the coupon auto-issued to new customers; null for hand-made promo codes. */
  source: CouponSource | null
  /** Whether this coupon is emailed to new customers when they sign up. */
  autoIssue: boolean
  createdAt: string
  updatedAt: string
}

/** Active/inactive, per-type, and per-scope totals for the coupon tab badges. */
export interface CouponCounts {
  total: number
  active: number
  inactive: number
  percent: number
  fixed: number
  free_shipping: number
  storewide: number
  category: number
  product: number
}