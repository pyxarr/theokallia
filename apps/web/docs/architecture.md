# @theokallia/web — Architecture
> Next.js Frontend Technical Reference
> Version: 1.0
> Status: Active

## Table of Contents
1. [Overview](#1-overview)
2. [Repository Layout](#2-repository-layout)
3. [Routing](#3-routing)
4. [Catch-All Proxy](#4-catch-all-proxy)
5. [`lib/api.ts`](#5-libapits)
6. [Auth Flow](#6-auth-flow)
7. [Guest Cart Architecture](#7-guest-cart-architecture)
8. [Guest Wishlist Architecture](#8-guest-wishlist-architecture)
9. [On App Load](#9-on-app-load)
10. [Shop Page Architecture](#10-shop-page-architecture)
11. [Product Detail Page Architecture](#11-product-detail-page-architecture)
12. [Design System](#12-design-system)

## 1. Overview
`@theokallia/web` is the Next.js storefront for Theokallia. It runs on port `3000`, is deployed to Vercel, and sends all API traffic through `app/api/[...path]/route.ts`.

Auth uses a same-origin Better Auth client at `/api/auth`, with modal-based login, signup verification, and password reset flows.

Required production env vars:
- `API_URL`
- `NEXT_PUBLIC_APP_URL`

Guest cart and guest wishlist use Zustand + localStorage. Authenticated cart and wishlist state lives in React Query caches.

## 2. Repository Layout
```text
apps/web/
├── app/
│   ├── layout.tsx                    ✅ QueryProvider + ClientLayout
│   ├── page.tsx                      ✅
│   ├── shop/page.tsx                 ✅ simple server component
│   ├── shop/[slug]/page.tsx          ✅ fully wired — useProduct + useReviews, passes full product to ProductInfo
│   ├── cart/page.tsx                 ✅ fully wired — auth + guest
│   ├── wishlist/page.tsx             ✅ fully wired — auth + guest, loading + empty states
│   ├── about/page.tsx                ✅
│   ├── contact/page.tsx              ✅
│   └── api/[...path]/route.ts        ✅ catch-all proxy
├── components/
│   ├── providers/
│   │   ├── auth-provider.tsx         ✅
│   │   └── query-provider.tsx        ✅
│   ├── auth/                         ✅ all wired
│   ├── profile/                      ✅ profile-modal, edit-profile-form, logout-confirm-dialog
│   ├── cart/
│   │   ├── cart-item.tsx             ✅ Move to Wishlist wired — silent toggle, disabled when already wishlisted
│   │   └── guest-cart-item.tsx       ✅ Move to Wishlist wired — silent toggle, disabled when already wishlisted
│   ├── wishlist/
│   │   └── wishlist-item.tsx         ✅ Remove + Move to Bag + cart limit check + stock-aware buttons
│   ├── shop/
│   │   ├── sidebar-filter.tsx        ✅
│   │   ├── product-grid.tsx          ✅
│   │   ├── product-card.tsx          ✅ heart icon wired — useToggleWishlist + useIsWishlisted
│   │   ├── shop-banner.tsx           ✅
│   │   └── shop-header.tsx           ✅
│   ├── product/
│   │   ├── product-images.tsx        ✅
│   │   ├── product-info.tsx          ✅ fully wired — cart add, wishlist heart, quantity cap, buy now stub
│   │   ├── product-shipping.tsx      ✅ hardcoded (global config — not per-product)
│   │   ├── product-rating-summary.tsx ✅
│   │   ├── product-reviews.tsx       ✅
│   │   └── similar-products.tsx      ✅
│   └── ui/                           ✅ Shadcn
├── lib/
│   ├── api.ts                        ✅ axios + API_VERSION
│   ├── env.js                        ✅ shared NEXT_PUBLIC_APP_URL
│   ├── cart-storage.ts               ✅ guest cart localStorage helpers + stock cap
│   ├── wishlist-storage.ts           ✅ guest wishlist localStorage helpers (full product objects)
│   ├── stores/
│   │   ├── auth-store.ts             ✅
│   │   ├── guest-cart-store.ts       ✅ Zustand, async hydrate with API stock sync
│   │   └── guest-wishlist-store.ts   ✅ Zustand, sync hydrate from localStorage
│   ├── hooks/
│   │   ├── use-auth.ts               ✅ cart + wishlist merge on login fully implemented
│   │   ├── use-profile.ts            ✅
│   │   ├── use-categories.ts         ✅
│   │   ├── use-products.ts           ✅
│   │   ├── use-reviews.ts            ✅
│   │   ├── use-cart.ts               ✅
│   │   └── use-wishlist.ts           ✅ useWishlist, useToggleWishlist (silent param), useMergeWishlist, useRemoveWishlistItem, useIsWishlisted
│   └── validations/
│       ├── auth.ts                   ✅
│       └── update-profile.ts         ✅
```

## 3. Routing
| Route | File |
|---|---|
| `theokallia.com/` | `app/page.tsx` (redirects to /shop if authenticated) |
| `theokallia.com/shop` | `app/shop/page.tsx` |
| `theokallia.com/shop/[slug]` | `app/shop/[slug]/page.tsx` |
| `theokallia.com/cart` | `app/cart/page.tsx` |
| `theokallia.com/wishlist` | `app/wishlist/page.tsx` |
| `theokallia.com/about` | `app/about/page.tsx` |
| `theokallia.com/contact` | `app/contact/page.tsx` |
| `api.theokallia.com/` | `app/api/[...path]/route.ts` |
| `api.theokallia.com/docs` | Swagger UI |

## 4. Catch-All Proxy
```typescript
import { API_VERSION } from '@/lib/api'
import { env } from '@/lib/env'
import { NextRequest, NextResponse } from 'next/server'

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  const search = req.nextUrl.search
  const isAuthRoute = path[0] === 'auth'
  const apiUrl =
    process.env.API_URL ??
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3333' : '')

  if (!apiUrl) {
    throw new Error('API_URL is required in production')
  }

  const url = isAuthRoute
    ? `${apiUrl}/api/auth/${path.slice(1).join('/')}${search}`
    : `${apiUrl}/${API_VERSION}/${path.join('/')}${search}`

  const res = await fetch(url, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      origin: req.headers.get('origin') ?? env.NEXT_PUBLIC_APP_URL,
      cookie: req.headers.get('cookie') ?? '',
    },
    body:
      req.method !== 'GET' && req.method !== 'HEAD'
        ? await req.text()
        : undefined,
    cache: 'no-store',
  })

  const data = await res.json().catch(() => null)
  const response = NextResponse.json(data, { status: res.status })

  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      response.headers.append('set-cookie', value)
    }
  })

  return response
}

export const GET = handler
export const POST = handler
export const PATCH = handler
export const PUT = handler
export const DELETE = handler
```

Critical rules:
- `req.nextUrl.search` MUST be appended or all query params are silently dropped.
- `cache: 'no-store'` MUST be set or Next.js caches the first response for all subsequent requests.
- Auth routes are proxied to `/api/auth`; other routes use `API_VERSION`.
- `cookie` header MUST be forwarded so the upstream auth/session layer can read the session cookies.
- `origin` MUST be forwarded for Better Auth requests.
- `set-cookie` MUST be forwarded back with `forEach` + `append` for both auth cookies.

## 5. `lib/api.ts`
```ts
import axios from 'axios'

export const API_VERSION = 'v1'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default api
```

`API_VERSION` is the single source of truth.

## 6. Auth Flow
`AuthProvider` resolves the current session with `authClient.useSession()` on mount. If a session exists, `setUser()` marks the user authenticated and the navbar/profile/cart hooks unlock.

The auth modal is URL-driven for verification and password reset only:
- `/?auth=verified` opens the short verified state and broadcasts it to other tabs.
- `/?auth=reset-password&token=...` opens the reset form and stores the token in Zustand.

Login and logout are triggered directly by UI actions, then broadcast to other tabs with `BroadcastChannel` plus `storage` fallback.

Zustand holds the auth store; authenticated cart and wishlist live in React Query caches (`['cart']`, `['wishlist']`).

## 7. Guest Cart Architecture
```text
localStorage (persistent)
    ↕ read/write on every action
Zustand store (reactive)
    ↕ components subscribe
navbar badge, product card, cart page — all reactive, no refresh needed
```

`cart-storage.ts` provides localStorage helpers. `guest-cart-store.ts` is the reactive layer over it and is hydrated asynchronously.

`hydrate` is async; call it with `void hydrate()` in `useEffect`.

### Merge on login
1. `setUser` fires.
2. Guest cart items are read.
3. `POST /cart/merge` runs.
4. `clearGuestCart()` and `clearGuestCartStore()` run.
5. `['cart']` is invalidated.

## 8. Guest Wishlist Architecture
```text
localStorage (persistent) — stores full product objects
    ↕ read/write on every action
Zustand store (reactive)
    ↕ components subscribe
navbar badge, wishlist page, cart items — all reactive
```

Guest wishlist stores full product objects. Hydration is sync and no API call is needed.

`hydrateWishlist()` is sync; call it without `void`.

### Why it differs from cart
- Full objects are stored so the wishlist page can render immediately from localStorage.
- There is no `validate-guest` for wishlist because items are binary.

### Merge on login
1. `setUser` fires.
2. `getGuestWishlist()` is read.
3. `p.id` is extracted from full product objects.
4. `POST /wishlist/merge` runs.
5. `clearGuestWishlist()` and `clearGuestWishlistStore()` run.
6. `['wishlist']` is invalidated.

### `silent` toast param
`useToggleWishlist(isAuthenticated, true)` suppresses the built-in toast when the caller wants its own toast.

### Toast responsibility map
| Action | Where toast fires | Message |
|---|---|---|
| Heart icon click (add) | `useToggleWishlist` `onMutate` / `mutationFn` | `${name} added to wishlist` |
| Heart icon click (remove) | `useToggleWishlist` `onMutate` / `mutationFn` | `${name} removed from wishlist` |
| Toggle fails | `useToggleWishlist` `onError` | `Couldn't update wishlist for ${name}` |
| Remove button on wishlist page | `wishlist-item.tsx` `handleRemove` | `${name} removed from wishlist` |
| Remove fails | `useRemoveWishlistItem` `onError` | `Couldn't remove item from wishlist` |
| Move to Bag | `wishlist-item.tsx` `handleMoveToBag` | `${name} moved to bag` |
| Move to Wishlist from cart | `cart-item.tsx` / `guest-cart-item.tsx` | `${name} moved to wishlist` |

## 9. On App Load
```ts
void hydrateGuestCart()  // async — validates stock against API before setting state
hydrateWishlist()        // sync — just reads localStorage and sets state
```

### Guest cart hydration
1. Reads localStorage.
2. Calls `POST /cart/validate-guest` with all productIds.
3. API returns fresh `{ productId, stock, inStock }` for each.
4. Caps any quantities that exceed current stock.
5. Writes capped values back to localStorage.
6. Sets Zustand store.

### Guest wishlist hydration
1. Reads localStorage.
2. Gets saved guest wishlist products (full objects).
3. Sets Zustand store directly.
4. Navbar badge updates immediately.

### Authenticated flow
`authClient.useSession()` resolves the user. If valid, `isAuthenticated` becomes `true` → `useCart` and `useWishlist` in navbar become enabled → both fire their fetches → badges update. Both have `staleTime: 0`.

### On login transition
1. `setUser` fires.
2. Guest cart merges via `POST /cart/merge`.
3. Guest wishlist merges via `POST /wishlist/merge`.
4. LocalStorage + Zustand are cleared.
5. `['cart']` and `['wishlist']` are invalidated.

### Login / logout sync
1. `useLogin()` emits `auth:login`.
2. Other tabs receive the event, refetch the session, and close any open auth modal.
3. `useLogout()` emits `auth:logout`.
4. Other tabs receive the event, refetch the session, and clear the local auth state.

## 10. Shop Page Architecture
`ShopPage` is a simple server component — no `searchParams`, no filter parsing, no props to `ProductGrid`. `SidebarFilter` and `ProductGrid` are client components that read from `useSearchParams` directly.

| Param | Type | Default | Description |
|---|---|---|---|
| `category` | string | all | comma-separated slugs e.g. `rings,bracelets` |
| `minPrice` | number | none | lower bound in Naira |
| `maxPrice` | number | none | upper bound in Naira |
| `sort` | string | none | `best-seller` or `new-arrival` |
| `order` | string | `desc` | `asc` or `desc` — backend only |
| `page` | number | `1` | current page |
| `limit` | number | `12` | items per page |

## 11. Product Detail Page Architecture
```text
shop/[slug]/page.tsx  ('use client')
  ├── useProduct(slug)      ← name, price, images, description, category
  ├── useReviews(slug)      ← rating, reviewCount, ratingBreakdown, reviews list
  ├── [grid: 2 cols]
  │   ├── ProductImages
  │   └── [flex col]
  │       ├── ProductInfo(product)   ← full product object — cart add, wishlist heart, qty selector
  │       └── ProductShipping        ← hardcoded (DHL, 3-5 days, Nigeria)
  ├── [ratings + reviews]
  │   ├── if reviewCount > 0: ProductRatingSummary + ProductReviews
  │   └── if reviewCount === 0: empty state
  └── SimilarProducts(slug)   ← slug as prop, not useParams()
```

`ProductInfo` receives the full `product: Product` object, not individual string props.

## 12. Design System
```text
Primary (purple):   #7E22CE  → var(--color-primary)
Primary light:      #C084FC
Primary pale:       #F3E8FF
Accent (gold):      #FBBF24  → var(--color-accent)
Body text:          #1F2937
Dark text:          #111827
Background soft:    #F9FAFB
Card bg:            #F5F5F5
```

| Font | CSS class | Use for |
|---|---|---|
| Cormorant Garamond | `font-cormorant-garamond` | Body text |
| Playfair Display | `font-[family-name:var(--font-heading)]` | Headings |
| Le Jour Serif ⚠️ | `font-le-jour` | Prices, display |
| Allure | `font-allure` | Decorative headings |

> ⚠️ "Le Jour Serif Personal Use Only" — verify commercial license before launch.

Design rules:
- Sharp corners — `--radius: 0rem`, no border-radius anywhere.
- `@theme inline` — NO utility classes like `bg-primary`. Use `bg-[#7E22CE]` or CSS vars.
- Buttons hover: primary purple background, white text.
- Product detail page: 3 thumbnails (not 4).
- Product cards: `Add To Bag` button text.
