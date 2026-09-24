import api from '@/lib/api'
import { clearGuestCart, type GuestCartItemType } from '@/lib/cart-storage'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import { useGuestCartStore } from '../stores/guest-cart-store'
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

interface CartProduct {
  id: string
  name: string
  slug: string
  price: number
  assets: Asset[]
  inStock: boolean
  stock: number
  category: { name: string }
  subcategory: { name: string } | null
}

interface CartItem {
  id: string
  cartId: string
  productId: string
  quantity: number
  createdAt: string
  updatedAt: string
  product: CartProduct
}

export interface Cart {
  id: string
  userId: string
  items: CartItem[]
  total: number
  createdAt: string
  updatedAt: string
}

interface AddToCartPayload {
  productId: string
  quantity: number
  // included when guest — needed to store full product details in localStorage
  guestItem?: GuestCartItemType
  // included for optimistic updates when authenticated
  productData?: {
    id: string
    name: string
    slug: string
    price: number
    assets: Asset[]
    inStock: boolean
    stock: number
    category: { name: string }
    subcategory: { name: string } | null
  }
}

interface UpdateCartItemPayload {
  quantity: number
}

// items from localStorage guest cart to merge into DB cart after login
interface LocalCartItem {
  productId: string
  quantity: number
}

// fetchers

const fetchCart = async (): Promise<Cart> => {
  const res = await api.get('/cart')
  return res.data
}

const addToCart = async (payload: AddToCartPayload): Promise<Cart> => {
  const res = await api.post('/cart', payload)
  return res.data
}

const updateCartItem = async (itemId: string, payload: UpdateCartItemPayload): Promise<Cart> => {
  const res = await api.patch(`/cart/${itemId}`, payload)
  return res.data
}

const removeCartItem = async (itemId: string): Promise<Cart> => {
  const res = await api.delete(`/cart/${itemId}`)
  return res.data
}

const clearCart = async (): Promise<Cart> => {
  const res = await api.delete('/cart/clear')
  return res.data
}

const mergeCart = async (items: LocalCartItem[]): Promise<Cart> => {
  const res = await api.post('/cart/merge', { items })
  return res.data
}

// fetches fresh stock data for a list of productIds — used by guest cart hydration
export const validateGuestCart = async (productIds: string[]): Promise<{ productId: string; stock: number }[]> => {
  const res = await api.post('/cart/validate-guest', { productIds })
  return res.data
}


// hooks

/**
 * Fetches the current user's cart from the DB.
 * staleTime is 0 — cart must always be fresh to reflect latest stock/price.
 * Only runs when the user is authenticated (enabled prop controls this).
 */
export const useCart = (enabled = true) => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    staleTime: 0,
    enabled,
  })
}

/**
 * Adds a product to the cart.
 * Guest → writes to localStorage. Authenticated → calls API with optimistic update.
 * If the product is already in the cart, the backend increments quantity.
 */
export const useAddToCart = (isAuthenticated: boolean) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AddToCartPayload) => {
      // guest — store action writes localStorage AND updates Zustand immediately, no API call
      if (!isAuthenticated) {
        if (payload.guestItem) useGuestCartStore.getState().addItem(payload.guestItem)
        return Promise.resolve(null as unknown as Cart)
      }
      // authenticated — this is the actual API call
      return addToCart({ productId: payload.productId, quantity: payload.quantity })
    },
    onMutate: async (payload: AddToCartPayload) => {
      // optimistic updates only make sense for authenticated users
      // guests see localStorage update immediately via Zustand
      if (!isAuthenticated) return

      await queryClient.cancelQueries({ queryKey: ['cart'] })
      const previousCart = queryClient.getQueryData<Cart>(['cart'])

      queryClient.setQueryData<Cart>(['cart'], (old) => {
        if (!old) return old

        const existingIndex = old.items.findIndex(
          (item) => item.productId === payload.productId,
        )

        let updatedItems: CartItem[]

        if (existingIndex >= 0) {
          // item exists — increment quantity optimistically
          updatedItems = old.items.map((item, i) =>
            i === existingIndex
              ? { ...item, quantity: item.quantity + payload.quantity }
              : item,
          )
        } else if (payload.productData) {
          // new item — add optimistically with temp id
          updatedItems = [
            ...old.items,
            {
              id: `temp-${payload.productId}`,
              cartId: old.id,
              productId: payload.productId,
              quantity: payload.quantity,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              product: payload.productData,
            },
          ]
        } else {
          // no product data to optimistically add — leave cache as-is
          return old
        }

        return {
          ...old,
          items: updatedItems,
          total: updatedItems.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0,
          ),
        }
      })

      return { previousCart }
    },
    onError: (_err, _variables, context) => {
      // rollback optimistic update on API failure
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart)
      }
    },
    onSettled: () => {
      // sync with server truth after success or failure
      // guests don't have a server cart so skip invalidation
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ['cart'] })
      }
    },
  })
}

