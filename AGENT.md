## Required Reading Order
1. `docs/plan.md`
2. `@theokallia/api/docs/rules.md`
3. `@theokallia/web/docs/rules.md`

## Project Overview
- Theokallia (*Divine Beauty*) is a full-stack luxury jewellery e-commerce platform for a Nigerian jewellery brand.
- Platform split: storefront (`theokallia.com`), NestJS API (`api.theokallia.com`), custom admin dashboard (`apps/admin`).
- Current status: auth, users, categories, products, reviews, cart, and wishlist are complete end to end.
- Stack: TypeScript throughout, Next.js 16 frontend, NestJS backend, Prisma in `@theokallia/api`.

## Current Build State
See `docs/plan.md` for the full picture.
Summary:
- Complete: auth, users, categories, products, reviews, cart, wishlist.
- Next: orders.
- Not started: payments, upload, admin dashboard, shipping config, Redis caching on `GET /products`, CI/CD.

## Technology Stack
| Layer | Technology |
|---|---|
| Monorepo | Turborepo (pnpm workspaces) |
| Package manager | pnpm |
| Frontend | Next.js 16.2 (App Router, Turbopack, port 3000) |
| Language | TypeScript |
| CSS | Tailwind v4 (`@theme inline`, no config file) |
| UI components | Shadcn UI |
| Icons | Lucide React |
| State management | Zustand (auth, guest cart, guest wishlist) |
| Data fetching | TanStack React Query |
| Forms | React Hook Form + Zod |
| HTTP client | axios (`lib/api.ts`, `/api`, `withCredentials: true`, 401 interceptor) |
| API versioning | NestJS URI versioning (`defaultVersion: '1'`, `/v1/`) |
| Backend | NestJS (port 3333, Swagger at `/docs`) |
| ORM | Prisma v7 (`@theokallia/api/prisma/`, not `@theokallia/db`) |
| Database | Neon PostgreSQL (`dev` branch) |
| Auth | Custom NestJS Auth |
| Auth sessions | httpOnly cookies (`access_token`, `refresh_token`) |
| Password hashing | bcryptjs |
| OTP storage | Upstash Redis (`otp:{email}`, TTL 5min) |
| Pending registration | Upstash Redis (`pending-registration:{email}`, TTL 5min) |
| Reset OTP storage | Upstash Redis (`reset:{email}`, TTL 5min) |
| Reset grant storage | Upstash Redis (`reset-grant:{email}`, TTL 10min) |
| Refresh tokens | `RefreshToken` DB table |
| Email queue | BullMQ + Upstash Redis (`send-otp`, `send-reset-otp`) |
| Email sender | Nodemailer (Gmail SMTP for dev, Resend for production) |
| Guest cart | Zustand + localStorage |
| Guest wishlist | Zustand + localStorage |
| Caching | Upstash Redis |
| Rate limiting | `@nestjs/throttler` |
| Validation | `class-validator` + `class-transformer` |
| Deployment | Render (Dockerfile, Node 20 Alpine, `@theokallia/api/Dockerfile`) |
| Google OAuth | Deferred (`passport-google-oauth20`) |
| Payments | Paystack |
| File storage | Cloudinary |

## Agent Instructions
- Read the required docs before writing code.
- Never touch code not asked about.
- Stick to the locked stack.
- No `any` in TypeScript.
- pnpm only, no npm or yarn.
- `PrismaService` uses `.client`; always write `this.prisma.client.xyz`.
- All API calls go through `lib/api.ts`; never raw `fetch`.
- Use `prisma.$transaction` callback form for multi-step DB operations.
- Mail goes through BullMQ only; never call `nodemailer.sendMail()` directly.
- After completing any task, suggest a conventional commit message.
- After completing any task, suggest any needed `docs/` updates; do not update them automatically.
- Maximum 5 files per response unless instructed otherwise.
- TypeScript must compile (`npx tsc --noEmit`) and ESLint must pass before reporting completion.

## Never Do
- Use `any` in TypeScript.
- Call `nodemailer.sendMail()` directly.
- Import from `@theokallia/types` in `@theokallia/api`.
- Use `this.prisma.product.findMany()`; always use `this.prisma.client.xyz`.
- Hardcode `API_VERSION`; always import it from `lib/api.ts`.
- Read `localStorage` directly in components; use Zustand stores.
- Use raw `fetch` in hooks or components; use `lib/api.ts`.
- Use npm or yarn; pnpm only.
- Add border-radius anywhere; `--radius: 0rem` always.
- Use utility classes like `bg-primary`; use `bg-[#7E22CE]` or CSS vars.
- Call `useParams()` inside child components; pass slug as a prop.

## Non-Negotiables
See `@theokallia/api/docs/rules.md` and `@theokallia/web/docs/rules.md` for the complete constraint lists.

## Git Workflow
- Repository: `https://github.com/pyxarr/theokallia.git`
- Branches: `main` and `dev`; current working branch: `dev`
- Commit format: `feat:`, `fix:`, `chore:`, `ui:`, `refactor:`
- Developer machine: Windows, Git Bash terminal
