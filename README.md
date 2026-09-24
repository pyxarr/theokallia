# THEOKALLIA
> Divine Beauty

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)

Full-stack luxury jewellery e-commerce platform for a Nigerian jewellery brand.

## 📦 Monorepo Structure
```text
apps/
├── api/        NestJS REST API, Prisma schema, mail queue, Redis, deployment Dockerfile
├── web/        Next.js storefront, app router, shared UI, client stores, proxy route
└── admin/      Planned custom admin dashboard
packages/
├── types/      Shared User/AuthUser types
└── db/         Stub only
```

## 🧰 Prerequisites
- Node.js
- pnpm only
- Git

## 🚀 Getting Started
```bash
git clone https://github.com/pyxarr/theokallia.git
pnpm install
```

1. Set `@theokallia/api/.env` and `@theokallia/web/.env.local`.
2. Run the API on port `3333`.
3. Run the frontend on port `3000`.
4. Open Swagger UI at `localhost:3333/docs`.

## 🗂️ Apps
| App | Description | README |
|---|---|---|
| `@theokallia/api` | NestJS backend for auth, users, categories, products, reviews, cart, wishlist, orders, payments, and upload | [`apps/api/README.md`](apps/api/README.md) |
| `@theokallia/web` | Next.js storefront for the public shop, cart, wishlist, product pages, and proxy route | [`apps/web/README.md`](apps/web/README.md) |
| `apps/admin` | Planned custom admin dashboard | Not yet available |

## 📚 Documentation
| Document | Link |
|---|---|
| AGENT.md | [`AGENT.md`](AGENT.md) |
| docs/prd.md | [`docs/prd.md`](docs/prd.md) |
| docs/plan.md | [`docs/plan.md`](docs/plan.md) |
| docs/architecture.md | [`docs/architecture.md`](docs/architecture.md) |
| @theokallia/api/docs/architecture.md | [`apps/api/docs/architecture.md`](apps/api/docs/architecture.md) |
| @theokallia/api/docs/rules.md | [`apps/api/docs/rules.md`](apps/api/docs/rules.md) |
| @theokallia/web/docs/architecture.md | [`apps/web/docs/architecture.md`](apps/web/docs/architecture.md) |
| @theokallia/web/docs/rules.md | [`apps/web/docs/rules.md`](apps/web/docs/rules.md) |

## 🛠️ Tech Stack
TypeScript, Next.js 16, NestJS, Prisma, Neon PostgreSQL, Upstash Redis, BullMQ, React Query, Zustand, Tailwind v4, Shadcn UI, Vercel, Render, Cloudinary, Paystack.

Built by Uke — Pyxarr

GitHub: https://github.com/pyxarr/theokallia.git
