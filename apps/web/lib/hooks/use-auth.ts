import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authClient } from '@/lib/auth-client'
import api from '@/lib/api'
import { env } from '@/lib/env'
import { useAuthStore } from '@/lib/stores/auth-store'
import { getGuestCart, clearGuestCart } from '@/lib/cart-storage'
import { getGuestWishlist, clearGuestWishlist } from '@/lib/wishlist-storage'
import { useGuestCartStore } from '../stores/guest-cart-store'
import { useGuestWishlistStore } from '../stores/guest-wishlist-store'

// --- Types ---

interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
}

interface LoginData {
  email: string
  password: string
}

interface ForgotPasswordInput {
  email: string
}

interface ResetPasswordInput {
  token: string
  password: string
}

interface VerificationStatusResponse {
  verified: boolean
}

interface AuthResponseUser {
  id: string
  email: string
  emailVerified: boolean
  name: string
  image?: string | null
  firstName: string
  lastName: string
  phone?: string | null
  address?: string | null
  role: 'customer' | 'admin'
}

// The verification callback lands back on the home page and opens the success modal.
const verifiedCallbackURL = `${env.NEXT_PUBLIC_APP_URL}/?auth=verified`
const resetCallbackURL = `${env.NEXT_PUBLIC_APP_URL}/?auth=reset-password`
const AUTH_EVENT_KEY = 'theokallia-auth-event'

function emitAuthEvent(type: 'auth:login' | 'auth:logout') {
  if (typeof window === 'undefined') return

  const payload = JSON.stringify({ type, at: Date.now() })
  localStorage.setItem(AUTH_EVENT_KEY, payload)
  // Keep the marker around briefly so other tabs can observe the storage event.
  window.setTimeout(() => localStorage.removeItem(AUTH_EVENT_KEY), 250)
}

/**
 * Re-checks whether the signup email has been verified yet.
 * Used when the email link is opened on another device.
 */
export function useVerificationStatus(email: string, enabled = true) {
  return useQuery({
    queryKey: ['verification-status', email],
    enabled: enabled && Boolean(email),
    refetchInterval: 3000,
    queryFn: async () => {
      const res = await api.get<VerificationStatusResponse>(
        '/users/verification-status',
        {
          params: { email },
        }
      )

      return res.data
    },
  })
}

function toAuthSessionUser(user: AuthResponseUser) {
  // Map Better Auth's session user into the web store shape.
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone ?? undefined,
    address: user.address ?? undefined,
    role: user.role,
    name: user.name,
    image: user.image ?? undefined,
  }
}

// --- Hooks ---

/**
 * Resends the verification email to the user.
 */
export function useResendVerification() {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await authClient.sendVerificationEmail({
        email,
        callbackURL: verifiedCallbackURL,
      })

      if (res.error) {
        throw new Error(res.error.message)
      }

      return res.data
    },
  })
}

/**
 * Creates a new user account and sends the verification email.

 * The caller should switch to the email confirmation screen.
 */
export function useRegister() {
  return useMutation({
    mutationFn: async (data: RegisterData) => {
      const res = await authClient.signUp.email({
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        password: data.password,
        // Send the user back to the app so the auth modal can show the success state.
        callbackURL: verifiedCallbackURL,
        rememberMe: true,
        // These extra user fields come from the backend's custom user schema.
        firstName: data.firstName,
        lastName: data.lastName,
      } as never)

      if (res.error) {
        throw new Error(res.error.message)
      }

      return res.data
    },
  })
}

/**
 * Logs the user in with email and password.
 * On success:
 * - Populates the Zustand store with the returned user
 * - If the guest had items in their localStorage cart, merges them into the DB cart
 *   then clears both localStorage and the Zustand guest cart store
 * - If the guest had a wishlist in localStorage, merges it into the DB wishlist
 * - Invalidates the ['cart'] and ['wishlist'] React Query caches so navbar and pages update immediately
 */
export function useLogin() {
  const setUser = useAuthStore((state) => state.setUser)
  const clearGuestCartStore = useGuestCartStore((state) => state.clear)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: LoginData) => {
      const res = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        rememberMe: true,
      })

      if (res.error) {
        throw new Error(res.error.message)
      }

      return res.data
    },
    onSuccess: async (res) => {
      // populate auth store first so subsequent API calls are authenticated
      setUser(toAuthSessionUser(res.user as unknown as AuthResponseUser))
      emitAuthEvent('auth:login')

      // merge guest cart if localStorage has items
      const guestCartItems = getGuestCart()
      if (guestCartItems.length > 0) {
        try {
          // strip down to just productId + quantity for the merge endpoint
          const itemsToMerge = guestCartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          }))
          await api.post('/cart/merge', { items: itemsToMerge })
          // clear both localStorage and the in-memory Zustand store
          clearGuestCart()
          clearGuestCartStore()
          // invalidate cart cache so navbar badge and cart page reflect merged state
          queryClient.invalidateQueries({ queryKey: ['cart'] })
        } catch {
          // merge failure is non-fatal — guest items stay in localStorage and Zustand
          // they will be retried on next login
        }
      }

      // merge guest wishlist if localStorage has items
      const guestWishlistProducts = getGuestWishlist()
      if (guestWishlistProducts.length > 0) {
        try {
          await api.post('/wishlist/merge', {
            productIds: guestWishlistProducts.map((p) => p.id),
          })
          clearGuestWishlist()
          // clear the in-memory Zustand store
          useGuestWishlistStore.getState().clearItems()
          // invalidate wishlist cache so navbar badge and wishlist page reflect merged state
          queryClient.invalidateQueries({ queryKey: ['wishlist'] })
        } catch {
          // merge failure is non-fatal — guest wishlist stays in localStorage
        }
      }
    },
  })
}

/**
 * Logs the user out.
  * Signs the user out through Better Auth and clears the local auth state immediately.
 */
export function useLogout() {
  const setUser = useAuthStore((state) => state.setUser)

  return useMutation({
    mutationFn: async () => {
      const res = await authClient.signOut()

      if (res.error) {
        throw new Error(res.error.message)
      }

      return res.data
    },
    onSuccess: () => {
      setUser(null)
      emitAuthEvent('auth:logout')
    },
  })
}

/**
 * Sends a password reset link to the provided email.
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (data: ForgotPasswordInput) => {
      const res = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: resetCallbackURL,
      })

      if (res.error) {
        throw new Error(res.error.message)
      }

      return res.data
    },
  })
}

/**
 * Resets the user's password after they open the email link.
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: ResetPasswordInput) => {
      // The token comes from the reset callback URL and is stored in the auth modal state.
      const res = await authClient.resetPassword({
        newPassword: data.password,
        token: data.token,
      })

      if (res.error) {
        throw new Error(res.error.message)
      }

      return res.data
    },
  })
}
