import api from '@/lib/api'
import { clearGuestWishlist } from '@/lib/wishlist-storage'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useGuestWishlistStore } from '../stores/guest-wishlist-store'
import type { WishlistItemProduct } from '@/components/wishlist/wishlist-item'
import { toast } from 'sonner'

// types

interface Asset {
  id: string
  publicId: string
  altText: string | null
  sortOrder: number
  resourceType: string
  entityType: string
  entityId: string
}

interface WishlistProduct {
  id: string
  name: string
  slug: string
  price: number
  assets: Asset[]
  inStock: boolean
  stock: number
  category: { name: string }
}

interface WishlistItem {
  id: string
  wishlistId: string
  productId: string
  createdAt: string
  product: WishlistProduct
}

interface Wishlist {
  id: string
  userId: string
  items: WishlistItem[]
  createdAt: string
  updatedAt: string
}

// response from POST /wishlist/toggle
interface ToggleWishlistResponse {
  wishlisted: boolean  // true = just added, false = just removed
  wishlist: Wishlist
}

// fetchers

const fetchWishlist = async (): Promise<Wishlist> => {
  const res = await api.get('/wishlist')
  return res.data
}

const toggleWishlistItem = async (productId: string): Promise<ToggleWishlistResponse> => {
  const res = await api.post('/wishlist/toggle', { productId })
  return res.data
}

const removeWishlistItem = async (itemId: string): Promise<Wishlist> => {
  const res = await api.delete(`/wishlist/${itemId}`)
  return res.data
}

const mergeWishlist = async (productIds: string[]): Promise<Wishlist> => {
  const res = await api.post('/wishlist/merge', { productIds })
  return res.data
}

// hooks

/**
 * Fetches the current user's wishlist.
 * staleTime is 0 — wishlist must always be fresh so heart icons reflect real state.
 * Only runs when the user is authenticated (enabled prop controls this).
 */
export const useWishlist = (enabled = true) => {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: fetchWishlist,
    staleTime: 0,
    enabled,
  })
}

/**
 * Toggles a product in the wishlist — adds if not present, removes if already there.
 * Guest → updates Zustand + localStorage instantly, fires toast (unless silent), no API call.
 * Authenticated → toast + optimistic cache update fire instantly on click,
 * API call runs in background, onSettled replaces optimistic data with server truth.
 * Rolls back cache and shows error toast if the API call fails.
 * silent=true suppresses the built-in toast so the caller can fire its own
 * (e.g. "moved to wishlist" instead of "added to wishlist" from the cart).
 */
