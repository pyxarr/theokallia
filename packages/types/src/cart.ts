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

/** Full cart with items and computed total. */
export interface Cart {
  id: string
  userId: string
  items: CartItem[]
  total: number
  createdAt: string
  updatedAt: string
}

/** Individual item in a cart. */
export interface CartItem {
  id: string
  cartId: string
  productId: string
  quantity: number
  createdAt: string
  updatedAt: string
  product: CartProduct
}

/** Product details as returned in cart responses. */
export interface CartProduct {
  id: string
  name: string
  slug: string
  price: number
  assets: Asset[]
  inStock: boolean
  stock: number
  category: { name: string }
  subcategory: { name: string } | null
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

/** Re-export Asset from asset types for convenience. */
export type { Asset } from './asset'