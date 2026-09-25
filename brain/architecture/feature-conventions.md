# Feature Conventions

> **Purpose:** The exact shape every feature folder follows, so a new feature looks like the existing ten instead of inventing its own pattern.
>
> **Related docs:** `data-fetching-and-state.md` (the React Query patterns used inside `hooks.ts`) · `../playbooks/add-a-new-feature.md` (step-by-step build recipe using this shape)

---

## The Shape

Every feature lives at `src/features/<name>/` and holds some subset of these files — not every feature needs every file, but every file that exists follows this role:

| File | Role | Imports from | Never imports from |
|---|---|---|---|
| `api.ts` | Every Axios call for this feature, plus the request/response TS types specific to it | `@/lib/apiClient`, `@/types` | React, React Query |
| `hooks.ts` | React Query wrappers (`useQuery`/`useMutation`) around `api.ts` | `@tanstack/react-query`, `./api` | `apiClient` directly |
| `<Name>ListPage.tsx` | The table/list screen: search box, sort headers, pagination controls, row actions | `./hooks`, `@/lib/useTableQuery`, `@/components/ui/*` | Other features' internals |
| `<Name>FormModal.tsx` / `<Name>FormPage.tsx` | Create/edit form — a modal for simple resources (categories, vendors), a full page for multi-line resources (sales, purchases) | `react-hook-form`, `zod`, `./hooks` | |
| `<Name>DetailPage.tsx` | Read-only detail view for a resource with enough data to not fit a list row (sales, purchases) | `./hooks` | |
| `hooks.ts` co-located helpers (e.g. `statusBadge.tsx`) | Small feature-local presentational helpers not generic enough for `components/ui/` | | |

**Rule:** a component never calls `apiClient` directly and never calls another feature's `api.ts` — it goes through its own feature's `hooks.ts`. If screen A genuinely needs feature B's data (e.g. the sales form needs a product picker), it imports feature B's *hooks*, not its internals.

## `api.ts` Conventions

- Export one `async function` per endpoint, named after the action (`fetchProducts`, `createProduct`, `restockProduct`) — not the HTTP verb.
- Export the request-body interface next to the function that uses it (`ProductInput`, `FetchProductsPageParams`) — these are hand-written to match the backend's Zod input schema and DTO output, not generated.
- A resource that supports both a full list and a paginated view exports both `fetch<X>()` and `fetch<X>Page(params)` — mirroring the backend's dual-mode list endpoint (see the backend's `architecture/error-handling-and-pagination.md`).
- Every function has an explicit return type (`Promise<Product>`, `Promise<PaginatedResult<Product>>`), pulled from `@/types`.

## `hooks.ts` Conventions

See `data-fetching-and-state.md` for the full React Query pattern (query keys, invalidation). The short version: one `use<X>` per query, one `use<Verb><X>` per mutation, and mutations invalidate every query key their write could affect — including a related resource's keys (e.g. creating a product invalidates category/subcategory counts too, since those show product/subcategory counts).

## Page/Modal Conventions

- List pages use `useTableQuery()` (see `data-fetching-and-state.md`) for page/search/sort UI state, and pass its output straight into the feature's `use<X>Page(params)` hook.
- A modal used for both create and edit takes an optional `initial`/resource prop; its submit handler branches on presence of an `id` to call the create vs. update mutation — see `CategoryFormModal.tsx` for the pattern.
- **Modal vs. full page is a complexity-tier decision, not a per-feature default.** A handful of scalar fields (a category, a vendor, a customer) is a modal. A resource with multiple sections and/or a repeatable line-item list is a full page at `/<feature>/new` and `/<feature>/:id/edit` — `SaleFormPage`/`PurchaseFormPage` (repeatable sale/purchase line items) and `ProductFormPage` (Design Number/Name/Subcategory + a Metal section + a repeatable Diamond section + Labour + a computed cost summary) are all in this tier. When a modal's field count and sections grow to that point, promote it to a page rather than letting the modal balloon — this is exactly what happened when `ProductFormModal` was retired in favor of `ProductFormPage`.
- **Repeatable rows inside a form use `useFieldArray`** when the form's scalar fields already run on `react-hook-form` (as `EnquiryFormModal`'s diamond wishlist does) — it composes with the same `zodResolver` schema for per-row validation and error messages. A form that never adopted RHF at all (`SaleFormPage`/`PurchaseFormPage` are plain `useState` throughout) instead manages its line-item array with plain `useState<DraftLine[]>` + manual add/update/remove functions — pick whichever matches the rest of that specific file's state management, don't mix the two within one form. Only reach for a repeatable list at all when the field can genuinely be more than one — `ProductFormPage`'s Diamond section used to be a `useFieldArray` and was flattened back to a single set of fields once it was clear a product has exactly one diamond block (see the backend's `brain/database/data-conventions.md` Rule 11).
- A resource whose lifecycle has states (Sale, Purchase) renders its status with a feature-local `statusBadge.tsx`, not the shared `Badge` component directly — the badge's color-per-status mapping is feature-specific business knowledge, kept next to the feature that owns it.

