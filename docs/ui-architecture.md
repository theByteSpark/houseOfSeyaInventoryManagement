# UI Architecture Changes

Status: proposal — companion to the backend
[`db-architecture.md`](../../houseOfSeyaInventoryManagementBackend/docs/db-architecture.md).
Describes the frontend changes needed to match the new API surface: flattened
category, removed invoicing, 4-tier warehouse-scoped roles, and new
warehouse/notifications/import-export/settings modules.

## 1. Current structure (as-is)

```
src/
  app/routes.tsx            route table
  components/layout/        AppShell (nav), ProtectedRoute, AdminRoute
  features/
    auth/
    dashboard/
    customers/
    inventory/               Products, Categories, Subcategories
    sales/                   List, Form, Detail, InvoicePdfModal
    purchases/
    vendors/
    reports/
    users/
  types/index.ts             Role = 'ADMIN' | 'STAFF'
```

Each feature folder follows the same pattern: `api.ts` (fetch calls),
`hooks.ts` (react-query hooks), `*ListPage.tsx`, `*FormModal.tsx` /
`*FormPage.tsx`. New modules should follow this same pattern for
consistency — no new architecture needed, just more folders shaped like the
existing ones.

## 2. Changes to existing features

### 2.1 Remove Subcategory (`src/features/inventory/`)

