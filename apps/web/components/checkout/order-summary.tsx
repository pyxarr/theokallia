'use client'

import { Package, Shield, Truck } from 'lucide-react'
import { useCart } from '@/lib/hooks/use-cart'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useCurrency } from '@/lib/hooks/use-currency'

type SummaryItem = {
  id: string
  quantity: number
  product: {
    name: string
    price?: number
    images?: string[]
    usdPrice?: number | null
    gbpPrice?: number | null
  }
  price?: number
}

interface OrderSummaryProps {
  shippingFee?: number
  discount?: number
  couponCode?: string
}

export default function OrderSummary({ shippingFee = 0, discount = 0, couponCode }: OrderSummaryProps) {
  const { isAuthenticated } = useAuthStore()
  const { data: dbCart } = useCart(isAuthenticated)
  const { formatPrice, format, convert } = useCurrency()

  const items = dbCart?.items ?? []
  const subtotal = dbCart?.total ?? 0
  const orderTotal = Math.max(0, subtotal - discount + shippingFee)

  if (items.length === 0) {
    return null
  }

  return (
    <div className="w-md shrink-0">
      <div className="flex flex-col gap-6 border border-gray-200 p-8">
        <h2 className="font-le-jour text-2xl tracking-wide uppercase">
          Order Summary
        </h2>
        
        <div className="flex flex-col gap-4">
          {items.map((item: SummaryItem) => {
            const displayPrice = item.product.price ?? item.price ?? 0
            return (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {item.product.name} × {item.quantity}
              </span>
              <span className="font-medium">
                {format(convert(displayPrice, item.product) * item.quantity)}
              </span>
            </div>
            )
          })}
        </div>

        <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Delivery fee</span>
            <span>{formatPrice(shippingFee)}</span>
          </div>
          {discount > 0 && (
            <div className="flex items-center justify-between text-sm text-green-600">
              <span>Discount {couponCode ? `(${couponCode})` : ''}</span>
              <span>−{formatPrice(discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-lg font-medium">
            <span>Total</span>
            <span>{formatPrice(orderTotal)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Shield size={14} />
            <span>Secured payment via Paystack</span>
          </div>
          <div className="flex items-center gap-2">
            <Package size={14} />
            <span>Luxury packaging included</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck size={14} />
            <span>Delivery within 3-5 business days</span>
          </div>
        </div>
      </div>
    </div>
  )
}