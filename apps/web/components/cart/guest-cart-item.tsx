'use client'

import Image from 'next/image'
import { Button } from '../ui/button'
import type { GuestCartItemType } from '@/lib/cart-storage'
import { useToggleWishlist } from '@/lib/hooks/use-wishlist'
import { useGuestWishlistStore } from '@/lib/stores/guest-wishlist-store'
import { useCurrency } from '@/lib/hooks/use-currency'
import { toast } from 'sonner'

interface GuestCartItemProps {
  item: GuestCartItemType
  onUpdate: (quantity: number) => void
  onRemove: () => void
}

export default function GuestCartItem({
  item,
  onUpdate,
  onRemove,
}: GuestCartItemProps) {
  // silent=true — suppresses the hook's built-in toast so we can fire "moved to wishlist" instead
  const { mutate: toggleWishlist } = useToggleWishlist(false, true)

  // read from Zustand store — reactive, updates immediately when wishlist changes
  const { items: guestWishlistItems } = useGuestWishlistStore()
  const { format, convert } = useCurrency()

  // check if this product is already in the guest wishlist
  const isWishlisted = guestWishlistItems.some((i) => i.id === item.productId)

  // caller owns the success toast — onRemove is a plain store action with no toast
  const handleRemove = () => {
    onRemove()
    toast.success(`${item.name} removed from cart`, { position: 'top-right' })
  }

  const handleMoveToWishlist = () => {
    // build the product shape wishlist storage expects from the flat cart item
    toggleWishlist({
      productId: item.productId,
      product: {
        id: item.productId,
        name: item.name,
        slug: item.slug,
        price: item.price,
        assets: [{
          id: item.productId,
          publicId: item.image,
          altText: item.name,
          sortOrder: 0,
          resourceType: 'image',
          entityType: 'Product',
          entityId: item.productId,
        }],
        inStock: item.stock > 0,
        stock: item.stock,
        category: { name: item.categoryName },
        subcategory: item.subcategoryName
          ? { name: item.subcategoryName }
          : null,
      },
    })
    // remove from cart and fire specific toast — hook toast suppressed via silent=true
    onRemove()
    toast.success(`${item.name} moved to wishlist`, { position: 'top-right' })
  }

  return (
    <div className="flex max-w-xl gap-6 bg-neutral-50 p-4">
      <div className="relative h-44 w-44 shrink-0">
        <Image
          src={item.image || '/placeholder-image.jpg'}
          alt={item.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between py-2">
        {/* name + price */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xl font-medium">{item.name}</p>
            <p className="text-lg text-gray-600">
              {item.subcategoryName ?? item.categoryName}
            </p>
          </div>
          <p className="font-allure text-lg font-semibold text-gray-900">
            {format(convert(item.price, item) * item.quantity)}
          </p>
        </div>

        {/* disabled when already wishlisted — text reflects current state */}
        <button
          onClick={handleMoveToWishlist}
          disabled={isWishlisted}
          className="w-max cursor-pointer text-start text-base font-semibold underline disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isWishlisted ? 'Already in Wishlist' : 'Move to Wishlist'}
        </button>

        {/* quantity stepper + remove */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                // decrement to 0 removes the item entirely
                item.quantity > 1 ? onUpdate(item.quantity - 1) : handleRemove()
              }
              className="flex h-7 w-7 items-center justify-center border border-gray-300 text-lg leading-none transition-colors hover:border-black"
            >
              −
            </button>
            <span className="min-w-6 text-center text-sm">{item.quantity}</span>
            <button
              onClick={() => onUpdate(item.quantity + 1)}
              // disable when quantity has reached available stock
              disabled={item.quantity >= item.stock}
              className="flex h-7 w-7 items-center justify-center border border-gray-300 text-lg leading-none transition-colors hover:border-black disabled:border-gray-300 disabled:opacity-40"
            >
              +
            </button>
          </div>

          <Button
            variant="outline"
            onClick={handleRemove}
            className="border border-black px-4 py-2 text-sm transition-colors hover:bg-black hover:text-white"
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  )
}
