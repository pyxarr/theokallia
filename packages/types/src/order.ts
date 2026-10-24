import type { Asset } from './asset'

export interface Order {
  id: string
  userId: string
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  discount?: number
  shippingFee?: number
  shippingAddress?: Record<string, unknown>
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  price: number
  product: {
    name: string
    assets: Asset[]
    slug: string
  }
}