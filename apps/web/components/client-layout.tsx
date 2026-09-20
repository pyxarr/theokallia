'use client'

import { Suspense, useEffect } from 'react'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import BackToTop from '@/components/back-to-top'
import AuthModal from '@/components/auth/auth-modal'
import AuthProvider from '@/lib/providers/auth-provider'
import { Toaster } from '@/components/ui/sonner'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useGuestCartStore } from '@/lib/stores/guest-cart-store'
import { useGuestWishlistStore } from '@/lib/stores/guest-wishlist-store'
import { useCurrencyStore } from '@/lib/stores/currency-store'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const {
    authModalOpen,
    authModalView,
    openAuthModal,
    closeAuthModal,
    setRedirectTo,
  } = useAuthStore()
  const pathname = usePathname()

  // hydrate guest stores from localStorage on app load
  // must run client-side only — localStorage is not available on the server
  const { hydrate: hydrateGuestCart } = useGuestCartStore()
  const { hydrate: hydrateWishlist } = useGuestWishlistStore()
  const { hydrate: hydrateCurrency } = useCurrencyStore()

  useEffect(() => {
    void hydrateGuestCart() // async — validates stock against API before setting state
    hydrateWishlist()       // sync — just reads localStorage and sets state
    hydrateCurrency()       // sync — resolves currency from storage, cookie, or geo
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const openLogin = () => {
    setRedirectTo(pathname)
    openAuthModal('login')
  }

  const openSignUp = () => {
    openAuthModal('sign-up')
  }

  return (
    <Suspense fallback={null}>
      <AuthProvider>
        <Navbar onOpenLogin={openLogin} onOpenSignUp={openSignUp} />
        <main className="flex-1">{children}</main>
        <BackToTop />
        <Footer />
        <AuthModal
          isOpen={authModalOpen}
          initialView={authModalView}
          onClose={closeAuthModal}
        />
        <Toaster />
      </AuthProvider>
    </Suspense>
  )
}
