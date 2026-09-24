# @theokallia/admin

> Admin dashboard for Theokallia

Next.js 16 admin surface for orders, products, and catalog management. Runs on
port `3002` and proxies all API traffic through `app/api/[...path]/route.ts`
to the NestJS API.

## Prerequisites

- The API (`@theokallia/api`) running on port `3333`
- An admin account — promote one with a password so it can sign in:

  ```bash
  pnpm --filter @theokallia/api seed:admin -- "you@example.com" "Your Name" "your-password"
  ```

  The API's Better Auth config requires email verification; the seed script
  marks the account verified when a password is supplied.

## Environment

Copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3002
API_URL=http://localhost:3333
```

`NEXT_PUBLIC_APP_URL` must also be trusted by the API — it is wired through
`ADMIN_URL` in `apps/api/.env` (see `apps/api/.env.example`).

## Run

```bash
pnpm --filter @theokallia/admin dev
```

Open http://localhost:3002 — unauthenticated visits redirect to `/login`;
non-admin sessions are redirected to `/unauthorized`.

## Structure

```text
apps/admin/
├── app/
│   ├── login/page.tsx                ✅ email/password sign-in
│   ├── (dashboard)/
│   │   ├── layout.tsx                ✅ sidebar shell + AdminGuard
│   │   ├── dashboard/page.tsx        ✅ metrics + recent orders
│   │   ├── orders/page.tsx           ✅ index with status filter
│   │   ├── orders/[id]/page.tsx      ✅ fulfilment view, status + tracking
│   │   ├── products/page.tsx         ✅ catalog table with delete
│   │   ├── products/new/page.tsx     ✅ create form + media + category creator
│   │   ├── products/[slug]/edit/     ✅ edit form
│   │   └── unauthorized/page.tsx     ✅ non-admin landing
│   └── api/[...path]/route.ts        ✅ catch-all proxy to the API
├── components/
│   ├── admin-guard.tsx               ✅ session + admin role enforcement
│   ├── app-sidebar.tsx, admin-topbar.tsx
│   ├── products/product-form.tsx     ✅ shared create/edit form
│   ├── products/media-manager.tsx    ✅ Cloudinary upload + ordering
│   ├── products/category-creator.tsx ✅ inline category/subcategory creation
│   └── ui/                           ✅ Shadcn
└── lib/
    ├── api.ts                        ✅ axios client, baseURL '/api'
    ├── auth-client.ts                ✅ Better Auth client
    ├── hooks/                        ✅ use-admin-{products,orders,categories}
    └── validations/product.ts        ✅ zod schema + slugify
```

## Notes

- Every dashboard page is wrapped by `AdminGuard`; the API additionally
  enforces `@Roles('admin')` on all admin endpoints (defense in depth).
- Images render through `lib/cloudinary-loader.ts` (custom Next.js loader).