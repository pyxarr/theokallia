# @theokallia/api — Architecture
> NestJS Backend Technical Reference
> Version: 1.0
> Status: Active

## Table of Contents
1. [Overview](#1-overview)
2. [Module Structure](#2-module-structure)
3. [`main.ts` Configuration](#3-maints-configuration)
4. [Better Auth](#4-better-auth)
5. [Users Module](#5-users-module)
6. [Categories Module](#6-categories-module)
7. [Products Module](#7-products-module)
8. [Reviews Module](#8-reviews-module)
9. [Cart Module](#9-cart-module)
10. [Wishlist Module](#10-wishlist-module)
11. [Prisma Module](#11-prisma-module)
12. [Redis Module](#12-redis-module)
13. [Mail Module](#13-mail-module)
14. [Database Schema](#14-database-schema)
15. [Environment Variables](#15-environment-variables)
16. [Deployment](#16-deployment)

## 1. Overview
`@theokallia/api` is the NestJS REST API for Theokallia. It runs on port `3333`, exposes Swagger at `localhost:3333/docs`, and is deployed to Render using `@theokallia/api/Dockerfile`.

`PrismaModule` and `RedisModule` are `@Global()`. Prisma uses the `.client` getter pattern. All routes use NestJS URI versioning on `/v1/`.

Authentication is handled by Better Auth through `@thallesp/nestjs-better-auth`. Controllers use `@Session()` and `@AllowAnonymous()` instead of a local JWT auth controller.

## 2. Module Structure
```text
apps/api/src/
├── auth.ts                       ✅ Better Auth instance (email/password, verification, reset password, custom user fields)
├── main.ts                       ✅ Helmet, cookieParser, CORS, ValidationPipe (enableImplicitConversion: true), Swagger, VersioningType.URI
├── app.module.ts                 ✅ ConfigModule, BullModule, PrismaModule, RedisModule, MailModule, BetterAuthModule, UsersModule, CategoriesModule, ProductsModule, ReviewsModule, CartModule, WishlistModule
├── users/                        ✅ GET /users/me, PATCH /users/me
├── categories/                   ✅ all 8 endpoints, seeded
├── products/                     ✅ all 6 endpoints, 12 products seeded
├── reviews/                      ✅ all 4 endpoints complete
├── cart/                         ✅ all 7 endpoints complete
├── wishlist/                     ✅ all 4 endpoints complete
├── prisma/                       ✅ @Global(), exposes .client getter
├── redis/                        ✅ @Global()
└── mail/                         ✅ BullMQ processor

apps/api/src/ to be built: orders/ (next — prisma.$transaction), payments/ (Paystack init + webhook), upload/ (Cloudinary image upload)
```

## 3. `main.ts` Configuration
```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
)
```

Registered in `main.ts`: Helmet, cookieParser, CORS, global ValidationPipe, Swagger, `VersioningType.URI`.

## 4. Better Auth
- Configured in `src/auth/auth.ts`.
- Registered in `app.module.ts` with `BetterAuthModule.forRoot({ auth })`.
- Uses Prisma adapter and email/password auth.
- Requires email verification.
- Sends verification and reset-password links through the BullMQ mail queue.
- Adds custom `firstName`, `lastName`, `phone`, `address`, and `role` fields on the user model.
- `role` is app-owned metadata and defaults to `customer`.

## 5. Users Module
| Method | Endpoint | Guard | Description |
|---|---|---|---|
| GET | `/users/me` | Better Auth session | Returns current user |
| PATCH | `/users/me` | Better Auth session | Updates firstName, lastName, phone, address |

`session.user.id` is used to load and update the authenticated user.

## 6. Categories Module
Categories are public read routes plus admin CRUD routes protected by `RolesGuard` + `@Roles('admin')`.

## 7. Products Module
Products are public read routes plus admin CRUD routes protected by `RolesGuard` + `@Roles('admin')`.

## 8. Reviews Module
| Method | Endpoint | Guard | Description |
|---|---|---|---|
| POST | `/products/:slug/reviews` | Better Auth session | Create one review per user per product |
| GET | `/products/:slug/reviews` | public | Get all reviews + computed rating summary |
| PATCH | `/products/:slug/reviews/:reviewId` | Better Auth session | Update own review only |
| DELETE | `/products/:slug/reviews/:reviewId` | Better Auth session | Delete own review; admin can delete any |

Reviews use `session.user.id` for ownership checks.

## 9. Cart Module
| Method | Endpoint | Guard | Description |
|---|---|---|---|
| GET | `/cart` | Better Auth session | Get full cart with items, product details, computed total |
| POST | `/cart` | Better Auth session | Add item — increments if exists, validates combined stock |
| PATCH | `/cart/:itemId` | Better Auth session | Update quantity — validates against stock |
| DELETE | `/cart/:itemId` | Better Auth session | Remove single item |
| DELETE | `/cart/clear` | Better Auth session | Clear all items (used after checkout) |
| POST | `/cart/merge` | Better Auth session | Merge guest localStorage cart into DB cart after login |
| POST | `/cart/validate-guest` | public | Return current stock for a list of productIds |

`@AllowAnonymous()` is applied only to `POST /cart/validate-guest`.

## 10. Wishlist Module
| Method | Endpoint | Guard | Description |
|---|---|---|---|
| GET | `/wishlist` | Better Auth session | Get full wishlist with product details |
| POST | `/wishlist/toggle` | Better Auth session | Add if not present, remove if already there |
| POST | `/wishlist/merge` | Better Auth session | Merge guest localStorage productIds into DB wishlist after login |
| DELETE | `/wishlist/:itemId` | Better Auth session | Remove specific item by WishlistItem id |

## 11. Prisma Module
- `@Global()`.
- Exposes `.client` getter.
- Always use `this.prisma.client.xyz`.

## 12. Redis Module
- `@Global()`.
- Used by BullMQ and future cache work.
- No auth OTP keys remain.

## 13. Mail Module
- BullMQ processor only.
- Sends verification and reset-password links.
- Never call `nodemailer.sendMail()` directly from feature code.

| Job Name | Data | Description |
|---|---|---|
| `send-verification-email` | `{ email, url }` | Email verification link |
| `send-reset-password` | `{ email, url }` | Password reset link |

## 14. Database Schema
Better Auth core models:
- `user`
- `session`
- `account`
- `verification`

App models:
- `Category`, `Subcategory`, `Product`, `Review`, `Order`, `OrderItem`, `Cart`, `CartItem`, `Wishlist`, `WishlistItem`

Schema notes:
- No `RefreshToken` model.
- No OTP Redis auth keys or tables.
- `session.user.id` is the auth identity.
- `role` is custom app metadata on `User`.

## 15. Environment Variables
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
```

## 16. Deployment
```dockerfile
FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/typescript-config/package.json ./packages/typescript-config/
RUN pnpm install --frozen-lockfile
COPY . .
WORKDIR /app/apps/api
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
RUN pnpm build
EXPOSE 3333
CMD ["node", "dist/main"]
```

Render uses the Dockerfile above.
