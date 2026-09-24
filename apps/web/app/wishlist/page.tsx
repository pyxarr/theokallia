'use client'

import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useWishlist } from '@/lib/hooks/use-wishlist'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useGuestWishlistStore } from '@/lib/stores/guest-wishlist-store'
import WishlistItem from '@/components/wishlist/wishlist-item'

export default function WishlistPage() {
  const { isAuthenticated } = useAuthStore()

  // authenticated wishlist — only fetches when user is logged in
  const { data: dbWishlist, isLoading: isWishlistLoading } =
    useWishlist(isAuthenticated)

  // guest wishlist — reads from Zustand store (hydrated from localStorage on app load)
  const { items: guestItems } = useGuestWishlistStore()

  // unified item count — same regardless of auth state
  const itemCount = isAuthenticated
    ? (dbWishlist?.items?.length ?? 0)
    : guestItems.length

  // show loading state while DB wishlist is fetching — guests never hit this
  if (isWishlistLoading && isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-white px-20 pt-10">
        <div className="mb-12 flex items-baseline gap-4">
          <h1 className="font-le-jour text-6xl tracking-wide uppercase">
            Wishlist
          </h1>
        </div>
        <div className="flex flex-col items-center py-32">
          <p className="text-gray-500">Loading your wishlist...</p>
        </div>
      </div>
    )
  }

  // empty state
  if (itemCount === 0) {
    return (
      <div className="min-h-screen w-full bg-white px-20 pt-10">
        <div className="mb-12 flex items-baseline gap-4">
          <h1 className="font-le-jour text-6xl tracking-wide uppercase">
            Wishlist
          </h1>
          <span className="font-le-jour text-lg tracking-widest uppercase">
            (0 Items)
          </span>
        </div>
        <div className="flex flex-col items-center gap-6 py-32 text-center">
          <p className="text-xl text-gray-600">Your wishlist is empty</p>
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
    <div className="min-h-screen w-full bg-white px-20 pt-10">
      {/* header */}
      <div className="mb-12 flex items-baseline gap-4">
        <h1 className="font-le-jour text-6xl tracking-wide uppercase">
          Wishlist
        </h1>
        <span className="font-le-jour text-lg tracking-widest uppercase">
          ({itemCount} {itemCount === 1 ? 'Item' : 'Items'})
        </span>
      </div>

      {/* wishlist items — authenticated renders DB items, guest renders from Zustand store */}
      <div className="flex flex-col gap-4">
        {isAuthenticated
          ? dbWishlist?.items.map((item) => (
              <WishlistItem key={item.id} item={item} />
            ))
          : guestItems.map((product) => (
              <WishlistItem key={product.id} guestProduct={product} />
            ))}
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
  )
}
