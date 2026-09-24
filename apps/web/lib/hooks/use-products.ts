import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import api from '@/lib/api'

// Types

interface Category {
  id: string
  name: string
  slug: string
}

interface Subcategory {
  id: string
  name: string
  slug: string
}

interface Asset {
  id: string
  publicId: string
  altText: string | null
  sortOrder: number
  resourceType: string
  entityType: string
  entityId: string
}

interface Review {
  id: string
  rating: number
  comment: string
  createdAt: string
  user: {
    firstName: string
    lastName: string
  }
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  usdPrice: number | null
  gbpPrice: number | null
  assets: Asset[]
  inStock: boolean
  stock: number
  category: Category
  subcategory: Subcategory | null
  reviews: Review[]
  rating: number
  reviewCount: number
  ratingBreakdown: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  createdAt: string
  updatedAt: string
}

export interface ProductFilters {
  category?: string   // comma-separated slugs e.g. 'rings,bracelets'
  minPrice?: number
  maxPrice?: number
  sort?: 'best-seller' | 'new-arrival'
  order?: 'asc' | 'desc'
  limit?: number
}

interface ProductsPage {
  data: Product[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// Fetchers

const fetchProducts = async (
  filters: ProductFilters,
  page: number,
): Promise<ProductsPage> => {
  const params = new URLSearchParams()

  if (filters.category) params.set('category', filters.category)
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice))
  if (filters.sort) params.set('sort', filters.sort)
  if (filters.order) params.set('order', filters.order)
  if (filters.limit) params.set('limit', String(filters.limit))
  params.set('page', String(page))

  const res = await api.get(`/products?${params.toString()}`)
  return res.data
}

const fetchProduct = async (slug: string): Promise<Product> => {
  const res = await api.get(`/products/${slug}`)
  return res.data
}

const fetchSimilarProducts = async (slug: string): Promise<Product[]> => {
  const res = await api.get(`/products/${slug}/similar`)
  return res.data
}

// Hooks

// shop listing page — Load More pagination
export const useProducts = (filters: ProductFilters = {}) => {
  return useInfiniteQuery({
    queryKey: ['products', JSON.stringify(filters)],
    queryFn: ({ pageParam }) => fetchProducts(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta
      return page < totalPages ? page + 1 : undefined
    },
    staleTime: 1000 * 60 * 5,
  })
}

// product detail page
export const useProduct = (slug: string, initialData?: Product) => {
  return useQuery({
    queryKey: ['products', slug],
    queryFn: () => fetchProduct(slug),
    enabled: !!slug,
    initialData,
    staleTime: 1000 * 30,
  })
}

// similar products section on product detail page
export const useSimilarProducts = (slug: string) => {
  return useQuery({
    queryKey: ['products', slug, 'similar'],
    queryFn: () => fetchSimilarProducts(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  })
}