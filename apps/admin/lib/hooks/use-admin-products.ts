import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

interface AdminCategoryRef {
  name: string
  slug: string
}

export interface AdminAsset {
  id: string
  publicId: string
  altText: string | null
  sortOrder: number
  resourceType: string
  entityType: string
  entityId: string
}

export interface AdminProduct {
  id: string
  name: string
  slug: string
  description: string
  price: number
  usdPrice: number | null
  gbpPrice: number | null
  inStock: boolean
  stock: number
  categoryId: string
  subcategoryId: string | null
  category: AdminCategoryRef
  subcategory: AdminCategoryRef | null
  assets: AdminAsset[]
  createdAt: string
  updatedAt: string
}

export interface AdminProductFilters {
  category?: string
  sort?: 'best-seller' | 'new-arrival'
  order?: 'asc' | 'desc'
  minPrice?: number
  maxPrice?: number
  limit?: number
}

interface AdminProductsPage {
  data: AdminProduct[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface CreateProductInput {
  name: string
  slug: string
  description: string
  price: number
  usdPrice?: number
  gbpPrice?: number
  stock: number
  inStock?: boolean
  categorySlug: string
  subcategorySlug?: string
  images?: string[]
}

export type UpdateProductInput = Partial<CreateProductInput>

export interface SignUploadInput {
  fileName: string
  fileSize: number
  mimeType: string
}

export interface SignUploadResult {
  signature: string
  timestamp: number
  apiKey: string
  cloudName: string
  uploadPreset: string
}

export interface ConfirmUploadInput {
  publicId: string
  entityId: string
  entityType: 'Product' | 'ContentBlock' | 'Category'
  altText?: string
}

// Fetchers

const fetchAdminProducts = async (
  filters: AdminProductFilters,
  page: number,
): Promise<AdminProductsPage> => {
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

const fetchAdminProduct = async (slug: string): Promise<AdminProduct> => {
  const res = await api.get(`/products/${slug}`)
  return res.data
}

const createProduct = async (input: CreateProductInput): Promise<AdminProduct> => {
  const res = await api.post('/products', input)
  return res.data
}

const updateProduct = async (
  slug: string,
  input: UpdateProductInput,
): Promise<AdminProduct> => {
  const res = await api.patch(`/products/${slug}`, input)
  return res.data
}

const deleteProduct = async (slug: string): Promise<void> => {
  await api.delete(`/products/${slug}`)
}

const signUpload = async (input: SignUploadInput): Promise<SignUploadResult> => {
  const res = await api.post('/uploads/sign', input)
  return res.data
}

const confirmUpload = async (input: ConfirmUploadInput): Promise<AdminAsset> => {
  const res = await api.post('/uploads/confirm', input)
  return res.data
}

const deleteUpload = async (id: string): Promise<void> => {
  await api.delete(`/uploads/${id}`)
}

// Hooks

/** Admin catalog table — Load More pagination. */
export const useAdminProducts = (filters: AdminProductFilters = {}) => {
  return useInfiniteQuery({
    queryKey: ['admin', 'products', JSON.stringify(filters)],
    queryFn: ({ pageParam }) => fetchAdminProducts(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta
      return page < totalPages ? page + 1 : undefined
    },
    staleTime: 1000 * 30,
  })
}

/** Single product for the edit form. */
export const useAdminProduct = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['admin', 'products', slug],
    queryFn: () => fetchAdminProduct(slug!),
    enabled: !!slug,
    staleTime: 1000 * 30,
  })
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
  })
}

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ slug, input }: { slug: string; input: UpdateProductInput }) =>
      updateProduct(slug, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
  })
}

export const useDeleteProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
  })
}

export const useSignUpload = () => {
  return useMutation({ mutationFn: signUpload })
}

export const useConfirmUpload = () => {
  return useMutation({ mutationFn: confirmUpload })
}

export const useDeleteUpload = () => {
  return useMutation({ mutationFn: deleteUpload })
}
