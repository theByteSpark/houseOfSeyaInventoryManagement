# Data Fetching & State

> **Purpose:** How server state (React Query), auth headers, and table UI state (search/sort/page) actually work — the shared machinery every feature builds on.
>
> **Related docs:** `feature-conventions.md` (where these get used inside a feature) · `auth-and-routing.md` (the token refresh detail)

---

## `apiClient` (`src/lib/apiClient.ts`)

One shared Axios instance, `baseURL` from `VITE_API_URL`, `withCredentials: true` (so the refresh-token cookie round-trips).

- **Request interceptor:** attaches `Authorization: Bearer <token>` from `tokenStore.getAccessToken()` on every request — no feature ever sets this header manually.
- **Response interceptor:** on a `401` that isn't already a retry and isn't hitting `/auth/*`, it calls `refreshAccessToken()` (deduped via a module-level `refreshPromise` so concurrent 401s trigger exactly one refresh call), retries the original request once with the new token, and clears the token (triggering a logout state) if refresh also fails.
- `extractErrorMessage(error, fallback)` — pulls the backend's `{ error: string }` body out of an Axios error; every feature's error-handling UI should use this instead of showing a raw Axios message.

## React Query Setup (`src/app/providers.tsx`)

`staleTime: 30_000` (30s) and `refetchOnWindowFocus: false` globally — data is treated as fresh for 30 seconds and doesn't refetch just because the tab regained focus. A feature that genuinely needs faster staleness overrides it per-query, not globally.

## Query Key Convention

Every feature's `hooks.ts` exports one key-factory object per queried entity:

```ts
export const productKeys = {
  all: ['products'] as const,
  detail: (id: string) => ['products', id] as const,
  page: (params: FetchProductsPageParams) => ['products', 'page', params] as const,
};
```

- `.all` — used for the unpaginated list query *and* as the invalidation target for "anything about products changed."
- `.detail(id)` — one entity.
- `.page(params)` — the full params object is part of the key, so different page/search/sort combinations cache independently (this is why `placeholderData: (previousData) => previousData` is used on paginated queries — see below — to avoid a loading flash when only the params change).
- A sub-resource gets its own method (`productKeys.movements(id)`) rather than a new top-level factory.

## Mutation → Invalidation Convention

Every `useMutation` invalidates every query key its write could stale, in `onSuccess`:

```ts
export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      queryClient.invalidateQueries({ queryKey: subcategoryKeys.all });
    },
  });
}
```

**Rule:** invalidate the obvious key (the entity you just wrote) *and* any derived-count key that reads it (a product write invalidates category/subcategory lists because those show `productCount`/`subcategoryCount`). Missing an invalidation is a common source of "I created it but the list still shows the old count" bugs — when adding a mutation, list every screen that displays a count or aggregate derived from this entity and invalidate its key too.

## Paginated List Pattern

Every paginated query uses `placeholderData: (previousData) => previousData` so changing page/sort/search shows the previous page's data (not a spinner) while the new page loads — this is what makes table interactions feel instant. Copy this option on every new `use<X>Page` hook.

## `useTableQuery` (`src/lib/useTableQuery.ts`)

The shared hook for a list page's local UI state — not a server-state hook, a client-state one:

| Returns | Purpose |
|---|---|
| `page`, `setPage` | Current page number |
| `pageSize`, `setPageSize` | Debounced-free, resets `page` to 1 on change |
| `searchInput`, `setSearchInput`, `handleSearchKeyDown` | The raw input value, updated on every keystroke |
| `search` | The **debounced** (1000ms default) value actually sent to the query — resets `page` to 1 when it changes |
| `sortBy`, `sortDir`, `toggleSort(field)` | Clicking a column: first click sorts ascending, second click reverses; switching columns resets to ascending |

A list page wires this straight into its paginated query: `useProductsPage({ page, pageSize, search, sortBy, sortDir, ...featureSpecificFilters })`. Feature-specific filters (like inventory's `stockFilter`) are separate `useState` outside this hook, passed alongside its output.
