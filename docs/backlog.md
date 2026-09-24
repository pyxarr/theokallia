# Backlog

Working list of accepted-but-not-yet-built items for Theokallia. Each entry is
self-contained: what to change, why, where, and how we'll know it's done.

Items here are **not** started until explicitly picked up. Anything shipped gets
removed from this list.

---

## 1. Add `@@index([userId])` to the `Order` model

**Status:** pending — not started.

**What**
Add a database index on `Order.userId` in `apps/api/prisma/schema.prisma`, plus
the migration that creates it.

```prisma
model Order {
  // ...existing fields...

  @@index([userId])
  @@map("order")
}
```

**Why**
Prisma does **not** create indexes for foreign keys on PostgreSQL, so every
"this customer's orders" query currently does a sequential scan that degrades as
the table grows. The index is used by four existing/planned paths:

- the planned admin **customers directory** aggregate (lifetime spend + order count per customer)
- the **reviews purchase check** — `order.findFirst({ where: { userId, status: { in: [...] }, items: { some: { productId } } } })`
- the **VIP evaluation** on successful payment (order count / lifetime spend per user)
- `GET /orders` — the customer's own order history

**Where**
- `apps/api/prisma/schema.prisma` — add the attribute
- new migration under `apps/api/prisma/migrations/` (generated, not hand-written)

**How**
```bash
pnpm --filter @theokallia/api db:migrate    # name it e.g. add_order_user_id_index
```

Additive and non-breaking: it only creates an index, no data or column changes.

**Optional companion (same PR is fine, separate if you prefer)**
The reviews purchase check also filters `OrderItem.productId` inside
`items: { some: { productId } }`. If that query shows up hot in Postgres
`EXPLAIN`, add `@@index([productId])` to `OrderItem` at the same time.

**Done when**
- the schema contains the index and a committed migration creates it
- `prisma generate` and `tsc --noEmit` are clean
- no behavioural change — all existing tests still pass
- before writing the migration, confirm the index isn't already present
  (inspect the generated SQL and the existing migration for `order_userId_idx`)

---

## 2. Admin customers page (directory + profiles + VIP toggle)

**Status:** planned, approved in outline — build not started.

Two new admin-only read endpoints plus two screens:

- `GET /users/admin?q=&role=&page=&limit=` — directory with `ordersCount`,
  `lifetimeSpend`, `lastOrderAt`, `reviewsCount` per customer
- `GET /users/admin/:id` — profile, aggregates, recent orders, reviews, coupon uses

Screens: `/customers` (searchable table) and `/customers/[id]` (profile + VIP
toggle). Reuses the existing `PATCH /users/:id/vip` override, which is already
built and tested.

**Open decisions before building:** whether staff/admin accounts appear in the
directory, the exact order-status set used for `lifetimeSpend` (must mirror the
VIP evaluation engine so the displayed number matches the qualifying one), and
whether to add a confirm step on VIP demotion.

**Dependency:** item 1 (the index) should land first so the directory aggregates
start on an indexed column.

---

## 3. Shipping carrier is not recorded or shown

**Status:** pending — discovered while answering "how does the admin get the
tracking number?".

`Order.trackingNumber` is stored and emailed, but nothing records **which
courier** it belongs to, so the customer receives a bare number with no way to
know where to track it. The tracking number also isn't hyperlinked.

**Suggested scope:** add `carrier String?` to `Order` (+ migration), a courier
dropdown (GIG / Kwik / DHL / Sendbox / Other) beside the tracking field in the
admin order detail, and a carrier → tracking-URL map used to render a real link
in the shipping email. Optionally allow marking an order shipped before the
waybill exists, with a later "add tracking" action.

---

## 4. Dead "track order" links in customer emails

**Status:** pending — discovered while verifying the review pipeline.

`packages/emails/src/shipping-update.tsx` and `order-confirmation.tsx` both link
to `https://theokallia.com/account/orders`, which does not exist — the storefront
order history lives at `/profile/orders`. Both buttons currently 404.

**Fix:** point both emails at `/profile/orders` (or introduce a public
`/track` page if guests should be able to track an order).
