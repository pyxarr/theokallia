import api from '@/lib/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth-store'

// types

interface Asset {
  id: string
  publicId: string
  altText: string | null
  sortOrder: number
  resourceType: string
  entityType: string
  entityId: string
}

interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  product: {
    name: string
    assets: Asset[]
  }
}

interface ShippingAddress {
  street: string
  city: string
  state: string
  country: string
}

interface Order {
  id: string
  total: number
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  shippingAddress: ShippingAddress
  shippingFee?: number
}

// fetchers

const fetchOrders = async (): Promise<Order[]> => {
  const res = await api.get('/orders')
  return res.data
}

const fetchOrderById = async (id: string): Promise<Order> => {
  const res = await api.get(`/orders/${id}`)
  return res.data
}

const createOrder = async (payload: { shippingAddress: ShippingAddress; couponCode?: string }): Promise<Order> => {
  const res = await api.post('/orders', payload)
  return res.data
}

// hooks

export const useOrders = (enabled = true) => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    enabled,
  })
}

export const useOrder = (id: string | undefined) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrderById(id!),
    enabled: !!id,
  })
}

export const useCreateOrder = () => {
  return useMutation({
    mutationFn: createOrder,
  })
}

export const usePendingOrder = () => {
  const { isAuthenticated } = useAuthStore()
  const { data: orders, isLoading } = useOrders(isAuthenticated)

  const pendingOrder = orders?.find((o) => o.status === 'PENDING') ?? null

  return { pendingOrder, isLoading }
}
