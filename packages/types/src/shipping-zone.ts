/** A shipping zone as the admin list returns it — flat NGN rate, no relations. */
export interface ShippingZone {
  id: string
  name: string
  rate: number
  active: boolean
}
