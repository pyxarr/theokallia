// guest cart stored in localStorage under this key
const CART_KEY = 'theokallia_guest_cart'

export interface GuestCartItemType {
    productId: string
    quantity: number
    name: string
    price: number
    usdPrice?: number | null
    gbpPrice?: number | null
    image: string
    categoryName: string
    subcategoryName: string | null
    slug: string
    stock: number
}

// guard against SSR — localStorage is browser-only
const isBrowser = typeof window !== 'undefined'

/**
 * Reads the guest cart from localStorage.
 * Returns an empty array if nothing is stored or parsing fails.
 */
export const getGuestCart = (): GuestCartItemType[] => {
    if (!isBrowser) return []
    try {
        const raw = localStorage.getItem(CART_KEY)
        return raw ? (JSON.parse(raw) as GuestCartItemType[]) : []
    } catch {
        return []
    }
}

/**
 * Adds or increments a product in the guest cart.
 * If the product already exists, its quantity is incremented by the given amount.
 */
export const addToGuestCart = (item: GuestCartItemType): void => {
    if (!isBrowser) return
    const items = getGuestCart()
    const existing = items.find((i) => i.productId === item.productId)
    if (existing) {
        const newQty = existing.quantity + item.quantity
        // cap at existing.stock — stock was stored when item was first added
        existing.quantity = Math.min(newQty, existing.stock)
    } else {
        // cap initial quantity too — defensive against bad call sites
        items.push({ ...item, quantity: Math.min(item.quantity, item.stock) })
    }
    localStorage.setItem(CART_KEY, JSON.stringify(items))
}

/**
 * Updates the quantity of a specific product in the guest cart.
 * If quantity drops to 0 or below, the item is removed.
 */
export const updateGuestCartItem = (productId: string, quantity: number): void => {
    if (!isBrowser) return
    const items = getGuestCart()
    if (quantity <= 0) {
        const filtered = items.filter((i) => i.productId !== productId)
        localStorage.setItem(CART_KEY, JSON.stringify(filtered))
    } else {
        const existing = items.find((i) => i.productId === productId)
        if (existing) {
            // cap at stock — prevents stepper from exceeding available stock
            existing.quantity = Math.min(quantity, existing.stock)
            localStorage.setItem(CART_KEY, JSON.stringify(items))
        }
    }
}

/**
 * Removes a product from the guest cart entirely.
 */
export const removeFromGuestCart = (productId: string): void => {
    if (!isBrowser) return
    const items = getGuestCart().filter((i) => i.productId !== productId)
    localStorage.setItem(CART_KEY, JSON.stringify(items))
}

/**
 * Clears the entire guest cart from localStorage.
 * Called after a successful merge into the DB cart on login.
 */
export const clearGuestCart = (): void => {
    if (!isBrowser) return
    localStorage.removeItem(CART_KEY)
}