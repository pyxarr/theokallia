import { create } from 'zustand'
import {
    addToGuestCart,
    clearGuestCart,
    getGuestCart,
    removeFromGuestCart,
    updateGuestCartItem,
    type GuestCartItemType,
} from '@/lib/cart-storage'
import { validateGuestCart } from '../hooks/use-cart'

interface GuestCartState {
    // in-memory items — reactive layer over localStorage
    items: GuestCartItemType[]
    // hydrates the store from localStorage on app load — call once in a client component
    hydrate: () => Promise<void>
    // adds or increments a product — syncs to localStorage
    addItem: (item: GuestCartItemType) => void
    // sets the quantity of a specific product — removes if quantity <= 0
    updateItem: (productId: string, quantity: number) => void
    // removes a product entirely
    removeItem: (productId: string) => void
    // clears all items — called after merge on login
    clear: () => void
}

export const useGuestCartStore = create<GuestCartState>((set) => ({
    items: [], // start empty — hydrate() fills this on the client

    /**
     * Fetches fresh stock data from the API for all items in the guest cart,
     * updates stored stock values, caps quantities against fresh stock,
     * writes validated data back to localStorage, and populates the store.
     * Falls back to local stock cap if the API call fails.
     * Must be called client-side only — localStorage is not available on the server.
     * Called once in a top-level client component (e.g. ClientLayout).
     */
    hydrate: async () => {
        if (typeof window === 'undefined') return
        const items = getGuestCart()
        if (!items.length) {
            set({ items: [] })
            return
        }

        try {
            // fetch fresh stock values from API for all items in guest cart
           const stockData = await validateGuestCart(items.map((i) => i.productId))

            // update each item with fresh stock from API, then cap quantity
            const validated = items.map((item) => {
                const fresh = stockData.find((s) => s.productId === item.productId)
                const freshStock = fresh?.stock ?? item.stock
                return {
                    ...item,
                    stock: freshStock,
                    quantity: Math.min(item.quantity, freshStock),
                }
            })

            // write validated data back to localStorage so it stays consistent
            localStorage.setItem('theokallia_guest_cart', JSON.stringify(validated))
            set({ items: validated })
        } catch {
            // if API call fails, fall back to local stock cap — better than nothing
            const validated = items.map((item) => ({
                ...item,
                quantity: Math.min(item.quantity, item.stock),
            }))
            localStorage.setItem('theokallia_guest_cart', JSON.stringify(validated))
            set({ items: validated })
        }
    },

    /**
     * Adds a product to the guest cart or increments its quantity if it already exists.
     * Writes to localStorage first, then syncs the store from the updated localStorage state
     * so the in-memory items always match what's persisted.
     */
    addItem: (item) => {
        addToGuestCart(item) // write to localStorage (handles stock cap)
        set({ items: getGuestCart() }) // sync store from localStorage
    },

    /**
     * Updates the quantity of a specific product in the guest cart.
     * If quantity is 0 or below, the item is removed entirely.
     */
    updateItem: (productId, quantity) => {
        updateGuestCartItem(productId, quantity) // write to localStorage
        set({ items: getGuestCart() }) // sync store
    },

    /**
     * Removes a product from the guest cart entirely.
     */
    removeItem: (productId) => {
        removeFromGuestCart(productId) // write to localStorage
        set({ items: getGuestCart() }) // sync store
    },

    /**
     * Clears all items from the guest cart.
     * Called after a successful merge into the DB cart on login.
     */
    clear: () => {
        clearGuestCart() // wipe localStorage
        set({ items: [] }) // clear store
    },
}))