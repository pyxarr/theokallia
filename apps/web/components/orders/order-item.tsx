'use client'

import Image from 'next/image'
import { Calendar, Package, CreditCard } from 'lucide-react'
import { format } from 'date-fns'

interface OrderItemProps {
  order: {
    id: string
    total: number
    status: string
    createdAt: string
    items: {
      product: {
        name: string
        assets: { publicId: string }[]
      }
      quantity: number
    }[]
  }
}

export default function OrderItem({ order }: OrderItemProps) {
  const statusColors: Record<string, string> = {
    PENDING: 'text-yellow-600 bg-yellow-50',
    PAID: 'text-blue-600 bg-blue-50',
    SHIPPED: 'text-purple-600 bg-purple-50',
    DELIVERED: 'text-green-600 bg-green-50',
    CANCELLED: 'text-red-600 bg-red-50',
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 border border-gray-200 p-6 transition-colors hover:border-black">
      <div className="flex flex-col gap-2 min-w-[200px]">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Package size={16} />
          <span>Order #{order.id.slice(-8).toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar size={16} />
          <span>{format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
        </div>
        <div className="mt-2">
          <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded ${statusColors[order.status] || 'text-gray-600 bg-gray-50'}`}>
            {order.status}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <div className="flex flex-wrap gap-4">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-neutral-50 p-2 rounded">
              <div className="relative h-12 w-12 overflow-hidden rounded">
                <Image 
                  src={item.product.assets[0]?.publicId || '/placeholder-image.jpg'} 
                  alt={item.product.name} 
                  fill
                  className="object-cover" 
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium">{item.product.name}</span>
                <span className="text-[10px] text-gray-500">Qty: {item.quantity}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-end justify-center gap-1 min-w-[150px]">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <CreditCard size={16} />
          <span>Total</span>
        </div>
        <span className="font-allure text-xl font-semibold">
          ₦{order.total.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
