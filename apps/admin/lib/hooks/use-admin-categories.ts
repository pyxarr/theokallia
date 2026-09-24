import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export interface AdminSubcategory {
  id: string
  name: string
  slug: string
  categoryId: string
}

export interface AdminCategory {
  id: string
  name: string
  slug: string
  subcategories: AdminSubcategory[]
}

export interface CreateCategoryInput {
  name: string
  slug: string
}

export interface CreateSubcategoryInput extends CreateCategoryInput {
  /** Slug of the parent category. */
  categorySlug: string
}

const fetchAdminCategories = async (): Promise<AdminCategory[]> => {
  const res = await api.get('/categories')
  return res.data
}

const createCategory = async (
  input: CreateCategoryInput
): Promise<AdminCategory> => {
  const res = await api.post('/categories', input)
  return res.data
}

const createSubcategory = async ({
  categorySlug,
  ...input
}: CreateSubcategoryInput): Promise<AdminSubcategory> => {
  const res = await api.post(`/categories/${categorySlug}/subcategories`, input)
  return res.data
}

export interface UpdateCategoryInput {
  /** Current slug — the URL key. */
  slug: string
  input: { name?: string; slug?: string }
}

export interface UpdateSubcategoryInput {
  categorySlug: string
  subSlug: string
  input: { name?: string; slug?: string }
}

const updateCategory = async ({
  slug,
  input,
}: UpdateCategoryInput): Promise<AdminCategory> => {
  const res = await api.patch(`/categories/${slug}`, input)
  return res.data
}

const deleteCategory = async (slug: string): Promise<{ message: string }> => {
  const res = await api.delete(`/categories/${slug}`)
  return res.data
}

const updateSubcategory = async ({
  categorySlug,
  subSlug,
  input,
}: UpdateSubcategoryInput): Promise<AdminSubcategory> => {
  const res = await api.patch(
    `/categories/${categorySlug}/subcategories/${subSlug}`,
    input
  )
  return res.data
}

const deleteSubcategory = async ({
  categorySlug,
  subSlug,
}: {
  categorySlug: string
  subSlug: string
}): Promise<{ message: string }> => {
  const res = await api.delete(
    `/categories/${categorySlug}/subcategories/${subSlug}`
  )
  return res.data
}

/** Category + subcategory selects for product forms. Cached for 5 minutes. */
export const useAdminCategories = () => {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: fetchAdminCategories,
    staleTime: 1000 * 60 * 5,
  })
}

export const useCreateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
    },
  })
}

export const useCreateSubcategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSubcategory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
    },
  })
}

export const useUpdateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
    },
  })
}

export const useDeleteCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
  })
}

export const useUpdateSubcategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateSubcategory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
    },
  })
}

export const useDeleteSubcategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteSubcategory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
  })
}
