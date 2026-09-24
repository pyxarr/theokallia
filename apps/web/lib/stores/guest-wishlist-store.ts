import { getGuestWishlist, toggleGuestWishlist } from '@/lib/wishlist-storage'
import { create } from 'zustand'
import type { WishlistItemProduct } from '@/components/wishlist/wishlist-item'

interface GuestWishlistStore {
  items: WishlistItemProduct[] // full product objects stored in localStorage
  hydrate: () => void
  toggleItem: (product: WishlistItemProduct) => boolean // returns true if added, false if removed
  clearItems: () => void
}

/**
 * Reactive Zustand layer over the guest wishlist in localStorage.
 * Components subscribe to this store — no direct localStorage reads in UI.
 */
export const useGuestWishlistStore = create<GuestWishlistStore>((set) => ({
  items: [],

  /** Reads localStorage and syncs into Zustand. Call once on app load. */
  hydrate: () => {
    set({ items: getGuestWishlist() })
  },

  /** Toggles a product and syncs the result back into Zustand. */
  toggleItem: (product: WishlistItemProduct) => {
    const wishlisted = toggleGuestWishlist(product)
    set({ items: getGuestWishlist() })
    return wishlisted
  },

  /** Clears Zustand state — call alongside clearGuestWishlist() after merge. */
  clearItems: () => {
    set({ items: [] })
  },
}))