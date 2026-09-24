'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useAuthStore, type AuthSessionUser } from '@/lib/stores/auth-store'
import { authClient } from '@/lib/auth-client'

const AUTH_CHANNEL = 'theokallia-auth'
const AUTH_EVENT_KEY = 'theokallia-auth-event'

/**
 * Keeps the legacy auth store in sync with the Better Auth session.
 * Redirects authenticated users away from routes meant for guests.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, openAuthModal, setResetToken } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const hasProcessedInitialSession = useRef(false)
  const handledVerificationReturn = useRef(false)
  const handledResetReturn = useRef(false)
  const { data, isPending, refetch } = authClient.useSession()
  const isVerificationCallback = searchParams.get('auth') === 'verified'
  const isResetCallback = searchParams.get('auth') === 'reset-password'

  useEffect(() => {
    if (!isResetCallback || handledResetReturn.current) return

    handledResetReturn.current = true
    // Password reset lands back in the modal and keeps the token in store.
    setResetToken(searchParams.get('token'))
    openAuthModal('reset-password')
    // Drop the callback marker so refreshes don't reopen the reset modal.
    router.replace(pathname)
  }, [isResetCallback, openAuthModal, pathname, router, searchParams, setResetToken])

  useEffect(() => {
    // Same-origin tabs share verification events through BroadcastChannel.
    const handleVerified = () => {
      openAuthModal('verified')
    }

    const channel =
      typeof window !== 'undefined' && 'BroadcastChannel' in window
        ? new BroadcastChannel(AUTH_CHANNEL)
        : null

    if (channel) {
      channel.addEventListener('message', (event) => {
        if (event.data?.type === 'auth:verified') {
          handleVerified()
        }
      })
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== AUTH_EVENT_KEY || !event.newValue) return

      try {
        const payload = JSON.parse(event.newValue) as { type?: string }
        if (payload.type === 'auth:verified') {
          handleVerified()
          return
        }

        if (payload.type === 'auth:login' || payload.type === 'auth:logout') {
          void refetch().then(() => {
            useAuthStore.getState().closeAuthModal()

            if (payload.type === 'auth:login' && pathname === '/') {
              router.replace('/shop')
            }
          })
        }
      } catch {
        // ignore malformed events
      }
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      channel?.close()
      window.removeEventListener('storage', handleStorage)
    }
  }, [pathname, refetch, router, openAuthModal])

  useEffect(() => {
    if (!isVerificationCallback || handledVerificationReturn.current) return

    handledVerificationReturn.current = true
    // The callback tab shows the verified state immediately, then notifies the rest.
    openAuthModal('verified')

    const payload = JSON.stringify({ type: 'auth:verified', at: Date.now() })

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(AUTH_CHANNEL)
      channel.postMessage({ type: 'auth:verified' })
      channel.close()
    }

    localStorage.setItem(AUTH_EVENT_KEY, payload)
    // Keep the marker around briefly so other tabs can observe the storage event.
    window.setTimeout(() => localStorage.removeItem(AUTH_EVENT_KEY), 250)

    // Remove the callback marker so refreshes don't re-open the success modal.
    router.replace(pathname)
  }, [isVerificationCallback, openAuthModal, pathname, router, searchParams])

  useEffect(() => {
    setLoading(isPending)

    if (data) {
      setUser(data.user as unknown as AuthSessionUser)
      return
    }

    setUser(null)
  }, [data, isPending, router, searchParams, setLoading, setUser])

  useEffect(() => {
    if (isPending || hasProcessedInitialSession.current) return

    hasProcessedInitialSession.current = true

    const authState = useAuthStore.getState()

    // Only auto-redirect the very first time the app resolves a session on the homepage.
    if (data && pathname === '/' && !authState.authModalOpen && !isVerificationCallback) {
      router.replace('/shop')
    }
  }, [data, isPending, isResetCallback, isVerificationCallback, pathname, router])

  // Re-validates when user switches back to this tab
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return

      try {
        await refetch()
      } catch {
        const hadUser = useAuthStore.getState().user !== null
        setUser(null)
        if (hadUser) router.replace('/')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refetch, router, setUser])

  return <>{children}</>
}
