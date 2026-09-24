# @theokallia/api — Rules
> NestJS Backend Hard Constraints
> Version: 1.0
> Status: Active

## Guards & Auth
- Use `@Session()` from `@thallesp/nestjs-better-auth` for authenticated handlers.
- Use `@AllowAnonymous()` for public endpoints.
- Use `session.user.id` as the authenticated user identity.
- Use `session.user.role` for admin checks.
- Admin routes use `@UseGuards(RolesGuard)` + `@Roles('admin')`.
- `@Roles()` is exported from `auth/guards/roles.guard.ts`.

## DTOs
- All DTOs use `class-validator` decorators.
- `confirmPassword` never appears in a DTO; it is frontend-only via Zod.

## Database
- Multi-step DB operations must use `prisma.$transaction`.
- Use callback form `prisma.$transaction(async (tx) => { ... })` when `await` is needed inside; array form does not support this.

```ts
// correct
this.prisma.client.product.findMany(...)

// wrong — will throw
this.prisma.product.findMany(...)
```

- `PrismaService` uses `.client` getter; always write `this.prisma.client.xyz`.
- `PrismaService` and `RedisService` are `@Global()`; never import their modules in feature modules.

## Modules
- Every module needs `.module.ts`, `.controller.ts`, `.service.ts`, `dto/`.
- Prisma lives in `@theokallia/api/prisma/`; never `@theokallia/db`.

## Email
- Mail via BullMQ only; never call `nodemailer.sendMail()` directly.
- Verification and password reset use link jobs only.

## Imports & Types
- `VersioningType` imports from `@nestjs/common`, not `@nestjs/core`.
- `Record<K, V>` always needs both type arguments; never use `as Record<K>` casting.

## Validation
- Keep `enableImplicitConversion: true` in `ValidationPipe`; without it `minPrice`/`maxPrice` arrive as strings.

## Comments
- JSDoc for exported functions, hooks, service methods, store actions describes what, not how.
- Inline comments for non-obvious logic, important decisions, and gotchas only.
- Never comment code that obviously explains itself.
- Never use long separator lines or section dividers inside functions.
- No `// section` divider headers inside function bodies.
