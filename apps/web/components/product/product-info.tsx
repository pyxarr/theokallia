'use client'

import { Heart, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/auth-store'
import {
  useAddToCart,
  useCart,
  useUpdateCartItem,
  useRemoveCartItem,
} from '@/lib/hooks/use-cart'
import { useToggleWishlist, useIsWishlisted } from '@/lib/hooks/use-wishlist'
import { useGuestCartStore } from '@/lib/stores/guest-cart-store'
import { toast } from 'sonner'
import type { Product } from '@/lib/hooks/use-products'
import { useCurrency } from '@/lib/hooks/use-currency'

interface ProductInfoProps {
  product: Product
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const { isAuthenticated } = useAuthStore()
  const { formatPrice } = useCurrency()

  const { mutate: addToCart, isPending: isAdding } =
    useAddToCart(isAuthenticated)
  const { mutate: updateItem } = useUpdateCartItem()
  const { mutate: removeItem } = useRemoveCartItem()
  const { mutate: toggleWishlist } = useToggleWishlist(isAuthenticated)
  const isWishlisted = useIsWishlisted(product.id, isAuthenticated)

  const { data: dbCart } = useCart(isAuthenticated)
  const { items: guestItems } = useGuestCartStore()

  // the actual CartItem record — needed for itemId on update/remove (auth only)
  const cartItem = isAuthenticated
    ? dbCart?.items.find((i) => i.productId === product.id)
    : null

  // how many of this product are already in the cart
  const quantityInCart = isAuthenticated
    ? (cartItem?.quantity ?? 0)
    : (guestItems.find((i) => i.productId === product.id)?.quantity ?? 0)

  // true once at least 1 unit is in the cart — controls stepper vs Buy Now
  const inCart = quantityInCart > 0

  const isOutOfStock = !product.inStock || product.stock === 0
  const isAtLimit = quantityInCart >= product.stock

  const handleBuyNow = () => {
    if (isOutOfStock || isAtLimit) return

    toast.success(`${product.name} added to bag`, { position: 'top-right' })

    addToCart(
      {
        productId: product.id,
        quantity: 1,
        guestItem: !isAuthenticated
          ? {
              productId: product.id,
              quantity: 1,
              name: product.name,
              price: product.price,
              image: product.assets[0]?.publicId || '/placeholder-image.jpg',
              categoryName: product.category.name,
              subcategoryName: product.subcategory?.name || null,
              slug: product.slug,
              stock: product.stock,
            }
          : undefined,
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
      },
      {
        onError: () => {
          toast.error(
            `Couldn't add ${product.name} to bag. Please try again.`,
            {
              position: 'top-right',
            }
          )
        },
      }
    )
  }

  const handleIncrement = () => {
    if (isAtLimit) return

    if (isAuthenticated) {
      if (!cartItem?.id) return
      updateItem({ itemId: cartItem.id, quantity: quantityInCart + 1 })
    } else {
      useGuestCartStore.getState().updateItem(product.id, quantityInCart + 1)
    }
  }

  const handleDecrement = () => {
    if (quantityInCart <= 1) {
      // remove entirely — UI falls back to Buy Now button
      if (isAuthenticated) {
        if (!cartItem?.id) return
        removeItem({ itemId: cartItem.id, silent: true })
      } else {
        useGuestCartStore.getState().removeItem(product.id)
      }
    } else {
      if (isAuthenticated) {
        if (!cartItem?.id) return
        updateItem({ itemId: cartItem.id, quantity: quantityInCart - 1 })
      } else {
        useGuestCartStore.getState().updateItem(product.id, quantityInCart - 1)
      }
    }
  }

  const handleToggleWishlist = () => {
    toggleWishlist({
      productId: product.id,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        assets: product.assets,
        inStock: product.inStock,
        stock: product.stock,
        category: product.category,
        subcategory: product.subcategory ?? null,
      },
    })
  }

  return (
    <div className="flex flex-col gap-6 font-cormorant-garamond">
      {/* name + category + price */}
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-3xl">{product.name}</h3>
            <h1 className="text-3xl font-semibold">
              {product.subcategory?.name}
            </h1>
          </div>
          {/* wishlist heart — filled when wishlisted */}
          <button
            onClick={handleToggleWishlist}
            className="cursor-pointer rounded-full p-1 transition-opacity hover:opacity-70"
          >
            <Heart
              size={22}
              className={
                isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'
              }
            />
          </button>
        </div>
        <p className="mt-4 font-le-jour text-3xl text-gray-900">
          {formatPrice(product.price, product)}
        </p>
      </div>

      {/* description */}
      <div className="border border-gray-400 p-4">
        <h2 className="mb-2 text-base font-semibold text-gray-900">
          Description
        </h2>
        <p className="text-base leading-relaxed font-light text-gray-600">
          {product.description}
        </p>
      </div>

      {/* stepper (in cart) or Buy Now (not yet in cart) */}
      {inCart ? (
        <div className="flex items-center gap-2">
          <button
            onClick={handleDecrement}
            className="flex h-8 w-8 items-center justify-center bg-[#7E22CE] text-white transition-opacity hover:opacity-80"
          >
            <Minus size={14} />
          </button>
          <span className="w-4 text-center font-le-jour text-base text-gray-900">
            {quantityInCart}
          </span>
          <button
            onClick={handleIncrement}
            disabled={isAtLimit}
            className="flex h-8 w-8 items-center justify-center bg-[#7E22CE] text-white transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            <Plus size={14} />
          </button>
        </div>
      ) : (
        <Button
          onClick={handleBuyNow}
          disabled={isAdding || isOutOfStock}
          className="w-full bg-[#7E22CE] py-5 text-base font-semibold tracking-wide text-white hover:opacity-90 disabled:opacity-50"
        >
          {isOutOfStock ? 'Out of Stock' : 'Buy Now'}
        </Button>
      )}
    </div>
  )
}

export default ProductInfo
