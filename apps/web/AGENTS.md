<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Shared Types

**Any type, interface, or enum that describes a domain entity or an API response shape belongs in `@theokallia/types`, not in this app.** The root `AGENT.md` says this too, but this is the file that gets read when working in `apps/web`, so it is stated here as well.

The rule, and how to tell which side of it a type falls on:

| Kind of type | Where it lives | Example |
| --- | --- | --- |
| Entity / response shape — what the API returns | `packages/types/src/<entity>.ts`, one file per model, re-exported from `packages/types/src/index.ts` | `Product` in `packages/types/src/product.ts`, `Order` in `packages/types/src/order.ts`, `Asset` in `packages/types/src/asset.ts` |
| Enum or union shared by more than one app | `packages/types/src/enums.ts` | `CouponType`, `ModerationStatus`, `SubscriberTag` |
| Generic envelope | `packages/types/src/common.ts` | `Paginated<T>` |
| Request body — what this app *sends* | local to the hook or module that sends it | the coupon payload in `apps/web/lib/hooks/use-coupons.ts` |
| Web-only projection — a subset the storefront needs | local to the web hook | `CouponValidationResult` in `use-coupons.ts`, `CartProduct` / `CartItem` in `use-cart.ts` |

Read the existing files before adding one: `packages/types/src/product.ts` and `packages/types/src/asset.ts` for the shared style, `apps/web/lib/hooks/use-cart.ts` for the local style.

Import a shared type and re-export it from the local module, so consumers keep importing from one place:

```ts
import type { SiteConfig } from '@theokallia/types'

export type { SiteConfig } from '@theokallia/types'
```

Never redeclare a type that already exists in `@theokallia/types`, and never mirror one type across `apps/api`, `apps/web`, and `apps/admin`. The API side keeps using the Prisma-generated types from `@prisma/client` for entity shapes — it does not import entity shapes from `@theokallia/types`.

When a new entity or response shape is needed, add it to `packages/types` first, then import it here. A type that only this app uses is not shared — leave it local.
