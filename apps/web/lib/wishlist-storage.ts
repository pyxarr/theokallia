import type { WishlistItemProduct } from '@/components/wishlist/wishlist-item'

const WISHLIST_KEY = 'theokallia_guest_wishlist'
const isBrowser = typeof window !== 'undefined'

/**
 * Reads the guest wishlist from localStorage.
 * Returns an empty array if nothing is stored or parsing fails.
 */
export const getGuestWishlist = (): WishlistItemProduct[] => {
  if (!isBrowser) return []
  try {
    const raw = localStorage.getItem(WISHLIST_KEY)
    return raw ? (JSON.parse(raw) as WishlistItemProduct[]) : []
  } catch {
    return []
  }
}

/**
 * Toggles a product in the guest wishlist.
 * Adds full product object if not present, removes if already there.
 * Returns true if added, false if removed.
 */
export const toggleGuestWishlist = (product: WishlistItemProduct): boolean => {
  if (!isBrowser) return false
  const items = getGuestWishlist()
  const index = items.findIndex((i) => i.id === product.id)
  if (index === -1) {
    items.push(product)
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(items))
    return true
  } else {
    items.splice(index, 1)
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(items))
    return false
  }
}

/**
 * Checks if a product is in the guest wishlist.
 */
export const isInGuestWishlist = (productId: string): boolean => {
  if (!isBrowser) return false
  return getGuestWishlist().some((i) => i.id === productId)
}

/**
 * Clears the entire guest wishlist from localStorage.
 * Called after a successful merge into the DB wishlist on login.
 */
export const clearGuestWishlist = (): void => {
  if (!isBrowser) return
  localStorage.removeItem(WISHLIST_KEY)
}