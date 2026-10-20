/**
 * A shipping zone as the admin list returns it — flat NGN rate, no
 * relations.
 *
 * The public route `GET /v1/shipping-zones` returns a subset of this
 * shape: only `name`, `rate` and `active`, without the `id`.
 */
export interface ShippingZone {
  id: string
  name: string
  rate: number
  active: boolean
}
