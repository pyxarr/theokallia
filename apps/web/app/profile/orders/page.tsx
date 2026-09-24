'use client'

import { ChevronLeft, Package } from 'lucide-react'
import Link from 'next/link'
import { useOrders } from '@/lib/hooks/use-orders'
import { useAuthStore } from '@/lib/stores/auth-store'
import OrderItem from '@/components/orders/order-item'

export default function OrdersPage() {
  const { isAuthenticated } = useAuthStore()
  const { data: orders, isLoading } = useOrders(isAuthenticated)

  if (isLoading && isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-white px-20 pt-10 flex flex-col items-center justify-center">
        <p className="text-gray-500">Loading your orders...</p>
      </div>
    )
  }

  const orderList = orders ?? []

  return (
    <div className="min-h-screen w-full bg-white px-20 pt-10">
      <div className="mb-12 flex items-baseline gap-4">
        <h1 className="font-le-jour text-6xl tracking-wide uppercase">
          My Orders
        </h1>
      </div>

      {orderList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <Package size={64} className="text-gray-300 mb-6" />
          <p className="text-xl text-gray-600 mb-8">You haven&apos;t placed any orders yet.</p>
          <Link href="/shop">
            <button className="bg-[#7E22CE] px-8 py-3 text-sm tracking-widest text-white uppercase hover:bg-purple-700">
              Start Shopping
            </button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {orderList.map((order) => (
            <OrderItem key={order.id} order={order} />
          ))}
        </div>
      )}

      <div className="mt-16 mb-10">
        <Link
          href="/profile"
          className="flex items-center gap-1 font-le-jour text-base tracking-widest uppercase"
        >
          <ChevronLeft size={24} />
          Back to Profile
        </Link>
      </div>
    </div>
  )
}