## Extracting a Form Used in More Than One Place

When the same form needs to appear in two different contexts with different surrounding fields — the product cost sheet is both its own standalone page (`ProductFormPage`) and embedded inside another feature's modal (`purchases/AddPurchaseProductModal`) — split it instead of duplicating it:

- **Schema + pure logic** (no JSX) goes in a plain `.ts` file in the *owning* feature (`inventory/productCostSheet.ts`: the zod schema, `computeCosts()`, small helpers). Each caller's own `useForm` schema is `.extend()`ed from the shared base with whatever extra fields that context needs (`ProductFormPage` adds `quantityInStock`/`reorderLevel`; the purchase modal adds `quantity`/`unitCost`).
- **Shared JSX** goes in a `.tsx` file next to it (`inventory/ProductCostSheetSections.tsx`), taking `register`/`control`/`errors`/`watched` as props. These props are typed loosely (`any`) rather than parameterized against react-hook-form's exact `FieldValues` generic — the two callers' full form shapes are different supersets of the same field *names*, and fighting RHF's `Path<T>` typing across that isn't worth it in an internal app. Each caller still renders its own additional fields and its own summary/submit area around the shared piece.
- The shared piece lives in whichever feature **owns** the concept (`inventory`, since a cost sheet is fundamentally a product concern) — the other feature (`purchases`) imports from it, never the reverse.
- Not every shared piece needs a whole file split — `useSubcategoryGroups()` (category→subcategory grouping for a `<Select>` with `<optgroup>`s) is a single small hook added straight to `inventory/hooks.ts` once a second caller (`enquiries/EnquiryFormModal.tsx`) needed the identical grouping `ProductCostSheetSections.tsx` already computed inline. Extract at the point a second real caller appears, not before — same "extract on the second use" instinct, scaled to the size of the thing being extracted.

## Bulk CSV/Excel Import — `CsvImportModal`

Products, Customers, Vendors, Sales, and Purchases each expose a bulk-import action from their `*ListPage.tsx`'s `PageHeader` `action` slot (a second `Button` — icon `Upload`, label "Import" — alongside the existing "Add X" button, both wrapped in `<div className="flex gap-2">`). This is one shared, generic modal, not five bespoke ones:

- `src/components/ui/CsvImportModal.tsx` — the shared modal (exported from `components/ui/index.ts` alongside its `CsvImportRowResult`/`CsvImportResult` types). Shows template-download buttons (CSV + Excel, hitting `GET <templateUrl>` / `GET <templateUrl>?format=xlsx`), a file input, an "Upload" button, and — once uploaded — an inline results view (created/updated/error count badges plus an error-detail table for failed rows). No toast — this app has no notification system, so the modal's own inline results view is the only feedback; it isn't wired to any query invalidation itself, callers do that via `onImported`.
- `src/features/import-export/api.ts` — a shared `uploadCsv(url, file)` helper (multipart `FormData`, no other params) plus one thin per-entity wrapper each (`importProductsCsv`, `importCustomersCsv`, `importVendorsCsv`, `importSalesCsv`, `importPurchasesCsv`) calling `uploadCsv('/import/<entity>', file)`.
- Each list page owns local `isOpen` state for the modal (same pattern as any other modal-triggering list page) and passes `templateUrl`/`templateFilename`/`onUpload`/`rowLabel`, plus `onImported` that invalidates that entity's `<x>Keys.all` query key so the table refreshes — the same invalidation convention every mutation already follows (`data-fetching-and-state.md`).
- `rowLabel(row)` picks whichever field off the backend's per-row result identifies that row in the error table (e.g. Products uses `designNumber`, Sales `saleNumber`) — falls back to `String(row.row)` (the row number) when that field is absent.

## Naming Conventions

- Feature folder names: lowercase, matching the backend module name where one exists 1:1 (`inventory`, `sales`, `vendors`, `purchases`, `customers`, `users`) — this makes "which frontend feature talks to which backend module" obvious without cross-referencing anything.
- Components: `PascalCase`, suffixed by role (`ListPage`, `FormModal`, `FormPage`, `DetailPage`).
- Hooks: `camelCase`, prefixed `use`.
- Query key factories (`productKeys`, `categoryKeys` in `hooks.ts`): one object per queried entity, with named methods (`.all`, `.detail(id)`, `.page(params)`) — see `data-fetching-and-state.md`.
