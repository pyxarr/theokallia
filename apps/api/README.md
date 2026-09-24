# @theokallia/api
> NestJS REST API for Theokallia

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)

## 📦 Overview
- NestJS REST API for users, categories, products, reviews, cart, and wishlist.
- Authentication is handled by Better Auth under `/api/auth/*`.
- Orders, payments, and upload are next.
- Port `3333`; Swagger UI at `localhost:3333/docs`.
- Deployed to Render via `@theokallia/api/Dockerfile`.

## 🚀 Quick Start
```bash
pnpm install
```
1. Set `@theokallia/api/.env`.
2. Run the API.

## 🗂️ Repository Layout
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

## 🔌 Current Endpoints

### Auth
- Better Auth handles authentication under `/api/auth/*`.
- Session access in controllers uses `@Session()` and `session.user.id`.
- Public routes use `@AllowAnonymous()`.
- Roles use `session.user.role` via `RolesGuard`.

### Users
| Method | Endpoint | Guard | Description |
|---|---|---|---|
| GET | `/users/me` | Better Auth session | Returns current user |
| PATCH | `/users/me` | Better Auth session | Updates firstName, lastName, phone, address |

### Categories
| Status | Source |
|---|---|
| Complete, 8 endpoints, seeded | `@theokallia/api/src/categories/` |

### Products
| Status | Source |
|---|---|
| Complete, 6 endpoints, 12 products seeded | `@theokallia/api/src/products/` |

### Reviews
| Method | Endpoint | Guard | Description |
|---|---|---|---|
| POST | `/products/:slug/reviews` | Better Auth session | Create — one per user per product |
| GET | `/products/:slug/reviews` | public | Get all reviews + computed rating summary |
| PATCH | `/products/:slug/reviews/:reviewId` | Better Auth session | Update own review only |
| DELETE | `/products/:slug/reviews/:reviewId` | Better Auth session | Delete own — admin can delete any |

### Cart
| Method | Endpoint | Guard | Description |
|---|---|---|---|
| GET | `/cart` | Better Auth session | Get full cart with items, product details, computed total |
| POST | `/cart` | Better Auth session | Add item — increments if exists, validates combined stock |
| PATCH | `/cart/:itemId` | Better Auth session | Update quantity — validates against stock |
| DELETE | `/cart/:itemId` | Better Auth session | Remove single item |
| DELETE | `/cart/clear` | Better Auth session | Clear all items (used after checkout) |
| POST | `/cart/merge` | Better Auth session | Merge guest localStorage cart into DB cart after login |
| POST | `/cart/validate-guest` | public | Return current stock for a list of productIds — used by guest cart hydration |

### Wishlist
| Method | Endpoint | Guard | Description |
|---|---|---|---|
| GET | `/wishlist` | Better Auth session | Get full wishlist with product details. Creates empty wishlist if none exists |
| POST | `/wishlist/toggle` | Better Auth session | Add if not present, remove if already there. Returns `{ wishlisted: boolean, wishlist }` |
| POST | `/wishlist/merge` | Better Auth session | Merge guest localStorage productIds into DB wishlist after login. Skips duplicates |
| DELETE | `/wishlist/:itemId` | Better Auth session | Remove specific item by WishlistItem id |

## 🔐 Authentication
- Better Auth uses session cookies and the built-in NestJS integration.
- `session.user.id` is the canonical auth identity.
- `session.user.role` drives admin checks.
- `RolesGuard` is the only custom auth guard left in the API.
- Mail verification and password reset use BullMQ jobs with links, not OTP codes.

## ⚙️ Environment Variables
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

## 🚢 Deployment
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

## 📚 Documentation
| Document | Link |
|---|---|
| API architecture | [`apps/api/docs/architecture.md`](apps/api/docs/architecture.md) |
| API rules | [`apps/api/docs/rules.md`](apps/api/docs/rules.md) |
