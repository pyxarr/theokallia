# Theokallia Build Plan
This document is the authoritative reference for the current build state and future direction of Theokallia.

## 1. Current Build State
| Feature | Status | Source Verification |
|---|---|---|
| Auth module | Complete (Better Auth, email-link verification) | `@theokallia/api/src/auth/`, Section 4 |
| Users module | Complete, 2 endpoints | `@theokallia/api/src/users/`, Section 5 |
| Categories module | Complete, 8 endpoints, seeded | `@theokallia/api/src/categories/`, Section 19 |
| Products module | Complete, 6 endpoints, 12 seeded | `@theokallia/api/src/products/`, Section 20 |
| Reviews module | Complete, 4 endpoints | `@theokallia/api/src/reviews/`, Section 21 |
| Cart module | Complete, 7 endpoints | `@theokallia/api/src/cart/`, Section 11 |
| Wishlist module | Complete, 4 endpoints | `@theokallia/api/src/wishlist/`, Section 12 |
| Orders module | Complete | `@theokallia/api/src/orders/`, Section 29 |
| Payments module | Complete | `@theokallia/api/src/payments/`, Section 29 |
| Upload module | Complete, signed Cloudinary endpoints | `@theokallia/api/src/upload/`, Section 29 |
| PrismaService | `@Global()`, `.client` getter | `@theokallia/api/src/prisma/`, Section 27 |
| RedisService | `@Global()` | `@theokallia/api/src/redis/`, Section 27 |
| MailService | BullMQ processor | `@theokallia/api/src/mail/`, Sections 13 and 27 |
| Neon PostgreSQL schema | Fully built | `@theokallia/api/prisma/schema.prisma`, Section 10 |
| App pages | layout, shop, cart, wishlist, about, contact, proxy | `@theokallia/web/app/`, Section 15 |
| Auth components | Fully built | `@theokallia/web/components/auth/`, Section 15 |
| Profile components | Fully built | `@theokallia/web/components/profile/`, Section 15 |
| Cart components | Fully built | `@theokallia/web/components/cart/`, Section 15 |
| Wishlist components | Fully built | `@theokallia/web/components/wishlist/`, Section 15 |
| Shop components | Fully built | `@theokallia/web/components/shop/`, Section 15 |
| Product components | Fully built | `@theokallia/web/components/product/`, Section 15 |
| Hooks | `use-auth`, `use-cart`, `use-wishlist`, `use-products`, `use-reviews`, `use-categories`, `use-profile` | `@theokallia/web/lib/hooks/`, Section 15 |
| Stores | `auth-store`, `guest-cart-store`, `guest-wishlist-store` | `@theokallia/web/lib/stores/`, Sections 15 and 16 |
| Admin dashboard | Built — products, orders, reviews, customers, categories, newsletter | `apps/admin/`, Sections 4 and 29 |
| Admin content / coupons / settings pages | Not started (API endpoints exist) | `apps/admin/app/(dashboard)/`, Sections 4 and 29 |
| Shipping zones | Complete, module + zone mapping config | `@theokallia/api/src/orders/shipping-zones/`, Section 29 |
| Coupons | Complete, CRUD + validate + rollback | `@theokallia/api/src/coupons/`, Section 29 |
| Subscribers | Complete, tagging + Resend audience sync | `@theokallia/api/src/subscribers/`, Section 29 |
| Content blocks | Complete, scheduled queries | `@theokallia/api/src/content/`, Section 29 |
| Multi-currency | Complete, NGN base + USD/GBP/CAD | `@theokallia/api/src/currency/`, Section 29 |
| Shared types package | Consolidated single source of truth | `packages/types/`, Section 29 |
| Render deployment | API deployed via Docker | Section 13 |
| Vercel deployment | Frontend hosted | Section 13 |
| Neon PostgreSQL | Active | Sections 2, 3, 13 |
| Upstash Redis | Active | Sections 2, 3, 13 |
| CI/CD pipeline | Not started | Section 29 |
| Switch mail to Resend | Complete | Section 29 |
| Turborepo Remote Caching | Not started | Section 29 |

## 2. Phase Completion Status
| Phase | Original Plan | Status | Remaining |
|---|---|---|---|
| Phase 1 | Auth, users, categories, products, reviews | ✅ Done | None |
| Phase 2 | Cart, wishlist | ✅ Done | None |
| Phase 3 | Orders, payments | ✅ Done | None |
| Phase 4 | Upload, admin dashboard | ✅ Done | Cloudinary service, `apps/admin` build (core pages complete) |
| Phase 5 | Production hardening | 🚧 In Progress | Redis caching on `GET /products`, CI/CD (`.github/workflows` absent), Turborepo remote caching |

## 3. Immediate Next Items
1. Redis caching on `GET /products` — `RedisService` is `@Global()` but products module doesn't use it yet.
2. CI/CD pipeline — `.github/workflows` does not exist; needs build, test, lint, and deploy stages.
3. Admin content / coupons / settings pages — API endpoints exist (`/admin/content`, `/admin/coupons`, `/admin/site-config`) but no UI.
4. Turborepo remote caching — `turbo.json` has `"cache": false`; enable once CI exists.
5. Sentry integration (API + Web) — error tracking and monitoring.

## 4. Open Decisions
- Review submission form UI — the `write-review-form.tsx` component exists but is not yet placed on a public page.
- Google OAuth — deferred.
- Guest wishlist `validate-guest` endpoint — deferred unless stale `inStock` becomes a real user complaint.
- Le Jour Serif commercial license — must be verified before launch (font in `apps/{admin,web}/public/fonts/Le Jour Serif Personal Use Only.otf`).

## 5. Known Technical Debt
- Basic API rate limiting implemented via Upstash (sliding window, 100 req/1m). Future improvement: Add comprehensive rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset) to support client-side throttling.
- No Redis caching on `GET /products` — placeholder only
- Mail now using Resend
- No CI/CD pipeline
- No Turborepo Remote Caching
- Admin review block not implemented — `ForbiddenException` check missing in `ReviewsService.create`

## 6. Phase Roadmap
### Phase 1: Core Platform (Complete)
- Auth, users, categories, products, reviews, cart, wishlist
- NestJS backend deployed to Render
- Next.js frontend deployed to Vercel
- Neon PostgreSQL + Upstash Redis active

### Phase 2: Commerce (Complete)
- Orders module with silent stock reservation
- Paystack payments (initialize + webhook)
- BullMQ order confirmation emails
- Professional checkout and order history UX

### Phase 3: Admin & Upload (Current)
- Cloudinary upload service
- `apps/admin` — separate Next.js app with Shadcn
- Admin dashboard — products, orders, users, categories
- Shipping config endpoint

### Phase 4: Production Hardening
- Redis caching on `GET /products`
- Rate limiting configuration
- Turborepo Remote Caching
- CI/CD pipeline
