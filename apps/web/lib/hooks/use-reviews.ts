import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

// Types

interface ReviewUser {
  firstName: string
  lastName: string
}

export interface Review {
  id: string
  rating: number
  comment: string
  createdAt: string
  user: ReviewUser
}

export interface ReviewsSummary {
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
}

interface CreateReviewPayload {
  rating: number
  comment: string
}

export interface ReviewEligibility {
  canReview: boolean
  reason?: 'signin' | 'not-purchased' | 'already-reviewed'
}

interface UpdateReviewPayload {
  rating?: number
  comment?: string
}

// Fetchers

const fetchReviews = async (slug: string): Promise<ReviewsSummary> => {
  const res = await api.get(`/products/${slug}/reviews`)
  return res.data
}

const createReview = async (
  slug: string,
  payload: CreateReviewPayload
): Promise<Review> => {
  const res = await api.post(`/products/${slug}/reviews`, payload)
  return res.data
}

const updateReview = async (
  slug: string,
  reviewId: string,
  payload: UpdateReviewPayload
): Promise<Review> => {
  const res = await api.patch(`/products/${slug}/reviews/${reviewId}`, payload)
  return res.data
}

const deleteReview = async (slug: string, reviewId: string): Promise<void> => {
  await api.delete(`/products/${slug}/reviews/${reviewId}`)
}

const fetchReviewEligibility = async (
  slug: string
): Promise<ReviewEligibility> => {
  const res = await api.get(`/products/${slug}/reviews/eligibility`)
  return res.data
}

// Hooks

// fetch all reviews + rating summary for a product
export const useReviews = (slug: string, initialData?: ReviewsSummary | null) => {
  return useQuery({
    queryKey: ['reviews', slug],
    queryFn: () => fetchReviews(slug),
    enabled: !!slug,
    initialData,
    staleTime: 1000 * 30,
  })
}

// create a new review — invalidates reviews cache on success
export const useCreateReview = (slug: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => createReview(slug, payload),
    onSuccess: () => {
      // refresh reviews list and rating summary
      queryClient.invalidateQueries({ queryKey: ['reviews', slug] })
      // the review now exists, so eligibility flips to already-reviewed
      queryClient.invalidateQueries({
        queryKey: ['reviews', slug, 'eligibility'],
      })
      // also refresh product detail so rating updates live
      queryClient.invalidateQueries({ queryKey: ['products', slug] })
    },
  })
}

// server-checked review eligibility — the write form only renders when the
// signed-in customer has purchased the product and hasn't reviewed it yet
export const useReviewEligibility = (slug: string, enabled = true) => {
  return useQuery({
    queryKey: ['reviews', slug, 'eligibility'],
    queryFn: () => fetchReviewEligibility(slug),
    enabled: enabled && !!slug,
    staleTime: 1000 * 60,
  })
}

// update own review — invalidates reviews cache on success
export const useUpdateReview = (slug: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      reviewId,
      payload,
    }: {
      reviewId: string
      payload: UpdateReviewPayload
    }) => updateReview(slug, reviewId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', slug] })
      queryClient.invalidateQueries({ queryKey: ['products', slug] })
    },
  })
}

// delete a review — invalidates reviews cache on success
export const useDeleteReview = (slug: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (reviewId: string) => deleteReview(slug, reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', slug] })
      queryClient.invalidateQueries({ queryKey: ['products', slug] })
    },
  })
}
