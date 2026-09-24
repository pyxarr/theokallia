import { Category, Subcategory } from './category'

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  price: number
  images: string[]
  inStock: boolean
  stock: number
  category: Category
  subcategory?: Subcategory
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