# @theokallia/web — Rules
> Next.js Frontend Hard Constraints
> Version: 1.0
> Status: Active

## Component Rules
- Push `'use client'` as deep as possible.
- Always `<Image>` not `<img>`.
- Always `<Link>` not `<a>` for internal links.
- Use `cn()` from `@/lib/utils`.
- Child components that need the current product slug receive it as a prop; never call `useParams()` internally.

## State Management
- Guest cart state lives in `useGuestCartStore`; never read localStorage directly in components.
- Guest wishlist state lives in `useGuestWishlistStore`; never read localStorage directly in components.
- Authenticated cart state lives in React Query `['cart']` cache.
- Authenticated wishlist state lives in React Query `['wishlist']` cache.
- `useGuestCartStore.getState().addItem()` is the correct pattern for calling Zustand store actions inside `mutationFn`.
- `useGuestWishlistStore.getState().toggleItem()` is the correct pattern.
- `hydrate` in `guest-cart-store.ts` is async; always call with `void hydrate()` in `useEffect`.
- `hydrate` in `guest-wishlist-store.ts` is sync; call without `void`.

## Data Fetching
- All API calls go through `lib/api.ts`; never raw `fetch` in hooks or stores.
- Use React Query for all data fetching: `useQuery` for reads, `useMutation` for writes.
- Query keys for lists: `JSON.stringify(filters)`; never raw object.
- Load More pagination uses `useInfiniteQuery`.

## Shop & Filters
- Filter state lives in URL params, not `useState`.
- `ShopPage` is a simple server component; no `searchParams`, no filter parsing, no props to `ProductGrid`.
- `ProductGrid` reads filters from `useSearchParams` + `useMemo`; never pass filters as props.

## Wishlist Toast Rules
- `useToggleWishlist(isAuthenticated, true)` passes `silent=true` when the caller fires its own toast.
- Toast fires in `onMutate` (authenticated) or `mutationFn` (guest); never in `onSuccess` for instant feedback.
- `useRemoveWishlistItem` does not fire a success toast; the caller controls it.
- `ProductInfo` receives full `product: Product` object, not individual string props.

## Proxy
- Proxy must have `cache: 'no-store'`.
- Proxy must forward `req.nextUrl.search`.
- `API_VERSION` comes from `lib/api.ts`; never hardcode.

## Styling
- No semicolons, single quotes, 2-space indent.
- No Tailwind utility classes like `bg-primary`; use `bg-[#7E22CE]` or CSS vars.
- No border-radius anywhere; `--radius: 0rem` always.
- Font classes: `font-cormorant-garamond`, `font-le-jour`, `font-allure`.
- pnpm only.

## Naming Conventions
| Thing | Convention | Example |
|---|---|---|
| Files | kebab-case | `product-card.tsx`, `auth-client.ts` |
| React components | PascalCase | `ProductCard`, `AuthModal` |
| Variables/functions | camelCase | `handleClick`, `fetchProducts` |
| Types/Interfaces | PascalCase | `Product`, `RegisterDto` |

## Comments
- JSDoc for exported functions, hooks, service methods, store actions describes what, not how.
- Inline comments for non-obvious logic, important decisions, and gotchas only.
- Never comment code that obviously explains itself.
- Never use long separator lines or section dividers inside functions.
- No `// section` divider headers inside function bodies.
