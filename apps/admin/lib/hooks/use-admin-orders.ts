import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import api from '@/lib/api'

export type AdminOrderStatus =
  'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'

export interface AdminOrderUser {
  firstName: string
  lastName: string
  email: string
  phone?: string | null
}

export interface AdminOrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    slug: string
    price: number
    assets: Array<{ publicId: string }>
  }
}

export interface AdminOrder {
  id: string
  userId: string
  status: AdminOrderStatus
  total: number
  discount: number
  shippingFee: number
  subtotal?: number
  shippingAddress: {
    street: string
    city: string
    state: string
    country: string
  } | null
  trackingNumber: string | null
  createdAt: string
  updatedAt: string
  user: AdminOrderUser
  items: AdminOrderItem[]
  shippingZone?: { name: string; rate: number } | null
  coupon?: { code: string } | null
}

export interface AdminOrderFilters {
  status?: AdminOrderStatus
  limit?: number
}

interface AdminOrdersPage {
  data: AdminOrder[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const fetchAdminOrders = async (
  filters: AdminOrderFilters,
  page: number
): Promise<AdminOrdersPage> => {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.limit) params.set('limit', String(filters.limit))
  params.set('page', String(page))

  const res = await api.get(`/orders/admin?${params.toString()}`)
  return res.data
}

const fetchAdminOrder = async (id: string): Promise<AdminOrder> => {
  const res = await api.get(`/orders/admin/${id}`)
  return res.data
}

const updateOrderStatus = async ({
  id,
  status,
  trackingNumber,
}: {
  id: string
  status: AdminOrderStatus
  trackingNumber?: string
}): Promise<AdminOrder> => {
  const res = await api.patch(`/orders/admin/${id}/status`, {
    status,
    trackingNumber,
  })
  return res.data
}

// Hooks

/** Admin order index — Load More pagination with optional status filter. */
export const useAdminOrders = (filters: AdminOrderFilters = {}) => {
  return useInfiniteQuery({
    queryKey: ['admin', 'orders', JSON.stringify(filters)],
    queryFn: ({ pageParam }) => fetchAdminOrders(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta
      return page < totalPages ? page + 1 : undefined
    },
    staleTime: 1000 * 30,
  })
}

/** Single order for the fulfillment view. */
export const useAdminOrder = (id: string | undefined) => {
  return useQuery({
    queryKey: ['admin', 'orders', id],
    queryFn: () => fetchAdminOrder(id!),
    enabled: !!id,
    staleTime: 1000 * 30,
  })
}

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
    },
  })
}

export interface AdminMetrics {
  /** Sum of order totals across paid, shipped, and delivered orders (NGN). */
  revenue: number
  /** Orders awaiting fulfilment — pending, paid, or shipped. */
  activeOrders: number
  /** Reviews awaiting moderation. */
  pendingReviews: number
  /** Active newsletter subscribers. */
  subscribers: number
}

const fetchAdminMetrics = async (): Promise<AdminMetrics> => {
  const res = await api.get('/orders/admin/metrics')
  return res.data
}

/** Overview-card aggregates for the dashboard. */
export const useAdminMetrics = () => {
  return useQuery({
    queryKey: ['admin', 'metrics'],
    queryFn: fetchAdminMetrics,
    staleTime: 1000 * 30,
  })
}