/**
 * Updates the quantity of a specific cart item with debounced API calls.
 * UI updates immediately via optimistic update — API only called after
 * the user stops pressing for 600ms to avoid hammering the endpoint.
 */
export const useUpdateCartItem = () => {
  const queryClient = useQueryClient()
  // store one debounce timer per itemId so multiple items don't interfere
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const mutate = useCallback(
    ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      // optimistic update — update the cache immediately so UI reflects change at once
      queryClient.setQueryData<Cart>(['cart'], (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item,
          ),
          // recompute total optimistically
          total: old.items.reduce(
            (sum, item) =>
              sum + item.product.price * (item.id === itemId ? quantity : item.quantity),
            0,
          ),
        }
      })

      // clear any existing timer for this item
      if (timers.current[itemId]) clearTimeout(timers.current[itemId])

      // wait 600ms after the last press before firing the API call
      timers.current[itemId] = setTimeout(() => {
        updateCartItem(itemId, { quantity })
          .then((updated) => {
            // replace optimistic data with server truth
            queryClient.setQueryData(['cart'], updated)
          })
          .catch(() => {
            // rollback on failure by refetching the real cart
            queryClient.invalidateQueries({ queryKey: ['cart'] })
          })
      }, 600)
    },
    [queryClient],
  )

  return { mutate }
}

/**
 * Removes a single item from the cart by its CartItem ID.
 * Direct API call — no debounce needed, this is a deliberate single action.
 * Pass silent=true in the mutate call to suppress the success toast
 * when the caller fires a more specific one e.g. "moved to wishlist".
 */
export const useRemoveCartItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId }: { itemId: string; silent?: boolean }) => removeCartItem(itemId),
    onMutate: async ({ itemId, silent }) => {
      // cancel any outgoing refetches to avoid overwriting the optimistic update
      await queryClient.cancelQueries({ queryKey: ['cart'] })

      // snapshot the item name before removing — needed for the success toast
      const previous = queryClient.getQueryData<Cart>(['cart'])
      const itemName = previous?.items.find((i) => i.id === itemId)?.product.name

      // remove the specific item from cache immediately
      queryClient.setQueryData<Cart>(['cart'], (old) => {
        if (!old) return old
        const updatedItems = old.items.filter((item) => item.id !== itemId)
        return {
          ...old,
          items: updatedItems,
          total: updatedItems.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0,
          ),
        }
      })

      // caller suppresses when firing a more specific toast e.g. "moved to wishlist"
      if (!silent) {
        toast.success(`${itemName ?? 'Item'} removed from cart`, {
          position: 'top-right',
        })
      }

      return { previous, itemName }
    },
    onError: (_err, _variables, context) => {
      // rollback on failure
      if (context?.previous) {
        queryClient.setQueryData(['cart'], context.previous)
      }
      toast.error("Couldn't remove item from cart. Please try again.", {
        position: 'top-right',
      })
    },
    onSettled: () => {
      // sync with server truth after success or failure
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

/**
 * Clears all items from the cart without deleting the cart itself.
 * Called after successful checkout or from a "clear cart" UI button.
 */
export const useClearCart = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

/**
 * Merges the guest's localStorage cart into their DB cart after login.
 * Called once immediately after a successful login if localStorage has items.
 * After this resolves, the frontend clears localStorage and uses DB as source of truth.
 */
export const useMergeCart = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (items: LocalCartItem[]) => mergeCart(items),
    onSuccess: () => {
      clearGuestCart()
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}
