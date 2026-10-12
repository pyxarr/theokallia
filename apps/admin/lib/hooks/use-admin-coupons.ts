'use client'

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  Coupon,
  CouponCounts,
  CouponScope,
  CouponType,
  Paginated,
} from '@theokallia/types'

export type { CouponCounts, CouponScope, CouponType }

export type AdminCoupon = Coupon

export interface AdminCouponFilters {
  search?: string
  active?: boolean
  type?: CouponType
  scope?: CouponScope
  limit?: number
}

type AdminCouponsPage = Paginated<AdminCoupon>

export interface CreateCouponInput {
  code: string
  type: CouponType
  value: number
  scope: CouponScope
  scopeId?: string | null
  minOrder?: number | null
  maxUses?: number | null
  perUserLimit?: number | null
  expiresAt?: string | null
  active?: boolean
}

export type UpdateCouponInput = Partial<CreateCouponInput>

// Fetchers

const fetchAdminCoupons = async (
  filters: AdminCouponFilters,
  page: number,
): Promise<AdminCouponsPage> => {
  const params = new URLSearchParams()

  if (filters.search) params.set('q', filters.search)
  if (filters.active !== undefined) params.set('active', String(filters.active))
  if (filters.type) params.set('type', filters.type)
  if (filters.scope) params.set('scope', filters.scope)
  if (filters.limit) params.set('limit', String(filters.limit))
  params.set('page', String(page))

  const res = await api.get(`/coupons?${params.toString()}`)
  return res.data
}

const fetchAdminCoupon = async (id: string): Promise<AdminCoupon> => {
  const res = await api.get(`/coupons/${id}`)
  return res.data
}

const fetchCouponCounts = async (): Promise<CouponCounts> => {
  const res = await api.get('/coupons/counts')
  return res.data
}

const createCoupon = async (input: CreateCouponInput): Promise<AdminCoupon> => {
  const res = await api.post('/coupons', input)
  return res.data
}

const updateCoupon = async (
  id: string,
  input: UpdateCouponInput,
): Promise<AdminCoupon> => {
  const res = await api.patch(`/coupons/${id}`, input)
  return res.data
}

const deleteCoupon = async (id: string): Promise<void> => {
  await api.delete(`/coupons/${id}`)
}

// Hooks

/** Admin coupon table — Load More pagination. */
export const useAdminCoupons = (filters: AdminCouponFilters = {}) => {
  return useInfiniteQuery({
    queryKey: ['admin', 'coupons', JSON.stringify(filters)],
    queryFn: ({ pageParam }) => fetchAdminCoupons(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta
      return page < totalPages ? page + 1 : undefined
    },
    staleTime: 1000 * 30,
  })
}

/** Single-coupon row used by list prefill, detail, counts and mutations. */
export type { Coupon } from '@theokallia/types'
export const useAdminCoupon = (id: string | undefined) => {
  return useQuery({
    queryKey: ['admin', 'coupons', id],
    queryFn: () => fetchAdminCoupon(id!),
    enabled: !!id,
    staleTime: 1000 * 30,
  })
}

/** Usage counts for tab badges. */
export const useAdminCouponCounts = () => {
  return useQuery({
    queryKey: ['admin', 'coupons', 'counts'],
    queryFn: fetchCouponCounts,
    staleTime: 1000 * 30,
  })
}

export const useCreateCoupon = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCoupon,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] })
    },
  })
}

export const useUpdateCoupon = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCouponInput }) =>
      updateCoupon(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] })
    },
  })
}

export const useDeleteCoupon = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCoupon,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] })
    },
  })
}

export const useToggleCouponActive = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateCoupon(id, { active }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] })
    },
  })
}