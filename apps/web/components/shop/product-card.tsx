'use client'

import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { useState } from 'react'
import { ViewTransition } from 'react'
import { Button } from '../ui/button'
import { useAddToCart, useCart } from '@/lib/hooks/use-cart'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useGuestCartStore } from '@/lib/stores/guest-cart-store'
import type { Product } from '@/lib/hooks/use-products'
import { useCurrency } from '@/lib/hooks/use-currency'
import { useIsWishlisted, useToggleWishlist } from '@/lib/hooks/use-wishlist'
import { Heart } from 'lucide-react'

interface ProductCardProps {
  product: Product
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { isAuthenticated } = useAuthStore()
  const [showAdded, setShowAdded] = useState(false)
  const { formatPrice } = useCurrency()

  const { mutate: addToCart } =
    useAddToCart(isAuthenticated)

  // authenticated cart — reads from React Query cache, zero extra server calls
  const { data: dbCart } = useCart(isAuthenticated)

  // guest cart — reads from Zustand store, synchronous
  const { items: guestItems } = useGuestCartStore()

  // how many of this product are already in the cart
  // used to disable the button when the cart quantity has reached available stock
  const quantityInCart = isAuthenticated
    ? (dbCart?.items.find((i) => i.productId === product.id)?.quantity ?? 0)
    : (guestItems.find((i) => i.productId === product.id)?.quantity ?? 0)

  const isOutOfStock = !product.inStock || product.stock === 0
  const isAtLimit = quantityInCart >= product.stock

  // wishlist state — filled heart if wishlisted, empty if not
  const { mutate: toggleWishlist } = useToggleWishlist(isAuthenticated)
  const isWishlisted = useIsWishlisted(product.id, isAuthenticated)

  const handleAddToCart = () => {
    // show feedback immediately — don't wait for API round trip
    setShowAdded(true)
    setTimeout(() => setShowAdded(false), 2000)
    toast.success(`${product.name} added to bag`, {
      position: 'top-right',
    })

    addToCart(
      {
        productId: product.id,
        quantity: 1,
        // guest item carries full product details for localStorage storage
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
        // product data used for optimistic update in the authenticated cart cache
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
              subcategory: product.subcategory,
            }
          : undefined,
      },
      {
        onError: () => {
          // rollback button state and notify user the add failed
          setShowAdded(false)
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

  // derive button label from product and cart state — priority: out of stock > at limit > adding > added > default
  const buttonLabel = isOutOfStock
    ? 'Out of Stock'
    : isAtLimit
      ? 'Cart Limit Reached'
      : showAdded
        ? 'Added!'
        : 'Add To Bag'

  return (
    <div className="flex flex-col gap-2 font-cormorant-garamond">
      {/* image + info — wrapped in Link for navigation */}
      <Link href={`/shop/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {/* wishlist heart — outside the Link click area via stopPropagation */}
          <button
            onClick={(e) => {
              e.preventDefault()
              toggleWishlist({ productId: product.id, product })
            }}
            className="absolute top-2 right-2 z-10 cursor-pointer rounded-full bg-white p-1.5 shadow"
          >
            <Heart
              size={14}
              className={
                isWishlisted ? 'fill-red-500 text-red-500' : 'text-black'
              }
            />
          </button>
          {product.assets[0]?.publicId && (
            <ViewTransition name={product.slug}>
              <Image
                src={product.assets[0].publicId}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            </ViewTransition>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between text-lg text-gray-900">
          <span className="text-xl">{product.name}</span>
          <span className="font-le-jour">
            {formatPrice(product.price, product)}
          </span>
        </div>
        <p className="text-xl font-bold text-gray-900">
          {product.category.name}
        </p>
      </Link>

      {/* add to bag — outside the Link so it doesn't trigger navigation */}
      <Button
        variant="outline"
        onClick={handleAddToCart}
        disabled={isOutOfStock || isAtLimit}
        className="w-full py-5 text-base font-bold tracking-wide transition-colors hover:border-none hover:bg-[#7E22CE] hover:text-white disabled:opacity-50"
      >
        {buttonLabel}
      </Button>
    </div>
  )
}

export default ProductCard
