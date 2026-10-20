/** The singleton global settings row — VIP thresholds and welcome-discount terms. */
export interface SiteConfig {
  id: string
  vipOrderThreshold: number
  vipSpendThreshold: number
  welcomeDiscountPercent: number
  welcomeDiscountMinOrder: number
  welcomeDiscountExpiry: number
  updatedAt: string
}
