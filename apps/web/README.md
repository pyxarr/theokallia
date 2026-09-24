# @theokallia/web
> Next.js storefront for Theokallia

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)

## 📦 Overview
- Next.js storefront for the public shop, product pages, cart, wishlist, auth, and profile.
- Port `3000`; deployed to Vercel.
- Most API calls go through `app/api/[...path]/route.ts`; auth uses the same-origin Better Auth client at `/api/auth`.
- Guest cart and guest wishlist use Zustand + localStorage.

## 🚀 Quick Start
```bash
pnpm install
```
1. Set `@theokallia/web/.env.local`.
2. Run the frontend.

## ⚙️ Environment Variables
```env
API_URL=http://localhost:3333
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Production requires both variables to be set to real URLs.

## 🗂️ Repository Layout
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
│   ├── auth/                         ✅ modal-based Better Auth flow
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
│   │   ├── use-auth.ts               ✅ cart + wishlist merge on login, password reset, session sync
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

## 🧭 Routing
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

## 🧠 Key Architecture Decisions
### Catch-all Proxy
`app/api/[...path]/route.ts` forwards requests to `API_URL` with `API_VERSION`, forwards cookies, preserves query params, and returns `set-cookie` headers. Auth routes are routed to `/api/auth`.

Critical rules:
- `req.nextUrl.search` MUST be appended.
- `cache: 'no-store'` MUST be set.
- `cookie` header MUST be forwarded so the upstream auth/session layer can read it.
- `set-cookie` MUST be forwarded back with `forEach` + `append`.

### Shop Page
`ShopPage` is a simple server component; `SidebarFilter` and `ProductGrid` are client components that read from `useSearchParams` directly.

### App Load
- `authClient.useSession()` resolves the current Better Auth session on mount.
- `void hydrateGuestCart()` is async and validates stock before setting state.
- `hydrateWishlist()` is sync and reads localStorage directly.
- Authenticated cart and wishlist live in React Query caches (`['cart']`, `['wishlist']`).

## 🎨 Design System
### Colours
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

### Typography
| Font | CSS class | Use for |
|---|---|---|
| Cormorant Garamond | `font-cormorant-garamond` | Body text |
| Playfair Display | `font-[family-name:var(--font-heading)]` | Headings |
| Le Jour Serif ⚠️ | `font-le-jour` | Prices, display |
| Allure | `font-allure` | Decorative headings |

> ⚠️ "Le Jour Serif Personal Use Only" — verify commercial license before launch.

### Design Rules
- Sharp corners — `--radius: 0rem`, no border-radius anywhere.
- `@theme inline` only; use `bg-[#7E22CE]` or CSS vars.
- Buttons hover: primary purple background, white text.
- Product detail page: 3 thumbnails (not 4).
- Product cards: `Add To Bag` button text.

## 📚 Documentation
| Document | Link |
|---|---|
| Web architecture | [`apps/web/docs/architecture.md`](apps/web/docs/architecture.md) |
| Web rules | [`apps/web/docs/rules.md`](apps/web/docs/rules.md) |
