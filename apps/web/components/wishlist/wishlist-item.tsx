'use client'

import Image from 'next/image'
import { Button } from '../ui/button'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useRemoveWishlistItem } from '@/lib/hooks/use-wishlist'
import { useAddToCart, useCart } from '@/lib/hooks/use-cart'
import { useGuestWishlistStore } from '@/lib/stores/guest-wishlist-store'
import { useGuestCartStore } from '@/lib/stores/guest-cart-store'
import { useCurrency } from '@/lib/hooks/use-currency'
import { toast } from 'sonner'

export interface Asset {
  id: string
  publicId: string
  altText: string | null
  sortOrder: number
  resourceType: string
  entityType: string
  entityId: string
}

export interface WishlistItemProduct {
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
  subcategory?: { name: string } | null | undefined
}

interface WishlistItemProps {
  // authenticated wishlist item shape — has a WishlistItem wrapper with its own id
  item?: {
    id: string
    productId: string
    product: WishlistItemProduct
  }
  // guest wishlist item shape — just the product, no WishlistItem wrapper
  guestProduct?: WishlistItemProduct
}

export default function WishlistItem({
  item,
  guestProduct,
}: WishlistItemProps) {
  const { isAuthenticated } = useAuthStore()

  const { mutate: removeItem, isPending: isRemoving } = useRemoveWishlistItem()
  const { mutate: addToCart, isPending: isAddingToCart } =
    useAddToCart(isAuthenticated)
  const { toggleItem: toggleGuestWishlist } = useGuestWishlistStore()

  // cart data needed to check if the item is already at its stock limit
  const { data: dbCart } = useCart(isAuthenticated)
  const { items: guestItems } = useGuestCartStore()
  const { formatPrice } = useCurrency()

  // resolve product from whichever shape was passed — must happen before any product references
  const product = item?.product ?? guestProduct
  if (!product) return null

  // how many of this product are already in the cart
  const currentCartQty = isAuthenticated
    ? (dbCart?.items?.find((i) => i.productId === product.id)?.quantity ?? 0)
    : (guestItems.find((i) => i.productId === product.id)?.quantity ?? 0)

  // true when the cart already holds the maximum available stock for this product
  const isAtCartLimit = currentCartQty >= product.stock

  // silent flag suppresses the toast when called from handleMoveToBag
  // so only one toast fires for the whole move action
  const handleRemove = (silent = false) => {
    if (isAuthenticated && item) {
      // authenticated — hook handles optimistic update, toast, and rollback on failure
      if (!silent) {
        toast.success(`${product.name} removed from wishlist`, {
          position: 'top-right',
        })
      }
      removeItem(item.id)
    } else {
      // guest — synchronous localStorage write, never fails
      toggleGuestWishlist(product)
      if (!silent) {
        toast.success(`${product.name} removed from wishlist`, {
          position: 'top-right',
        })
      }
    }
  }

  const handleMoveToBag = () => {
    // block the action if the cart is already at the stock limit for this product
    if (isAtCartLimit) {
      toast.error(`${product.name} is already at its cart limit`, {
        position: 'top-right',
      })
      return
    }

    // single toast for the whole action — no separate remove toast
    toast.success(`${product.name} moved to bag`, { position: 'top-right' })

    if (isAuthenticated && item) {
      // call removeItem directly — bypasses handleRemove so the hook's onMutate
      // toast doesn't fire alongside the moved to bag toast
      removeItem(item.id)
    } else {
      // guest — pass silent=true to suppress the remove toast
      handleRemove(true)
    }

    addToCart({
      productId: product.id,
      quantity: 1,
      // guest shape — full item data written to localStorage
      guestItem: !isAuthenticated
        ? {
            productId: product.id,
            quantity: 1,
            name: product.name,
            price: product.price,
            usdPrice: product.usdPrice,
            gbpPrice: product.gbpPrice,
            image: product.assets[0]?.publicId || '/placeholder-image.jpg',
            categoryName: product.category.name,
            subcategoryName: product.subcategory?.name || null,
            slug: product.slug,
            stock: product.stock,
          }
        : undefined,
      // authenticated shape — used for optimistic cache update in useAddToCart
      productData: isAuthenticated
        ? {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            assets: product.assets,
            inStock: product.inStock,
            stock: product.stock,
            category: product.category,
            subcategory: product.subcategory ?? null,
          }
        : undefined,
    })
  }

  return (
    <div className="flex max-w-xl gap-6 bg-neutral-50 p-4">
      <div className="relative h-44 w-44 shrink-0">
        <Image
          src={product.assets[0]?.publicId || '/placeholder-image.jpg'}
          alt={product.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between py-2">
        {/* name + price */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xl font-medium">{product.name}</p>
            <p className="text-lg text-gray-600">
              {product.subcategory?.name ?? product.category.name}
            </p>
          </div>
          <p className="font-allure text-lg font-semibold text-gray-900">
            {formatPrice(product.price, product)}
          </p>
        </div>

        {/* move to bag + remove */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleMoveToBag}
            disabled={
              isAddingToCart || isRemoving || !product.inStock || isAtCartLimit
            }
            className="border border-black px-4 py-2 text-sm transition-colors hover:border-none hover:bg-[#7E22CE] hover:text-white disabled:opacity-40"
          >
            {!product.inStock
              ? 'Out of Stock'
              : isAtCartLimit
                ? 'Cart Limit Reached'
                : 'Move to Bag'}
          </Button>

          <Button
            variant="outline"
            onClick={() => handleRemove()}
            disabled={isRemoving || isAddingToCart}
            className="border border-black px-4 py-2 text-sm transition-colors hover:bg-black hover:text-white disabled:opacity-40"
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  )
}
