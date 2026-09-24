'use client'

import Image from 'next/image'
import { Button } from '../ui/button'
import { useRemoveCartItem } from '@/lib/hooks/use-cart'
import { useToggleWishlist, useWishlist } from '@/lib/hooks/use-wishlist'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useCurrency } from '@/lib/hooks/use-currency'
import { toast } from 'sonner'

interface Asset {
  id: string
  publicId: string
  altText: string | null
  sortOrder: number
  resourceType: string
  entityType: string
  entityId: string
}

interface CartItemProps {
  item: {
    id: string
    productId: string
    quantity: number
    product: {
      id: string
      name: string
      slug: string
      price: number
      usdPrice?: number | null
      gbpPrice?: number | null
      assets: Asset[]
      inStock: boolean
      stock: number
      category: { name: string }
      subcategory: { name: string } | null
    }
  }
  onUpdate: (quantity: number) => void
}

export default function CartItem({ item, onUpdate }: CartItemProps) {
  const { isAuthenticated } = useAuthStore()
  const { format, convert } = useCurrency()

  const { mutate: removeItem, isPending: isRemoving } = useRemoveCartItem()

  // silent=true — suppresses the hook's built-in toast so we can fire "moved to wishlist" instead
  const { mutate: toggleWishlist } = useToggleWishlist(isAuthenticated, true)

  // read wishlist cache to check if this product is already wishlisted
  const { data: dbWishlist } = useWishlist(isAuthenticated)
  const isWishlisted =
    dbWishlist?.items.some((i) => i.productId === item.productId) ?? false

  const handleMoveToWishlist = () => {
    // build the product shape useToggleWishlist expects from the cart item
    toggleWishlist({
      productId: item.productId,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        price: item.product.price,
        assets: item.product.assets,
        inStock: item.product.inStock,
        stock: item.product.stock,
        category: item.product.category,
        subcategory: item.product.subcategory,
      },
    })
    // silent=true — suppresses "removed from cart" toast so "moved to wishlist" fires instead
    removeItem({ itemId: item.id, silent: true })
    toast.success(`${item.product.name} moved to wishlist`, {
      position: 'top-right',
    })
  }

  return (
    <div className="flex max-w-xl gap-6 bg-neutral-50 p-4">
      <div className="relative h-44 w-44 shrink-0">
        <Image
          src={item.product.assets[0]?.publicId || '/placeholder-image.jpg'}
          alt={item.product.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between py-2">
        {/* name + price */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xl font-medium">{item.product.name}</p>
            <p className="text-lg text-gray-600">
              {item.product.subcategory?.name ?? item.product.category.name}
            </p>
          </div>
          <p className="font-allure text-lg font-semibold text-gray-900">
            {format(convert(item.product.price, item.product) * item.quantity)}
          </p>
        </div>

        {/* disabled when already wishlisted — text reflects current state */}
        <button
          onClick={handleMoveToWishlist}
          disabled={isWishlisted || isRemoving}
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
                item.quantity > 1
                  ? onUpdate(item.quantity - 1)
                  : removeItem({ itemId: item.id })
              }
              disabled={isRemoving}
              className="flex h-7 w-7 items-center justify-center border border-gray-300 text-lg leading-none transition-colors hover:border-black disabled:opacity-40"
            >
              −
            </button>
            <span className="min-w-6 text-center text-sm">{item.quantity}</span>
            <button
              onClick={() => onUpdate(item.quantity + 1)}
              // disable when removing or when quantity has reached available stock
              disabled={isRemoving || item.quantity >= item.product.stock}
              className="flex h-7 w-7 items-center justify-center border border-gray-300 text-lg leading-none transition-colors hover:border-black disabled:border-gray-300 disabled:opacity-40"
            >
              +
            </button>
          </div>

          <Button
            variant="outline"
            onClick={() => removeItem({ itemId: item.id })}
            disabled={isRemoving}
            className="border border-black px-4 py-2 text-sm transition-colors hover:bg-black hover:text-white disabled:opacity-40"
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  )
}
