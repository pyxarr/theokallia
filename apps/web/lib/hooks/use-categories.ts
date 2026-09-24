import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

interface Subcategory {
  id: string
  name: string
  slug: string
  image: string | null
  categoryId: string
  createdAt: string
}

interface Category {
  id: string
  name: string
  slug: string
  image: string | null
  subcategories: Subcategory[]
  createdAt: string
}

// fetches all categories with their subcategories
// used by the sidebar filter on /shop
const fetchCategories = async (): Promise<Category[]> => {
  const res = await api.get('/categories')
  return res.data
}

// fetches a single category by slug with its subcategories
const fetchCategory = async (slug: string): Promise<Category> => {
  const res = await api.get(`/categories/${slug}`)
  return res.data
}

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    // categories rarely change — cache for 10 minutes
    staleTime: 1000 * 60 * 10,
  })
}

export const useCategory = (slug: string) => {
  return useQuery({
    queryKey: ['categories', slug],
    queryFn: () => fetchCategory(slug),
    // only fetch if slug is provided
    enabled: !!slug,
    staleTime: 1000 * 60 * 10,
  })
}
