'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { Heart, ShoppingBag, User } from 'lucide-react'
import ProfileModal from '@/components/profile/profile-modal'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useGuestCartStore } from '@/lib/stores/guest-cart-store'
import { useCart } from '@/lib/hooks/use-cart'
import { useWishlist } from '@/lib/hooks/use-wishlist'
import { useGuestWishlistStore } from '@/lib/stores/guest-wishlist-store'
import CurrencySwitcher from './currency-switcher'

const links = [
  { name: 'Home', href: '/' },
  { name: 'Shop', href: '/shop' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
]

interface NavbarProps {
  onOpenLogin: () => void
  onOpenSignUp: () => void
}

const Navbar = ({ onOpenLogin, onOpenSignUp }: NavbarProps) => {
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useAuthStore()

  // authenticated cart — reads from React Query cache, zero extra server calls
  const { data: dbCart } = useCart(isAuthenticated)

  // guest cart — reads from Zustand store (hydrated from localStorage on app load)
  const { items: guestItems } = useGuestCartStore()

  // cart badge count — number of distinct items, not total quantity
  const cartCount = isAuthenticated
    ? (dbCart?.items?.length ?? 0)
    : guestItems.length

  // authenticated wishlist — reads from React Query cache
  const { data: dbWishlist } = useWishlist(isAuthenticated)

  // guest wishlist — reads from Zustand store (hydrated from localStorage on app load)
  const { items: guestWishlistItems } = useGuestWishlistStore()

  // wishlist badge count — number of saved items
  const wishlistCount = isAuthenticated
    ? (dbWishlist?.items?.length ?? 0)
    : guestWishlistItems.length

  return (
    <nav className="relative container mx-auto flex items-center justify-between px-20 py-4">
      <Link href="/">
        <div className="relative h-[50px] w-[200px] cursor-pointer">
          <Image
            src="/logo.webp"
            alt="Theokallia Logo"
            fill
            sizes="200px"
            className="object-contain"
            priority
          />
        </div>
      </Link>

      <div className="flex items-center justify-between gap-8 text-lg">
        {links.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className={cn(
              'text-lg transition-colors hover:text-primary',
              pathname === link.href ? 'text-secondary' : 'text-foreground'
            )}
          >
            {link.name}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-8">
        <CurrencySwitcher />

        <div className="flex items-center gap-4">
          {/* render nothing while session check is in flight — prevents auth flash */}
          {!isLoading &&
            (isAuthenticated ? (
              <ProfileModal
                trigger={
                  <User
                    size={20}
                    strokeWidth={1.5}
                    className="cursor-pointer text-foreground"
                  />
                }
              />
            ) : (
              <>
                <Button variant="outline" onClick={onOpenLogin}>
                  Log In
                </Button>
                <Button onClick={onOpenSignUp}>Sign Up</Button>
              </>
            ))}
        </div>

        <div className="flex items-center gap-4 text-foreground">
          <Link
            href="/wishlist"
            className={
              pathname === '/wishlist' ? 'text-secondary' : 'text-foreground'
            }
          >
            <div className="relative">
              <Heart size={20} strokeWidth={1.5} />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-white">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </div>
          </Link>

          <Link
            href="/cart"
            className={
              pathname === '/cart' ? 'text-secondary' : 'text-foreground'
            }
          >
            <div className="relative">
              <ShoppingBag size={20} strokeWidth={1.5} />
              {/* badge only renders when there are items — capped at 99 */}
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
