# Playbook: Add a New Feature

> **Purpose:** The exact, ordered steps to add a brand-new feature (a new screen/resource, e.g. "returns") to this frontend, following the same conventions as the existing ten feature folders. Written so a human can review each step before it happens and an agent can execute it directly.
>
> **Related docs:** `../architecture/feature-conventions.md` (the shape being followed) · `../architecture/data-fetching-and-state.md` (React Query patterns) · `../ui/component-library.md` (reuse before building) · sibling backend's `brain/playbooks/add-a-new-module.md` (this feature's counterpart on the API side — build that first if the endpoint doesn't exist yet)

**Worked example used throughout:** adding a `returns` feature, paired with the backend's worked example in its own playbook.

---

## Step 0 — Confirm the API Exists

This app has no mock layer. Before writing any frontend code, confirm (or arrange with whoever owns the backend) that the endpoints exist: base path, every route + method, request body shape, response DTO shape. If they don't exist yet, that's the backend's `brain/playbooks/add-a-new-module.md`, not this one — get it built first, or work from an agreed contract if building both sides together.

## Step 1 — Add the DTO Types

In `src/types/index.ts`, add the TypeScript interface(s) for the new resource, matching the backend's DTO shape field-for-field (same names, same nullability) — see `../domains/inventory.md` for what a well-matched pair of Prisma-model-to-TS-interface looks like. Don't invent frontend-only field names that don't exist in the API response; if a field needs local-only derived state, compute it in a component, not by inventing a phantom API field.

## Step 2 — Create the Feature Folder

`src/features/<name>/` with an `api.ts` first:

- [ ] One `async function` per endpoint, named after the action (`fetchReturns`, `createReturn`, not `getReturns`/`postReturn`).
- [ ] Request-body interfaces defined next to the functions that use them.
- [ ] If the resource supports pagination, both `fetch<X>()` and `fetch<X>Page(params)` — see `../architecture/feature-conventions.md`.
- [ ] Explicit return types on every function, using the types from Step 1.

## Step 3 — `hooks.ts`

Following `../architecture/data-fetching-and-state.md`:

- [ ] A query-key factory object (`returnKeys`) with `.all`, `.detail(id)`, `.page(params)` as needed.
- [ ] `use<X>()` / `use<X>Page(params)` query hooks — paginated ones get `placeholderData: (previousData) => previousData`.
- [ ] `use<X>(id)` detail query, `enabled: !!id`.
- [ ] `useCreate<X>()` / `useUpdate<X>()` / `useDelete<X>()` mutation hooks — each invalidates `returnKeys.all` **and** any other feature's keys whose derived data this write affects (check `../domains/*.md` files for existing cross-invalidation examples, like inventory's three-way invalidation).
- [ ] Any status-transition action gets its own `useTransition<X>()`-style hook, mirroring the sales/purchases one-hook-per-transition pattern.

## Step 4 — Build the Screens

Reuse `../ui/component-library.md` components before writing new markup:

- [ ] `<Name>ListPage.tsx` — `PageHeader` + `useTableQuery()` + `use<X>Page(...)` + `Table<X>` with a `Column<X>[]` definition + `Pagination`.
- [ ] Create/edit: a `<Name>FormModal.tsx` (wrap `Modal`) for a simple single-object resource, or a `<Name>FormPage.tsx` for a multi-line-item resource (mirror `SaleFormPage`/`PurchaseFormPage` if so) — use `SearchableCombobox` for any picker over a fetched resource (customer, product, vendor, etc.), not a plain `Select`.
- [ ] If the resource has enough data to warrant its own screen: `<Name>DetailPage.tsx`.
- [ ] If the resource has a status/lifecycle: a local `statusBadge.tsx` mapping status → `Badge`, and detail-page action buttons gated by current status (mirror the tables in `../domains/sales.md`/`../domains/purchases.md`).
- [ ] Delete actions go through `ConfirmModal`, never a native `confirm()`.

## Step 5 — Wire the Route

In `src/app/routes.tsx`:
1. Import the new page component(s).
2. Add `<Route>` entries inside the `<ProtectedRoute><AppShell /></ProtectedRoute>` group (or `<AdminRoute>` if it should be admin-only — see `../architecture/auth-and-routing.md`).
3. Order a resource's routes so more specific paths (`/returns/new`) come before parameterized ones (`/returns/:id`) sharing a prefix.

## Step 6 — Add Navigation

Add a link in `src/components/layout/AppShell.tsx`'s nav if the feature should be reachable from the sidebar — a route with no nav entry is only reachable by direct URL, which is sometimes intentional (a nested "new" route) and sometimes a bug (forgetting a new top-level feature's nav link).

## Step 7 — Write Its Domain Doc

Create `brain/domains/<name>.md` following `../GOLDEN_RULES.md` Rule 10's shape: screens table → DTO shapes → state machine (if any) → API calls → invalidation notes → link to the matching backend domain doc. Use `domains/sales.md` as the template if it has a lifecycle, or `domains/inventory.md` if it's closer to plain CRUD.

## Step 8 — Update the Map

Add a row for the new domain doc to `brain/README.md`'s "Where to Start" and "The Map" tables, in the same change.

## Verification Checklist Before Calling It Done

- [ ] `npm run build` type-checks with no errors.
- [ ] `npm run lint` passes.
- [ ] Every mutation invalidates every query key its write could stale, including other features' derived data (see Step 3).
- [ ] Every destructive action uses `ConfirmModal`.
- [ ] The new domain doc and `brain/README.md`'s map are updated in this same change.
- [ ] DTO types in `src/types/index.ts` still match the backend's actual response shape — spot-check against the backend's `brain/database/schema-overview.md` if unsure.
