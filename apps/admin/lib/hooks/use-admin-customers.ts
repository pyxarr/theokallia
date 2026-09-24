import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import api from '@/lib/api'

export type CustomerRole = 'customer' | 'admin'
export type ModerationStatus = 'pending' | 'approved' | 'rejected'

export interface AdminCustomer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  role: CustomerRole
  isVip: boolean
  vipSince: string | null
  emailVerified: boolean
  createdAt: string
  ordersCount: number
  lifetimeSpend: number
  lastOrderAt: string | null
  reviewsCount: number
}

export interface AdminCustomerOrder {
  id: string
  status: string
  total: number
  trackingNumber: string | null
  createdAt: string
  shippingZone: { name: string } | null
}

export interface AdminCustomerReview {
  id: string
  rating: number
  comment: string
  status: ModerationStatus
  createdAt: string
  product: { name: string; slug: string }
}

export interface AdminCustomerDetail {
  id: string
  firstName: string
  lastName: string
  name: string
  email: string
  phone: string | null
  address: string | null
  role: CustomerRole
  isVip: boolean
  vipSince: string | null
  emailVerified: boolean
  createdAt: string
  updatedAt: string
  stats: {
    ordersCount: number
    lifetimeSpend: number
    lastOrderAt: string | null
    reviewsCount: number
  }
  recentOrders: AdminCustomerOrder[]
  reviews: AdminCustomerReview[]
  cartItemsCount: number
  subscriber: { tags: string[]; active: boolean; createdAt: string } | null
}

export interface AdminCustomerFilters {
  q?: string
  role?: CustomerRole
  limit?: number
}

interface AdminCustomersPage {
  data: AdminCustomer[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const fetchAdminCustomers = async (
  filters: AdminCustomerFilters,
  page: number
): Promise<AdminCustomersPage> => {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.role) params.set('role', filters.role)
  if (filters.limit) params.set('limit', String(filters.limit))
  params.set('page', String(page))

  const res = await api.get(`/users/admin?${params.toString()}`)
  return res.data
}

const fetchAdminCustomer = async (id: string): Promise<AdminCustomerDetail> => {
  const res = await api.get(`/users/admin/${id}`)
  return res.data
}

const setCustomerVip = async ({
  id,
  isVip,
}: {
  id: string
  isVip: boolean
}): Promise<AdminCustomerDetail> => {
  const res = await api.patch(`/users/${id}/vip`, { isVip })
  return res.data
}

/** Customer directory — Load More pagination with search and role filters. */
export const useAdminCustomers = (filters: AdminCustomerFilters = {}) => {
  return useInfiniteQuery({
    queryKey: ['admin', 'customers', JSON.stringify(filters)],
    queryFn: ({ pageParam }) => fetchAdminCustomers(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta
      return page < totalPages ? page + 1 : undefined
    },
    staleTime: 1000 * 30,
  })
}

/** Single customer profile. */
export const useAdminCustomer = (id: string | undefined) => {
  return useQuery({
    queryKey: ['admin', 'customers', id],
    queryFn: () => fetchAdminCustomer(id!),
    enabled: !!id,
    staleTime: 1000 * 30,
  })
}

/** Admin VIP override — the API stamps vipSince on promotion. */
export const useSetCustomerVip = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: setCustomerVip,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] })
    },
  })
}
