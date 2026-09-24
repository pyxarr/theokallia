# THEOKALLIA — Product Requirements Document
> **Full-Stack Luxury Jewellery E-Commerce Platform**
> Version: 1.0
> Date: 2026-06-24
> Owner: Uke — Pyxarr
> Status: In Development

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Users](#3-target-users)
4. [Product Overview](#4-product-overview)
5. [Core Features](#5-core-features)
6. [MVP Scope](#6-mvp-scope)
7. [Technical Architecture](#7-technical-architecture)
8. [Phased Roadmap](#8-phased-roadmap)
9. [Monetization & Business Context](#9-monetization--business-context)
10. [Success Metrics](#10-success-metrics)
11. [Non-Negotiables](#11-non-negotiables)

## 1. Executive Summary
- Theokallia (*Divine Beauty*) is a full-stack luxury jewellery e-commerce platform.
- It is being built solo by Uke on a Windows machine using Git Bash.
- It is a client project for a Nigerian jewellery brand.
- Auth, profile, categories, products, reviews, cart, and wishlist are complete end to end.
- The backend is deployed to Render; the project is moving into the orders module.
- Platform split: storefront (`theokallia.com`), NestJS REST API (`api.theokallia.com`), custom admin dashboard (`apps/admin`).

## 2. Problem Statement
- Theokallia provides a full-stack commerce platform for a Nigerian jewellery brand.
- It supports a public storefront, authenticated business logic, and a custom admin surface.
- Paystack is the payment processor; the stack is built around hosted PostgreSQL, Redis, and cloud deployment.

## 3. Target Users
| Audience | Needs |
|---|---|
| Business owner | Admin dashboard for products, orders, users, categories; upload; shipping config; order management |
| End customer | Browse products, manage account, cart, wishlist, reviews, and checkout-related flows |

## 4. Product Overview
- `theokallia.com`: public-facing marketing and shop site.
- `api.theokallia.com`: NestJS REST API for business logic, products, orders, payments, auth.
- `apps/admin`: custom admin dashboard for the business owner.

## 5. Core Features
### Auth (complete)
- Auth is handled by Better Auth (same-origin client at `/api/auth`, NestJS server integration).
- Flows: email/password signup, email/password signin, email verification links, password reset links, session cookies, cross-tab sync.
- Status: complete.

### Users (complete)
- Endpoints: `GET /users/me`, `PATCH /users/me`.
- Behavior: current user read/update via `BetterAuthGuard`.
- Status: complete.

### Categories (complete)
- Seeded structure: Rings, Bracelets, Necklaces, Earrings with subcategories.
- Status: complete.

### Products (complete)
- Endpoints: 6 total; 12 products seeded.
- Behavior: product detail uses `useProduct` + `useReviews`; product card and product info wire wishlist/cart interactions.
- Status: complete.

### Reviews (complete)
- Endpoints: `POST /products/:slug/reviews`, `GET /products/:slug/reviews`, `PATCH /products/:slug/reviews/:reviewId`, `DELETE /products/:slug/reviews/:reviewId`.
- Behavior: one review per user per product; admin delete allowed; admin review block is deferred.
- Status: complete.

### Cart (complete)
- Endpoints: `GET /cart`, `POST /cart`, `PATCH /cart/:itemId`, `DELETE /cart/:itemId`, `DELETE /cart/clear`, `POST /cart/merge`, `POST /cart/validate-guest`.
- Behavior: guest cart uses Zustand + localStorage; hydration validates stock; login merges guest cart into DB cart.
- Status: complete.

### Wishlist (complete)
- Endpoints: `GET /wishlist`, `POST /wishlist/toggle`, `POST /wishlist/merge`, `DELETE /wishlist/:itemId`.
- Behavior: guest wishlist uses Zustand + localStorage; sync hydration; login merges full product objects into DB wishlist; wishlist items have no quantity.
- Status: complete.

### Orders (planned)
- Next module: `OrdersService`, `OrdersController`, `OrdersModule`.
- Planned endpoints: `POST /orders`, `GET /orders`, `GET /orders/:id`.
- Status: next.

### Payments (planned)
- Planned: `POST /payments/initialize` and `POST /payments/webhook`.
- Behavior: Paystack init and webhook verification; create order on `charge.success`.
- Status: planned.

### Upload (planned)
- Planned: Cloudinary image upload service.
- Status: planned.

## 6. MVP Scope
| In Scope | Out of Scope |
|---|---|
| Auth, users, categories, products, reviews, cart, wishlist | Review submission form UI |
| Storefront, API, admin surface split | Admin review block |
| Guest cart + guest wishlist state management | `ProductShipping` config endpoint |
| Orders module roadmap | Google OAuth |
| Paystack payments | Guest wishlist `validate-guest` endpoint |
| Cloudinary upload plan | Buy Now checkout wiring |
| Render deployment | Orders implementation |
| Neon PostgreSQL + Upstash Redis | Payments implementation |
| Vercel frontend hosting | Upload implementation |
|  | Admin dashboard build-out |
|  | Shipping config endpoint |
|  | Redis caching on `GET /products` |
|  | Switch mail to Resend |
|  | Turborepo Remote Caching |
|  | CI/CD pipeline |

## 7. Technical Architecture
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
| Email sender | Nodemailer |
| Guest cart | Zustand + localStorage |
| Guest wishlist | Zustand + localStorage |
| Caching | Upstash Redis |
| Rate limiting | Upstash Ratelimit (planned) |
| Deployment | Render |
| Google OAuth | Deferred |
| Payments | Paystack |
| File storage | Cloudinary |

Monorepo summary: `@theokallia/api/src/` contains `auth`, `users`, `categories`, `products`, `reviews`, `cart`, `wishlist`, `prisma`, `redis`, `mail`; `@theokallia/web/` contains `app`, `components`, `lib`, and shared hooks/stores/validation.

Deployment topology: API on Render, frontend on Vercel, database on Neon PostgreSQL, Redis on Upstash.

## 8. Phased Roadmap
### Phase 1: Immediate
1. Orders module - `OrdersService`, `OrdersController`, `OrdersModule`
2. Order DTOs - `CreateOrderDto`, `OrderItemDto`
3. Orders endpoints - `POST /orders`, `GET /orders`, `GET /orders/:id`
4. `prisma.$transaction` - create order + items + decrement stock atomically
5. Paystack payment init - `POST /payments/initialize`
6. Paystack webhook - `POST /payments/webhook`
7. BullMQ `send-order-confirmation` job

### Phase 2: Deferred
- Review submission form UI; admin review block; `ProductShipping` config endpoint; Google OAuth; guest wishlist `validate-guest` endpoint; Buy Now checkout wiring.

### Phase 3: Admin & Production
- Cloudinary upload service; `apps/admin`; admin dashboard; shipping config endpoint; Redis caching on `GET /products`; switch mail to Resend; Turborepo Remote Caching; CI/CD pipeline.

## 9. Monetization & Business Context
- This is a client project, not a SaaS product.
- Paystack is the payment processor for end customers.
- The product is priced in Naira and built for a Nigerian jewellery brand.

## 10. Success Metrics
- Auth, users, categories, products, reviews, cart, and wishlist remain complete end to end.
- Orders, payments, and upload are delivered from the roadmap.
- The backend remains deployed to Render.
- The project is handed off as a complete client build.

## 11. Non-Negotiables
### Technical
- Auth is enforced by Better Auth (global guard reads `session.user`).
- `req.user` is `{ id, email, role }` from the Better Auth session; use `id` to look up `User`.
- Admin routes use `@UseGuards(RolesGuard)` + `@Roles('admin')`.
- All DTOs use `class-validator` decorators.
- `confirmPassword` never appears in a DTO; frontend-only via Zod.
- Multi-step DB operations use `prisma.$transaction`.
- Every module needs `.module.ts`, `.controller.ts`, `.service.ts`, `dto/`.
- Prisma lives in `@theokallia/api/prisma/`.
- Mail via BullMQ only; never call `nodemailer.sendMail()` directly.
- `PrismaService` and `RedisService` are `@Global()`.
- `PrismaService` uses `.client` getter: `this.prisma.client.xyz`.
- Do not import from `@theokallia/types` in `@theokallia/api`.
- `VersioningType` comes from `@nestjs/common`.
- Keep `enableImplicitConversion: true` in `ValidationPipe`.
- `Record<K, V>` always needs both type arguments.
- Use callback form `prisma.$transaction(async (tx) => { ... })` when `await` is needed inside.
- Push `'use client'` as deep as possible.
- Filter state in URL params, not `useState`.
- `ShopPage` is a simple server component; `ProductGrid` reads filters from `useSearchParams` + `useMemo`.
- Always use `<Image>` and `<Link>` for internal links.
- Use `cn()` from `@/lib/utils`.
- No semicolons, single quotes, 2-space indent.
- Child components that need the current product slug receive it as a prop.
- Guest cart state lives in `useGuestCartStore`; guest wishlist state lives in `useGuestWishlistStore`.
- Authenticated cart state lives in React Query `['cart']`; authenticated wishlist state lives in React Query `['wishlist']`.
- `useGuestCartStore.getState().addItem()` and `useGuestWishlistStore.getState().toggleItem()` are the correct action patterns inside `mutationFn`.
- `hydrate` in `guest-cart-store.ts` is async and must be called with `void hydrate()` in `useEffect`.
- `hydrate` in `guest-wishlist-store.ts` is sync and must be called without `void`.
- `useToggleWishlist(isAuthenticated, true)` is for silent caller-owned toast flows.
- Toast fires in `onMutate` for authenticated and in `mutationFn` for guest, not `onSuccess`.
- `useRemoveWishlistItem` does not fire a success toast.
- `ProductInfo` receives full `product: Product`.
### Product
- Sharp corners only: `--radius: 0rem`, no border-radius anywhere.
- `@theme inline` only; use `bg-[#7E22CE]` or CSS vars, not utility aliases like `bg-primary`.
- Buttons hover: purple background with white text.
- Product detail page uses 3 thumbnails.
- Product cards use `Add To Bag`.
- Le Jour Serif requires a commercial license check before launch.
- Paystack remains the payment processor.

Theokallia PRD v1.0 • Pyxarr • 2026-06-24 • Confidential
