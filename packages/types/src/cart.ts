/** Cart item from guest localStorage — merged into DB cart on login. */
export interface LocalCartItem {
  productId: string
  quantity: number
}

/** Item that couldn't be merged during cart merge (deleted or out of stock). */
export interface SkippedCartItem {
  productId: string
  productName: string
  reason: 'deleted' | 'out_of_stock'
}

/** Response from POST /cart/merge endpoint. */
export interface MergeCartResponse {
  cart: Cart
  skippedItems: SkippedCartItem[]
}

/** Re-export Cart from order types for convenience. */
export type { Cart } from './order'