- Delete `SubcategoriesPage.tsx`, `SubcategoryFormModal.tsx`.
- `CategoryFormModal.tsx`, `CategoriesPage.tsx`: unchanged (category itself
  isn't going away).
- `ProductFormModal.tsx`: replace the category→subcategory cascading
  `SearchableCombobox` pair with a single category `SearchableCombobox`
  bound to `categoryId` (mirrors how `categoryId` cascades to
  `subcategoryId` today, just remove the second level).
- `ProductsListPage.tsx`: drop the subcategory column/filter; keep category
  column/filter (rename any `subcategoryName` display to `categoryName`).
- `features/inventory/api.ts` / `hooks.ts`: remove
  `listSubcategories`/`createSubcategory`/etc. and their hooks; update
  `Product` request/response types to use `categoryId`/`categoryName`
  directly instead of nested `subcategory.category`.
- `src/app/routes.tsx`: remove `/inventory/subcategories` route.
- `AppShell.tsx`: remove the "Subcategories" nav item from the `products`
  group (keep Products, Categories).
- `src/types/index.ts`: update `Product` type — drop `subcategoryId`/
  `subcategoryName`, keep/add `categoryId`/`categoryName` directly on it.

### 2.2 Remove invoice/PDF generation (`src/features/sales/`)

- Delete `InvoicePdfModal.tsx`.
- `SaleDetailPage.tsx`: remove "View / download invoice" button and the
  `<InvoicePdfModal>` usage. Keep the "Issue invoice" action as-is — it
  means "mark sale as ISSUED" (a status transition), which is a separate
  concern from PDF rendering; only the PDF path is removed, per backend doc
  §1/§3.7.
- `SalesListPage.tsx`: same — remove the "View / download invoice" row
  action and `pdfSale` state/modal wiring; keep "Issue invoice" if it maps
  to the sale-status transition, not the PDF.
- `features/sales/api.ts`: remove `getInvoicePdf` (or equivalent) call.

### 2.3 Role model (`src/types/index.ts`, `AdminRoute.tsx`, `AppShell.tsx`)

Backend `Role` is now `USER | ADMIN | COMPANY_ADMIN | SUPER_ADMIN`. Warehouse
assignment is **not** a field on `User` — the backend models it as a
separate `UserWarehouse` mapping table (see backend doc §3.0), so the
frontend `User` type stays unchanged aside from the widened `Role` union.
The API response for the logged-in user (`/auth/me` or equivalent) includes
the mapped warehouse as a nested object when present:

```ts
// src/types/index.ts
export type Role = 'USER' | 'ADMIN' | 'COMPANY_ADMIN' | 'SUPER_ADMIN';

export interface User {
  // ...existing fields...
  role: Role;
  warehouse: { id: string; name: string } | null; // from UserWarehouse mapping; null for COMPANY_ADMIN/SUPER_ADMIN
}
```

- **`AdminRoute.tsx`** currently gates on `role !== 'ADMIN'`. Generalize to a
  configurable `allowedRoles` prop so it can protect different routes at
  different tiers without a new component per tier:

  ```tsx
  export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
    const { user } = useAuth();
    if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />;
    return <>{children}</>;
  }
  ```

  `/users` → `roles={['ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']}` (ADMIN
  manages users within their own warehouse; company/super admin see all).
  `/warehouses`, `/settings` → `roles={['COMPANY_ADMIN', 'SUPER_ADMIN']}`
  only.

- **`AppShell.tsx`**: nav group visibility switches from a single
  `user?.role === 'ADMIN'` check to role-tier checks, e.g.:

  ```ts
  const isWarehouseAdmin = user?.role === 'ADMIN';
  const isCompanyLevel = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';
  ```

  `adminNavGroup` (Users) shown for `isWarehouseAdmin || isCompanyLevel`.
  New `companyNavGroup` (Warehouses, Settings) shown only for
  `isCompanyLevel`.

- User's warehouse should render somewhere visible for `USER`/`ADMIN`
  accounts — e.g. under the name/role block in the sidebar footer
  (`{user?.warehouse?.name}` under the role label), since all their data is
  scoped to it.

- **`UserFormModal.tsx` / `users/api.ts`**: add `role` options for the two
  new tiers and a `warehouseId` `SearchableCombobox` (submitted separately
  as the user↔warehouse mapping, not a field on the user record itself)
  that's required when role is `USER`/`ADMIN` and hidden/disabled when
  `COMPANY_ADMIN`/`SUPER_ADMIN` is selected (mirrors existing conditional-
  field patterns already used elsewhere, e.g. category→subcategory today).

### 2.4 Warehouse-scoped data views

Once the backend filters warehouse-scoped roles' queries by the caller's
mapped warehouse (via `UserWarehouse`, per backend doc §3.0), most existing
list pages (`ProductsListPage`, purchases, sales) need **no client-side
filtering change** — the API already returns only what the user can see.
The only UI addition: `COMPANY_ADMIN`/`SUPER_ADMIN` views that aggregate
across warehouses may want a warehouse filter/column, added per-page as
those roles' needs are defined (not required for v1).

### 2.5 Product stock moves from a flat field to per-warehouse (`src/features/inventory/`)

Backend removes `Product.quantityInStock` entirely (§3.1/§3.2 of the backend
doc) — quantity is stored only per warehouse on `ProductStock`. This touches
every place the frontend currently reads that flat field:

- `src/types/index.ts`: `Product.quantityInStock: number` is replaced. For
  warehouse-scoped roles (`USER`/`ADMIN`), the API returns the single
  quantity for their own warehouse; keep the field name `quantityInStock`
  on the DTO for minimal frontend churn, but document that it now means
  "quantity at the caller's warehouse," not a cross-warehouse total. For
  `COMPANY_ADMIN`/`SUPER_ADMIN`, add an optional
  `stockByWarehouse?: { warehouseId: string; warehouseName: string; quantity: number }[]`
  for views that need the breakdown.
- `ProductFormModal.tsx`: the "initial quantity" field on create still makes
  sense (creates the first `ProductStock` row for the acting user's
  warehouse), but on edit it should not silently edit a specific warehouse's
  quantity — either hide the field on edit (use "Restock" for quantity
  changes, as today's `RestockModal.tsx` already does) or, for
  company-level roles, require an explicit warehouse selection first.
- `RestockModal.tsx`: for `USER`/`ADMIN`, restocking implicitly targets
  their own warehouse (no UI change needed beyond the label). For
  `COMPANY_ADMIN`/`SUPER_ADMIN`, add a warehouse `SearchableCombobox` to the
  modal since there's no longer a single implicit warehouse to restock.
- `ProductsListPage.tsx`: `p.quantityInStock` / low-stock highlighting
  (`p.quantityInStock <= p.reorderLevel`) keeps working unchanged for
  warehouse-scoped roles reading their own-warehouse quantity; for
  company-level roles viewing across warehouses, either show an aggregate
  total (sum) with a tooltip/expand for the per-warehouse breakdown, or add
  a warehouse filter dropdown to the toolbar and keep the single-quantity
  column.
- `dashboard`'s `lowStockProducts` (in `src/types/index.ts`) similarly
  becomes warehouse-scoped for `USER`/`ADMIN` and aggregate for company-level
  roles — no structural change to the `DashboardPage.tsx` tile rendering,
  just what the API feeds it.

## 3. New features

Each follows the existing `api.ts` / `hooks.ts` / `*ListPage.tsx` /
`*FormModal.tsx` pattern used by `vendors`/`customers` — no new UI framework
needed.

### 3.1 Warehouse management — `src/features/warehouses/`

- `WarehousesListPage.tsx`, `WarehouseFormModal.tsx` — CRUD (name, code,
  address, isActive), modeled directly on `VendorsListPage.tsx` /
  `VendorFormModal.tsx`.
- Route: `/warehouses`, gated to `COMPANY_ADMIN`/`SUPER_ADMIN` via
  `RequireRole`.
- Nav: new `companyNavGroup` item.

### 3.2 Notifications — `src/features/notifications/`

- A bell icon + unread-count badge in `AppShell.tsx` header (desktop
  sidebar footer area and mobile top bar), opening a dropdown/panel listing
  recent `Notification` rows, polling `GET /notifications` on an interval
  (react-query `refetchInterval`, no websocket for v1 per backend doc).
- `NotificationsPanel.tsx` (dropdown, not a full page) is enough for v1; a
  dedicated `/notifications` page is optional if history is expected to
  grow long.
- Mark-as-read on open/click, calling existing-shape update endpoint.

### 3.3 Import/Export — surfaced inline, not a standalone page

- Add "Import" / "Export" buttons to the toolbar of `ProductsListPage.tsx`
  (and `CustomersListPage.tsx`/`VendorsListPage.tsx` if in scope) —
  Export triggers a file download from the existing list endpoint with a
  `?format=csv` param or a dedicated export route; Import opens a small
  modal with a file input + a results summary (rows created/failed) after
  submit.
- No new route needed; this is additive UI on existing list pages, not a
  new feature folder.

### 3.4 Settings — `src/features/settings/`

- `SettingsPage.tsx` — form(s) over the `Setting` key/value store (currency,
  tax rate, default low-stock threshold, company profile). Single page,
  simple form, matches backend's generic key/value model rather than one
  page per setting.
- Route: `/settings`, gated to `COMPANY_ADMIN`/`SUPER_ADMIN`.
- If `FeatureFlag` toggles are exposed in UI (optional, dev-facing), add a
  `SUPER_ADMIN`-only section on the same page rather than a separate route.

### 3.5 Dashboard enhancements

`DashboardPage.tsx`/`dashboard/api.ts` already exist — extend with
low-stock/warehouse summary tiles once the backend dashboard aggregation
endpoint is built (per backend doc). No structural change, just more
`StatTile` cards and possibly a per-warehouse breakdown table for
company-level roles.

## 4. Non-goals for this pass

- Real-time stock updates via websocket/SSE — v1 notifications and stock
  views are polling-based (react-query `refetchInterval`), matching the
  backend's phased approach.
- A dedicated multi-page import/export wizard — v1 is a modal + toolbar
  button per list page.
- Per-warehouse dashboards beyond simple aggregation — deferred until
  company-level reporting needs are defined.
