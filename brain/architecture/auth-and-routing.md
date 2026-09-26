# Auth & Routing

> **Purpose:** How the frontend tracks a logged-in session, and the full route table with its access rules.
>
> **Related docs:** `data-fetching-and-state.md` (`apiClient`'s refresh interceptor) · sibling backend's `brain/architecture/auth-and-authorization.md` (the token flow this consumes)

---

## Where the Access Token Lives

`src/lib/tokenStore.ts` holds the access token **in memory only** (a module-level variable, not `localStorage`/`sessionStorage`) — deliberately, to reduce XSS exposure of a token that's valid for the token's full lifetime. Consequence: a hard page refresh loses the in-memory token, which is why `AuthProvider` always calls `refreshSession()` on mount (using the httpOnly refresh cookie) rather than assuming the token survives a reload.

## `AuthProvider` (`src/features/auth/useAuth.tsx`)

State exposed via `useAuth()`: `user`, `isAuthenticated`, `isInitializing`, `login(email, password)`, `logout()`.

| Event | What happens |
|---|---|
| App mounts | `refreshSession()` fires once; on success sets the access token + user, on failure clears both. `isInitializing` is `true` until this settles — route guards must wait on it (see below), not just check `isAuthenticated`. |
| `login(email, password)` | Calls the API, sets token + user on success; throws on failure (caller's form shows the error via `extractErrorMessage`) |
| `logout()` | Calls the API to invalidate the server-side refresh token, then clears local token + user regardless of whether the API call succeeded (`finally` block) — a logout always logs the UI out locally even if the network call fails |

## Route Guards (`src/components/layout/`)

| Component | Rule | Redirects to |
|---|---|---|
| `ProtectedRoute` | Requires `isAuthenticated`; while `isInitializing`, renders nothing/a loading state instead of redirecting (avoids a flash-redirect to `/login` on a valid session that just hasn't finished refreshing yet) | `/login` |
| `AdminRoute` | Requires `isAuthenticated` **and** `user.role === 'ADMIN'` | `/` (or wherever a non-admin should land) |

**Rule for a new protected screen:** wrap it in `<ProtectedRoute>` inside `AppShell`'s route group (already applied to the whole authenticated section in `routes.tsx` — a new route added inside that `<Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>` block inherits it automatically). Only wrap in `<AdminRoute>` in addition if the screen should be admin-only, mirroring `/users`.

## Full Route Table (`src/app/routes.tsx`)

| Path | Component | Guard |
|---|---|---|
| `/login` | `LoginPage` | none (public) |
| `/forgot-password` | `ForgotPasswordPage` | none (public) |
| `/` | `DashboardPage` | Protected |
| `/customers` | `CustomersListPage` | Protected |
| `/inventory/products` | `ProductsListPage` | Protected |
| `/inventory/products/new` | `ProductFormPage` | Protected |
| `/inventory/products/:id/edit` | `ProductFormPage` | Protected |
| `/enquiries` | `EnquiriesListPage` | Protected |
| `/inventory/categories` | `CategoriesPage` | Protected |
| `/inventory/subcategories` | `SubcategoriesPage` | Protected |
| `/sales` | `SalesListPage` | Protected |
| `/sales/new` | `SaleFormPage` | Protected |
| `/sales/:id/edit` | `SaleFormPage` | Protected |
| `/sales/:id` | `SaleDetailPage` | Protected |
| `/vendors` | `VendorsListPage` | Protected |
| `/purchases` | `PurchasesListPage` | Protected |
| `/purchases/new` | `PurchaseFormPage` | Protected |
| `/purchases/:id/edit` | `PurchaseFormPage` | Protected |
| `/purchases/:id` | `PurchaseDetailPage` | Protected |
| `/reports` | `ReportsPage` | Protected |
| `/help` | `HelpPage` | Protected — the route itself has no admin gate; two of its sections self-filter by role instead (see `feature-conventions.md`'s Role-Based Partial Content note) |
| `/users` | `UsersListPage` | Protected + Admin |
| `/settings/attributes` | `AttributeOptionsPage` | Protected + Admin |
| `*` (anything else) | Redirect to `/` | — |

Note the `/sales/new` vs `/sales/:id/edit` vs `/sales/:id` ordering — more specific paths are declared before the general `:id` one, so React Router matches correctly (same principle as backend route ordering, see the backend's `module-conventions.md`).

## Adding a New Route

1. Add the page component's import and `<Route>` entry to `routes.tsx`, inside the `AppShell`/`ProtectedRoute` group unless it's a public auth screen.
2. Add a link to it in `AppShell`'s navigation (`src/components/layout/AppShell.tsx`) if it should appear in the sidebar/nav — a route with no nav entry is reachable only by direct URL, which is sometimes intentional (e.g. `/sales/new`) and sometimes a bug (forgetting the nav link for a new top-level screen).
3. If it's admin-only, wrap it in `<AdminRoute>` the way `/users` does.