export const useToggleWishlist = (isAuthenticated: boolean, silent = false) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { productId: string; product?: WishlistItemProduct }) => {
      if (!isAuthenticated) {
        if (!params.product) return Promise.resolve({ wishlisted: false, wishlist: null as unknown as Wishlist })
        // toggle localStorage + Zustand, get back whether it was added or removed
        const wishlisted = useGuestWishlistStore.getState().toggleItem(params.product)
        // only fire toast if not silent — caller will fire its own when silent=true
        if (!silent) {
          toast.success(
            wishlisted
              ? `${params.product.name} added to wishlist`
              : `${params.product.name} removed from wishlist`,
            { position: 'top-right' }
          )
        }
        return Promise.resolve({ wishlisted, wishlist: null as unknown as Wishlist })
      }
      return toggleWishlistItem(params.productId)
    },
    onMutate: async (params) => {
      // guests are handled entirely in mutationFn — nothing to do here
      if (!isAuthenticated) return

      // cancel any in-flight wishlist fetches so they don't overwrite the optimistic update
      await queryClient.cancelQueries({ queryKey: ['wishlist'] })

      // snapshot current cache for rollback if the API call fails
      const previous = queryClient.getQueryData<Wishlist>(['wishlist'])
      const productName = params.product?.name ?? ''

      // determine add vs remove from the snapshot before mutating
      const isCurrentlyWishlisted = previous?.items.some(
        (i) => i.productId === params.productId
      ) ?? false

      // only fire toast if not silent — caller will fire its own when silent=true
      if (!silent) {
        toast.success(
          isCurrentlyWishlisted
            ? `${productName} removed from wishlist`
            : `${productName} added to wishlist`,
          { position: 'top-right' }
        )
      }

      // apply optimistic update to cache so heart icon and badge update instantly
      queryClient.setQueryData<Wishlist>(['wishlist'], (old) => {
        if (!old) return old
        const exists = old.items.some((i) => i.productId === params.productId)
        if (exists) {
          // optimistic remove
          return {
            ...old,
            items: old.items.filter((i) => i.productId !== params.productId),
          }
        }
        // optimistic add — use params.product which has the full product shape
        if (!params.product) return old
        return {
          ...old,
          items: [
            ...old.items,
            {
              id: `optimistic-${params.productId}`,
              wishlistId: old.id,
              productId: params.productId,
              createdAt: new Date().toISOString(),
              product: {
                id: params.product.id,
                name: params.product.name,
                slug: params.product.slug,
                price: params.product.price,
                assets: params.product.assets,
                inStock: params.product.inStock,
                stock: params.product.stock,
                category: params.product.category,
              },
            },
          ],
        }
      })
      return { previous }
    },
    onError: (_err, params, context) => {
      // roll back to the snapshot so the UI reflects the real server state
      if (context?.previous) {
        queryClient.setQueryData(['wishlist'], context.previous)
      }
      const productName = params.product?.name ?? ''
      toast.error(`Couldn't update wishlist for ${productName}. Please try again.`, {
        position: 'top-right',
      })
    },
    onSettled: () => {
      // replace optimistic data with server truth regardless of success or failure
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      }
    },
  })
}

/**
 * Merges the guest's localStorage wishlist into their DB wishlist after login.
 * Called once immediately after a successful login if localStorage has items.
 * After this resolves, the frontend clears localStorage.
 */
export const useMergeWishlist = () => {
  const queryClient = useQueryClient()
  const { clearItems } = useGuestWishlistStore()

  return useMutation({
    mutationFn: (productIds: string[]) => mergeWishlist(productIds),
    onSuccess: () => {
      clearGuestWishlist()
      clearItems()
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })
}

/**
 * Removes a specific wishlist item by its WishlistItem ID.
 * Optimistic update fires instantly — item disappears before API responds.
 * Toast is NOT fired here — caller decides whether to show one based on context
 * (Remove button shows a remove toast, Move to Bag shows a moved toast instead).
 * Only fires a toast on error to inform the user the action failed.
 */
export const useRemoveWishlistItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (itemId: string) => removeWishlistItem(itemId),
    onMutate: async (itemId) => {
      // cancel in-flight wishlist fetches so they don't overwrite the optimistic update
      await queryClient.cancelQueries({ queryKey: ['wishlist'] })

      // snapshot current cache for rollback if the API call fails
      const previous = queryClient.getQueryData<Wishlist>(['wishlist'])

      // optimistic remove — item disappears from the list instantly
      queryClient.setQueryData<Wishlist>(['wishlist'], (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.filter((i) => i.id !== itemId),
        }
      })

      return { previous }
    },
    onError: (_err, _itemId, context) => {
      // roll back to snapshot so the UI reflects the real server state
      if (context?.previous) {
        queryClient.setQueryData(['wishlist'], context.previous)
      }
      toast.error("Couldn't remove item from wishlist. Please try again.", {
        position: 'top-right',
      })
    },
    onSettled: () => {
      // replace optimistic data with server truth regardless of success or failure
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    },
  })
}

/**
 * Checks if a product is wishlisted.
 * For authenticated users — checks the React Query cache.
 * For guests — checks localStorage directly.
 * Use this for the heart icon filled/empty state.
 */
export const useIsWishlisted = (productId: string, isAuthenticated: boolean): boolean => {
  const { data: wishlist } = useWishlist(isAuthenticated)
  // guest — read from Zustand store so heart icons react to toggle changes
  const { items: guestItems } = useGuestWishlistStore()

  if (!isAuthenticated) {
    return guestItems.some((i) => i.id === productId)
  }

  return wishlist?.items.some((i) => i.productId === productId) ?? false
}