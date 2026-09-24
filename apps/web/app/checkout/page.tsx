'use client'

import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useCart } from '@/lib/hooks/use-cart'
import { useAuthStore } from '@/lib/stores/auth-store'
import { usePendingOrder } from '@/lib/hooks/use-orders'
import CheckoutForm from '@/components/checkout/checkout-form'
import OrderSummary from '@/components/checkout/order-summary'
import { useEffect, useState } from 'react'
import { ViewTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const { isAuthenticated } = useAuthStore()
  const { data: dbCart, isLoading: cartLoading } = useCart(isAuthenticated)
  const { pendingOrder, isLoading: ordersLoading } = usePendingOrder()
  const router = useRouter()
  
  const [appliedDiscount, setAppliedDiscount] = useState(0)
  const [appliedCouponCode, setAppliedCouponCode] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/cart')
    }
  }, [isAuthenticated, router])

  const isLoading = cartLoading || (isAuthenticated && ordersLoading)

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-white px-20 pt-10 flex flex-col items-center justify-center">
        <p className="text-gray-500">Loading checkout...</p>
      </div>
    )
  }

  const hasCartItems = dbCart && dbCart.items.length > 0
  const canCheckout = hasCartItems || !!pendingOrder

  if (!canCheckout) {
    return (
      <div className="min-h-screen w-full bg-white px-20 pt-10 flex flex-col items-center justify-center text-center">
        <h1 className="font-le-jour text-6xl tracking-wide uppercase mb-6">Empty Bag</h1>
        <p className="text-xl text-gray-600 mb-8">Your shopping bag is empty.</p>
        <Link href="/shop">
          <button className="bg-[#7E22CE] px-8 py-3 text-sm tracking-widest text-white uppercase hover:bg-purple-700">
            Continue Shopping
          </button>
        </Link>
      </div>
    )
  }

  return (
    <ViewTransition>
      <div className="min-h-screen w-full bg-white px-20 pt-10">
        <div className="mb-12 flex items-baseline gap-4">
          <h1 className="font-le-jour text-6xl tracking-wide uppercase">
            Checkout
          </h1>
        </div>

        <div className="flex items-start gap-16">
          <div className="flex-1">
            <CheckoutForm 
              onPaymentInitiated={() => {}} 
              isPending={false}
              onCouponApplied={(discount, code) => {
                setAppliedDiscount(discount)
                setAppliedCouponCode(code)
              }}
              onCouponCleared={() => {
                setAppliedDiscount(0)
                setAppliedCouponCode('')
              }}
            />
          </div>
          <ViewTransition name="order-summary">
            <OrderSummary
              shippingFee={pendingOrder?.shippingFee ?? 0}
              discount={appliedDiscount}
              couponCode={appliedCouponCode}
            />
          </ViewTransition>
        </div>

        <div className="mt-16 mb-10">
          <Link
            href="/cart"
            className="flex items-center gap-1 font-le-jour text-base tracking-widest uppercase"
          >
            <ChevronLeft size={24} />
            Back to Bag
          </Link>
        </div>
      </div>
    </ViewTransition>
  )
}
