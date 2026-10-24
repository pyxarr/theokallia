import type { Asset } from './asset'
import type { Review } from './review'
import { Category, Subcategory } from './category'

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  price: number
  usdPrice?: number | null
  gbpPrice?: number | null
  assets: Asset[]
  inStock: boolean
  stock: number
  category: Category
  subcategory: Subcategory | null
  reviews?: Review[]
  rating?: number
  reviewCount?: number
  ratingBreakdown?: RatingBreakdown
  createdAt: string
  updatedAt: string
}

export interface RatingBreakdown {
  5: number
  4: number
  3: number
  2: number
  1: number
}

export interface RatingBreakdown {
  5: number
  4: number
  3: number
  2: number
  1: number
}