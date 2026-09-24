import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import api from '@/lib/api'

export type AdminReviewStatus = 'pending' | 'approved' | 'rejected'

export interface AdminReview {
  id: string
  rating: number
  comment: string
  status: AdminReviewStatus
  createdAt: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
  product: {
    id: string
    name: string
    slug: string
  }
}

export interface AdminReviewFilters {
  status?: AdminReviewStatus
  limit?: number
}

export interface AdminReviewCounts {
  pending: number
  approved: number
  rejected: number
}

interface AdminReviewsPage {
  data: AdminReview[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const fetchAdminReviews = async (
  filters: AdminReviewFilters,
  page: number
): Promise<AdminReviewsPage> => {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.limit) params.set('limit', String(filters.limit))
  params.set('page', String(page))

  const res = await api.get(`/reviews/admin?${params.toString()}`)
  return res.data
}

const fetchAdminReviewCounts = async (): Promise<AdminReviewCounts> => {
  const res = await api.get('/reviews/admin/counts')
  return res.data
}

const moderateReview = async ({
  id,
  status,
}: {
  id: string
  status: Exclude<AdminReviewStatus, 'pending'>
}): Promise<AdminReview> => {
  const res = await api.patch(`/reviews/admin/${id}/status`, { status })
  return res.data
}

const deleteReview = async (id: string): Promise<{ message: string }> => {
  const res = await api.delete(`/reviews/admin/${id}`)
  return res.data
}

/** Moderation queue — Load More pagination with an optional status filter. */
export const useAdminReviews = (filters: AdminReviewFilters = {}) => {
  return useInfiniteQuery({
    queryKey: ['admin', 'reviews', JSON.stringify(filters)],
    queryFn: ({ pageParam }) => fetchAdminReviews(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta
      return page < totalPages ? page + 1 : undefined
    },
    staleTime: 1000 * 30,
  })
}

/** Per-status totals for the moderation tabs. */
export const useAdminReviewCounts = () => {
  return useQuery({
    queryKey: ['admin', 'reviews', 'counts'],
    queryFn: fetchAdminReviewCounts,
    staleTime: 1000 * 30,
  })
}

export const useModerateReview = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: moderateReview,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
    },
  })
}

export const useDeleteReview = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
    },
  })
}
