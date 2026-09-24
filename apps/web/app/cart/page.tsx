'use client'

import { ChevronLeft, Package, Shield, Truck } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useCart, useUpdateCartItem } from '@/lib/hooks/use-cart'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useGuestCartStore } from '@/lib/stores/guest-cart-store'
import { useCurrency } from '@/lib/hooks/use-currency'
import CartItem from '@/components/cart/cart-item'
import GuestCartItem from '@/components/cart/guest-cart-item'
import { useEffect } from 'react'
import { ViewTransition } from 'react'
import { useRouter } from 'next/navigation'

// delivery fee is a fixed global constant — will move to a config endpoint when admin panel is built
const DELIVERY_FEE = 10000

export default function CartPage() {
  const router = useRouter()
  const { isAuthenticated, openAuthModal, setRedirectTo } = useAuthStore()
  const { formatPrice } = useCurrency()

  // authenticated cart — only fetches when user is logged in
  const { data: dbCart, isLoading } = useCart(isAuthenticated)
  const { mutate: updateItem } = useUpdateCartItem()

  // guest cart — reads from Zustand store (hydrated from localStorage on app load)
  const {
    items: guestItems,
    updateItem: updateGuestItem,
    removeItem: removeGuestItem,
    hydrate,
  } = useGuestCartStore()

  useEffect(() => {
    // re-validate guest cart stock when user lands on cart page
    // ensures quantities reflect any stock changes since app load
    if (!isAuthenticated) {
      void hydrate()
    }
  }, [isAuthenticated, hydrate])

  // unified items and subtotal — same shape regardless of auth state
  const items = isAuthenticated ? (dbCart?.items ?? []) : guestItems

  const subtotal = isAuthenticated
    ? (dbCart?.total ?? 0)
    : guestItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const orderTotal = subtotal + DELIVERY_FEE

  const handleCheckout = () => {
    if (!isAuthenticated) {
      // redirect back to cart after login so the user doesn't lose their place
      setRedirectTo('/cart')
      openAuthModal('login')
      return
    }
    
    router.push('/checkout')
  }

  // show loading state while DB cart is fetching — guests never hit this since Zustand is synchronous
  if (isLoading && isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-white px-20 pt-10">
        <div className="mb-12 flex items-baseline gap-4">
          <h1 className="font-le-jour text-6xl tracking-wide uppercase">
            Shopping Bag
          </h1>
        </div>
        <div className="flex flex-col items-center py-32">
          <p className="text-gray-500">Loading your bag...</p>
        </div>
      </div>
    )
  }

  // empty state — shown for both authenticated and guest users
  if (items.length === 0) {
    return (
      <div className="min-h-screen w-full bg-white px-20 pt-10">
        <div className="mb-12 flex items-baseline gap-4">
          <h1 className="font-le-jour text-6xl tracking-wide uppercase">
            Shopping Bag
          </h1>
          <span className="font-le-jour text-lg tracking-widest uppercase">
            (0 Items)
          </span>
        </div>
        <div className="flex flex-col items-center gap-6 py-32 text-center">
          <p className="text-xl text-gray-600">Your bag is empty</p>
          <Link href="/shop">
            <Button className="bg-[#7E22CE] px-8 py-3 text-sm tracking-widest text-white uppercase hover:bg-purple-700">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ViewTransition>
      <div className="min-h-screen w-full bg-white px-20 pt-10">
        {/* header */}
        <div className="mb-12 flex items-baseline gap-4">
          <h1 className="font-le-jour text-6xl tracking-wide uppercase">
            Shopping Bag
          </h1>
          <span className="font-le-jour text-lg tracking-widest uppercase">
            ({items.length} {items.length === 1 ? 'Item' : 'Items'})
          </span>
        </div>

        <div className="flex items-start gap-16">
          {/* cart items — authenticated renders CartItem, guest renders GuestCartItem */}
          <div className="flex flex-1 flex-col gap-4">
            {isAuthenticated
              ? dbCart?.items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdate={(quantity) =>
                      updateItem({ itemId: item.id, quantity })
                    }
                  />
                ))
              : guestItems.map((item) => (
                  <GuestCartItem
                    key={item.productId}
                    item={item}
                    onUpdate={(quantity) =>
                      updateGuestItem(item.productId, quantity)
                    }
                    onRemove={() => removeGuestItem(item.productId)}
                  />
                ))
            }
          </div>

          {/* order summary */}
          <ViewTransition name="order-summary">
            <div className="w-md shrink-0">
              <div className="flex flex-col gap-6 border border-gray-200 p-8">
                <div className="flex items-center justify-between">
                  <h2 className="font-le-jour text-2xl tracking-wide uppercase">
                    Subtotal
                  </h2>
                  <span className="text-2xl font-medium">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Delivery fee</span>
                  <span>{formatPrice(DELIVERY_FEE)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-sm font-medium">
                  <span>Total</span>
                  <span>{formatPrice(orderTotal)}</span>
                </div>
                <div className="flex flex-col gap-3 text-sm text-gray-700">
                  <div className="flex items-center gap-3">
                    <Shield size={16} />
                    <span>Secured payment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Package size={16} />
                    <span>Free Packaging</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Truck size={16} />
                    <span>Fast delivery (3-5 days)</span>
                  </div>
                </div>
                 <button
                  onClick={handleCheckout}
                  className="w-full cursor-pointer py-3 text-sm tracking-widest text-white uppercase transition-colors hover:bg-purple-700"
                  style={{ background: 'var(--color-primary)' }}
                >
                  {isAuthenticated ? 'Proceed to Checkout' : 'Sign in to Checkout'}
                </button>

              </div>
            </div>
          </ViewTransition>
        </div>

        {/* back to shop */}
        <div className="mt-16 mb-10">
          <Link
            href="/shop"
            className="flex items-center gap-1 font-le-jour text-base tracking-widest uppercase"
          >
            <ChevronLeft size={24} />
            Back to Shop
          </Link>
        </div>
      </div>
    </ViewTransition>
  )
}
