# THEOKALLIA — Technical Architecture Document
> Engineering Blueprint — v1.0
> Version: 1.0
> Status: Active

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Technology Stack](#3-technology-stack)
4. [Database Schema](#4-database-schema)
5. [Shared Types](#5-shared-types)
6. [API Contract](#6-api-contract)
7. [Authentication Architecture](#7-authentication-architecture)
8. [Cart Architecture](#8-cart-architecture)
9. [Wishlist Architecture](#9-wishlist-architecture)
10. [On App Load](#10-on-app-load)
11. [Infrastructure & Environment Variables](#11-infrastructure--environment-variables)
12. [Deployment](#12-deployment)
13. [BullMQ Email Queue](#13-bullmq-email-queue)
14. [Filter, Sort & Pagination](#14-filter-sort--pagination)
15. [Shop & Product Page Architecture](#15-shop--product-page-architecture)
16. [Containerization](#16-containerization)

## 1. System Overview
Theokallia is a full-stack luxury jewellery e-commerce platform with three surfaces: `theokallia.com`, `api.theokallia.com`, and `apps/admin`.

```text
Browser
  → Next.js App Router (`apps/web`)
  → catch-all proxy `apps/web/app/api/[...path]/route.ts`
  → NestJS REST API (`/v1/...`)
  → Neon PostgreSQL / Upstash Redis
  → BullMQ mail queue → Resend
```

Architecture principles from the README:
- Use URI versioning on all NestJS routes (`/v1/`).
- Forward `cookie`, `set-cookie`, and `req.nextUrl.search` through the proxy.
- Keep `cache: 'no-store'` on the proxy.
- Use `PrismaService.client` for database access.
- Use `prisma.$transaction` callback form for multi-step DB work.
- Use Zustand for guest cart and guest wishlist state.
- Use React Query for authenticated cart and wishlist state.
- Use `lib/api.ts` for all API calls; do not use raw `fetch` in hooks or stores.
- Push `'use client'` deep and keep `ShopPage` as a server component.

## 2. Monorepo Structure
```text
apps/
├── api/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── auth/
│       ├── users/
│       ├── categories/
│       ├── products/
│       ├── reviews/
│       ├── cart/
│       ├── wishlist/
│       ├── prisma/
│       ├── redis/
│       └── mail/
├── web/
│   ├── Dockerfile
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── shop/page.tsx
│   │   ├── shop/[slug]/page.tsx
│   │   ├── cart/page.tsx
│   │   ├── wishlist/page.tsx
│   │   ├── about/page.tsx
│   │   ├── contact/page.tsx
│   │   └── api/[...path]/route.ts
│   ├── components/
│   │   ├── providers/
│   │   ├── auth/
│   │   ├── profile/
│   │   ├── cart/
│   │   ├── wishlist/
│   │   ├── shop/
│   │   ├── product/
│   │   └── ui/
│   └── lib/
│       ├── api.ts
│       ├── cart-storage.ts
│       ├── wishlist-storage.ts
│       ├── stores/
│       ├── hooks/
│       └── validations/
└── admin/ (to be built)

packages/
├── types/
│   └── (User/AuthUser types)
└── db/ (stub only)
```

## 3. Technology Stack
| Layer | Technology |
|---|---|
| Monorepo | Turborepo |
| Package manager | pnpm |
| Frontend | Next.js 16.2 |
| Language | TypeScript |
| CSS | Tailwind v4 |
| UI components | Shadcn UI |
| Icons | Lucide React |
| State management | Zustand |
| Data fetching | TanStack React Query |
| Forms | React Hook Form + Zod |
| HTTP client | axios |
| API versioning | NestJS URI versioning |
| Backend | NestJS |
| ORM | Prisma v7 |
| Database | Neon PostgreSQL |
| Auth | Better Auth |
| Auth sessions | httpOnly cookies |
| Email queue | BullMQ + Upstash Redis |
| Email sender | Resend |
| Guest cart | Zustand + localStorage |
| Guest wishlist | Zustand + localStorage |
| Caching | Upstash Redis |
| Rate limiting | Upstash Ratelimit |
| Deployment | Render / Vercel |
| Google OAuth | Deferred |
| Payments | Paystack |
| File storage | Cloudinary |

## 4. Database Schema
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String         @id @default(cuid())
  firstName      String
  lastName       String
  email          String         @unique
  password       String
  role           String         @default("customer")
  emailVerified  Boolean        @default(false)
  phone          String?
  address        String?
  orders         Order[]
  reviews        Review[]
  cart           Cart?
  wishlist       Wishlist?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
}

model Category {
  id            String        @id @default(cuid())
  name          String
  slug          String        @unique
  image         String?
  subcategories Subcategory[]
  products      Product[]
  createdAt     DateTime      @default(now())
}

model Subcategory {
  id         String    @id @default(cuid())
  name       String
  slug       String    @unique
  image      String?
  category   Category  @relation(fields: [categoryId], references: [id])
  categoryId String
  products   Product[]
  createdAt  DateTime  @default(now())
}

model Product {
  id            String         @id @default(cuid())
  name          String
  slug          String         @unique
  description   String
  price         Float
  images        String[]
  inStock       Boolean        @default(true)
  stock         Int            @default(0)
  category      Category       @relation(fields: [categoryId], references: [id])
  categoryId    String
  subcategory   Subcategory?   @relation(fields: [subcategoryId], references: [id])
  subcategoryId String?
  orderItems    OrderItem[]
  reviews       Review[]
  cartItems     CartItem[]
  wishlistItems WishlistItem[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model Review {
  id        String   @id @default(cuid())
  product   Product  @relation(fields: [productId], references: [id])
  productId String
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  rating    Int
  comment   String
  createdAt DateTime @default(now())
}

model Cart {
  id        String     @id @default(cuid())
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String     @unique
  items     CartItem[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model CartItem {
  id        String   @id @default(cuid())
  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  cartId    String
  product   Product  @relation(fields: [productId], references: [id])
  productId String
  quantity  Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([cartId, productId])
}

model Wishlist {
  id        String         @id @default(cuid())
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String         @unique
  items     WishlistItem[]
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
}

model WishlistItem {
  id         String   @id @default(cuid())
  wishlist   Wishlist @relation(fields: [wishlistId], references: [id], onDelete: Cascade)
  wishlistId String
  product    Product  @relation(fields: [productId], references: [id])
  productId  String
  createdAt  DateTime @default(now())

  @@unique([wishlistId, productId])
}

model Order {
  id        String      @id @default(cuid())
  user      User        @relation(fields: [userId], references: [id])
  userId    String
  status    String      @default("pending")
  total     Float
  items     OrderItem[]
  reservations StockReservation[]
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
}

model StockReservation {
  id        String   @id @default(cuid())
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId   String
  productId String
  quantity  Int
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model OrderItem {
  id        String  @id @default(cuid())
  order     Order   @relation(fields: [orderId], references: [id])
  orderId   String
  product   Product @relation(fields: [productId], references: [id])
  productId String
  quantity  Int
  price     Float
}
```

**Schema notes:**
- `rating` and `reviewCount` NOT stored on `Product` — computed from `Review` table at query time
- `price` on `OrderItem` is a snapshot — history unaffected by price changes
- No `OtpCode` model — Better Auth manages email verification tokens
- `Cart` is one-per-user (`userId @unique`), created lazily via upsert on first cart access
- `CartItem` has `@@unique([cartId, productId])` — one entry per product per cart
- `Wishlist` is one-per-user (`userId @unique`), created lazily via upsert on first wishlist access
- `WishlistItem` has `@@unique([wishlistId, productId])` — one entry per product per wishlist, no quantity

## 5. Shared Types
```ts
export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'customer' | 'admin'
  emailVerified: boolean
  phone?: string
  address?: string
  createdAt: string
  updatedAt: string
}

export type AuthUser = Omit<User, 'createdAt' | 'updatedAt'>
```
`@theokallia/api` does NOT import from `@theokallia/types` — it uses a local `src/types/user.ts` copy.

## 6. API Contract
| Base | URL |
|---|---|
| Local web | `http://localhost:3000` |
| Local API | `http://localhost:3333/v1` |
| Production web | `https://theokallia.com` |
| Production API | `https://api.theokallia.com/v1` |

### Auth
Auth is managed by Better Auth and routed through the catch-all proxy to the NestJS server. The client uses a same-origin Better Auth client at `/api/auth`. See [Section 7](#7-authentication-architecture) for details.

### Users
| Method | Endpoint | Auth |
|---|---|---|
| GET | `/users/me` | authenticated |
| PATCH | `/users/me` | authenticated |

### Categories
| Status | Source |
|---|---|
| Complete, 8 endpoints, seeded | `@theokallia/api/src/categories/` |
Source README does not enumerate the individual category routes.

### Products
| Status | Source |
|---|---|
| Complete, 6 endpoints, 12 seeded | `@theokallia/api/src/products/` |
Source README does not enumerate the individual product routes.

### Reviews
| Method | Endpoint | Auth |
|---|---|---|
| POST | `/products/:slug/reviews` | authenticated |
| GET | `/products/:slug/reviews` | public |
| PATCH | `/products/:slug/reviews/:reviewId` | authenticated |
| DELETE | `/products/:slug/reviews/:reviewId` | authenticated |

### Cart
| Method | Endpoint | Auth |
|---|---|---|
| GET | `/cart` | authenticated |
| POST | `/cart` | authenticated |
| PATCH | `/cart/:itemId` | authenticated |
| DELETE | `/cart/:itemId` | authenticated |
| DELETE | `/cart/clear` | authenticated |
| POST | `/cart/merge` | authenticated |
| POST | `/cart/validate-guest` | public |

### Wishlist
| Method | Endpoint | Auth |
|---|---|---|
| GET | `/wishlist` | authenticated |
| POST | `/wishlist/toggle` | authenticated |
| POST | `/wishlist/merge` | authenticated |
| DELETE | `/wishlist/:itemId` | authenticated |

### Catch-All Proxy
`@theokallia/web/app/api/[...path]/route.ts`
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
- `req.nextUrl.search` MUST be appended or query params are dropped.
- `cache: 'no-store'` MUST be set.
- `cookie` MUST be forwarded so the upstream auth/session layer can read the session cookies.
- `origin` MUST be forwarded for Better Auth requests.
- `set-cookie` MUST be forwarded back with `forEach` + `append` for both auth cookies.

## 7. Authentication Architecture
### Overview
Auth is provided by **Better Auth**, a server-side auth library with a first-party React client. The NestJS backend exposes Better Auth at `/api/auth/*`. The Next.js frontend uses a same-origin Better Auth client at `/api/auth` (relative URL, resolved at runtime).

Better Auth manages: user creation, email/password login, session cookies, email verification links, and password reset links. It uses its own `user`, `session`, `account`, and `verification` tables in the database (auto-managed via Prisma adapter).

### Server-side setup (`apps/api/src/auth/auth.ts`)
```ts
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { PrismaClient } from '@prisma/client'
import { Queue } from 'bullmq'

const prisma = new PrismaClient()

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: { role: { type: 'string', required: true, defaultValue: 'customer' } },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await mailQueue.add('send-verification-email', { user, url })
    },
  },
  sendResetPassword: async ({ user, url }) => {
    await mailQueue.add('send-reset-password', { user, url })
  },
  baseURL: process.env.BETTER_AUTH_URL!,
  secret: process.env.BETTER_AUTH_SECRET!,
  advanced: {
    defaultCookieAttributes: {
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    },
  },
})
```

### Client-side setup (`apps/web/lib/auth-client.ts`)
```ts
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: '/api/auth',
})
```

All requests go through the Next.js catch-all proxy (`apps/web/app/api/[...path]/route.ts`), which forwards them to the NestJS server.

### Flows
```text
Sign Up
→ authClient.signUp.email({ email, password, name })
→ Browser POST /api/auth/register → proxy → NestJS
→ Better Auth creates user (emailVerified: false), queues verification email
→ User clicks verification link → Better Auth marks emailVerified: true
→ Frontend shows check-email modal → user reopens app → session resolves → authenticated

Sign In
→ authClient.signIn.email({ email, password })
→ Browser POST /api/auth/login → proxy → NestJS
→ Better Auth validates password, sets session cookies
→ Frontend merges guest cart/wishlist, closes modal, emits auth:login (cross-tab)

Sign Out
→ authClient.signOut()
→ Browser POST /api/auth/logout → proxy → NestJS
→ Frontend clears auth store, emits auth:logout (cross-tab)

Session Resolution
→ authClient.useSession()
→ Returns { data: session | null, isPending }
→ AuthProvider sets user from session.data.user

Forgot Password
→ authClient.forgetPassword({ email, redirectTo: `${origin}/?auth=reset-password` })
→ Better Auth queues reset-password email with token link

Reset Password
→ User lands on /?auth=reset-password&token=...
→ AuthProvider stores token in Zustand, opens reset modal
→ authClient.resetPassword({ newPassword, token })
→ Better Auth updates password, invalidates sessions
```

### Guards
Better Auth provides session data via the request object. A global `BetterAuthGuard` reads `session.user` and attaches it to the request. `RolesGuard` checks `session.user.role` against `@Roles()`.

| Guard | File | Purpose |
|---|---|---|
| `BetterAuthGuard` | `auth/guards/better-auth.guard.ts` | Reads session, populates `req.user` |
| `RolesGuard` | `auth/guards/roles.guard.ts` | Checks `req.user.role` against `@Roles()` |

The `@AllowAnonymous()` decorator exempts public endpoints from auth.

### Cookie security
Session cookies are httpOnly + secure (in production). Better Auth rotates session tokens and provides built-in CSRF protection.

### Email verification & password reset
Verification and reset emails use **token-based links** (not OTPs). The emails are sent via BullMQ jobs (`send-verification-email`, `send-reset-password`) → Nodemailer → Gmail SMTP.

### Cross-tab sync
Auth state changes are broadcast to other browser tabs via:
1. `BroadcastChannel` ('auth:login' / 'auth:logout') — primary mechanism
2. `localStorage` `storage` event — fallback for Safari/third-party contexts

## 8. Cart Architecture
### Dual cart strategy
```text
Guest cart
localStorage → Zustand store → components subscribe

Authenticated cart
React Query `['cart']` cache → API
```

### Guest cart data flow
```text
localStorage (persistent)
  ↕ read/write on every action
Zustand store (reactive)
  ↕ components subscribe
navbar badge, product card, cart page
```

### Stock validation layers
| Layer | Where | What it does |
|---|---|---|
| UI disable | `product-card.tsx`, `product-info.tsx` | Disables when `quantityInCart >= product.stock` |
| Guest storage cap | `cart-storage.ts` `addToGuestCart` | `Math.min(newQty, existing.stock)` |
| Guest hydration cap | `guest-cart-store.ts` `hydrate` | Fetches fresh stock, caps, writes back |
| Guest storage update cap | `cart-storage.ts` `updateGuestCartItem` | `Math.min(quantity, existing.stock)` |
| Backend addItem | `cart.service.ts` | Validates `existingQty + dto.quantity <= product.stock` |
| Backend updateItem | `cart.service.ts` | Validates `dto.quantity <= product.stock` |
| Backend merge | `cart.service.ts` | `Math.min(existingQty + guestQty, product.stock)` |
| Backend getCart write-back | `cart.service.ts` | Caps and persists current stock |

### Merge on login
`useAuth().login` reads guest items, posts to `POST /cart/merge`, clears localStorage + Zustand, invalidates `['cart']`.

### `validate-guest`
`POST /cart/validate-guest` returns current stock for a list of productIds and is used by guest cart hydration.

## 9. Wishlist Architecture
### Dual wishlist strategy
```text
Guest wishlist
localStorage (full product objects) → Zustand store → components subscribe

Authenticated wishlist
React Query `['wishlist']` cache → API
```

### Why it differs from cart
- Stores full product objects so the wishlist page can render immediately from localStorage.
- Hydration is sync; no API call is needed.
- There is no `validate-guest` because wishlist items have no quantity.

### Guest wishlist data flow
```text
localStorage (persistent) — full product objects
  ↕ read/write on every action
Zustand store (reactive)
  ↕ components subscribe
navbar badge, wishlist page, cart items
```

### Merge on login
`useAuth().login` reads `getGuestWishlist()`, extracts `p.id`, posts to `POST /wishlist/merge`, clears localStorage + Zustand, invalidates `['wishlist']`.

### `silent` toast param
`useToggleWishlist(isAuthenticated, silent = false)` suppresses the built-in toast when `silent=true`, so callers can fire their own toast.

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

## 10. On App Load
```ts
void hydrateGuestCart()
hydrateWishlist()
```

### Guest cart hydration
1. Reads localStorage.
2. Calls `POST /cart/validate-guest` with all productIds.
3. API returns fresh `{ productId, stock, inStock }`.
4. Caps quantities that exceed current stock.
5. Writes capped values back to localStorage.
6. Sets Zustand state.

### Guest wishlist hydration
1. Reads localStorage.
2. Gets saved guest wishlist products (full objects).
3. Sets Zustand state directly.
4. Navbar badge updates immediately.

### Authenticated flow
`authClient.useSession()` resolves the user. If valid, `isAuthenticated` becomes `true` → `useCart` and `useWishlist` in navbar become enabled → both fire their fetches → badges update. Both have `staleTime: 0`.

### On login transition
1. `setUser` fires.
2. Guest cart merges via `POST /cart/merge`.
3. Guest wishlist merges via `POST /wishlist/merge`.
4. LocalStorage + Zustand are cleared.
5. `['cart']` and `['wishlist']` are invalidated.

## 11. Infrastructure & Environment Variables
### Services map
| Service | Provider | Purpose |
|---|---|---|
| PostgreSQL | Neon | Primary database |
| Redis | Upstash | BullMQ queue, caching |
| API hosting | Render | NestJS deployment |
| Frontend hosting | Vercel | Next.js deployment |
| Image storage | Cloudinary | Product image uploads |
| Email | Resend | Professional mail system |
| Payments | Paystack | Nigerian payment processor |

### `@theokallia/api/.env`
```env
NODE_ENV=development
PORT=3333
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=verify-full
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3333
REDIS_URL=rediss://default:...@upstash.io:6379
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-gmail@gmail.com
MAIL_PASS=your-16-char-app-password
MAIL_FROM=your-gmail@gmail.com
MAIL_PROVIDER=resend
RESEND_API_KEY=...
PAYSTACK_SECRET_KEY=...
PAYSTACK_PUBLIC_KEY=...
```

### `@theokallia/web/.env.local`
```env
API_URL=http://localhost:3333
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 12. Deployment
### Render Dockerfile
The API is deployed as a Docker container. It uses a multi-stage build to keep the production image lean (no dev dependencies).
- **Context**: Repository Root
- **Dockerfile**: `apps/api/Dockerfile`

### Vercel frontend setup
The frontend is deployed using Next.js standalone output for optimized performance.
- **Root Directory**: `apps/web`
- **Build Command**: `pnpm build`

## 13. BullMQ Email Queue
| Job Name | Data | Description |
|---|---|---|
| `send-verification-email` | `{ user, url }` | Email verification link |
| `send-reset-password` | `{ user, url }` | Password reset link |
| `send-order-confirmation` | TBD | Order confirmation (implemented) |

Retry config: 3 retries with exponential backoff.

## 14. Filter, Sort & Pagination
| Param | Type | Default | Description |
|---|---|---|---|
| `category` | string | all | comma-separated slugs e.g. `rings,bracelets` |
| `minPrice` | number | none | lower bound in Naira |
| `maxPrice` | number | none | upper bound in Naira |
| `sort` | string | none | `best-seller` or `new-arrival` |
| `order` | string | `desc` | `asc` or `desc` — backend only |
| `page` | number | `1` | current page |
| `limit` | number | `12` | items per page |

## 15. Shop & Product Page Architecture
`ShopPage` is a simple server component: no `searchParams`, no filter parsing, no props to `ProductGrid`. `SidebarFilter` and `ProductGrid` read from `useSearchParams` directly.

```text
shop/[slug]/page.tsx ('use client')
  ├── useProduct(slug) → name, price, images, description, category
  ├── useReviews(slug) → rating, reviewCount, ratingBreakdown, reviews list
  ├── [grid: 2 cols]
  │   ├── ProductImages
  │   └── [flex col]
  │       ├── ProductInfo(product) → full product object
  │       └── ProductShipping → hardcoded (DHL, 3-5 days, Nigeria)
  ├── [ratings + reviews]
  │   ├── if reviewCount > 0: ProductRatingSummary + ProductReviews
  │   └── if reviewCount === 0: empty state
  └── SimilarProducts(slug) → slug as prop, not useParams()
```

## 16. Containerization
The project uses a Docker-based orchestration strategy for local development and production consistency.

### API Dockerization
Uses a multi-stage build:
1. **Base**: Installs pnpm.
2. **Build**: Installs all dependencies and compiles TypeScript.
3. **Runner**: Installs only production dependencies and copies the `dist` folder.
- **Security**: Runs as a non-root user (`nodeuser`).
- **Prisma**: The Prisma Client is generated during the build stage and persisted in the final image.

### Web Dockerization
Uses a multi-stage build leveraging Next.js `standalone` output:
- **Build**: Compiles the Next.js app.
- **Runner**: Copies only the `.next/standalone` folder, static assets, and public files.
- **Efficiency**: Resulting image is significantly smaller and faster to boot.

### Docker Compose
A `docker-compose.yml` file allows starting the full stack locally. It manages the API and Web containers and connects them to external cloud services (Neon PostgreSQL and Upstash Redis) via a dedicated `.env.docker` file.
