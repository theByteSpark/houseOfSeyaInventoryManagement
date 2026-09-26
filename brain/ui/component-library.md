# Shared Component Library

> **Purpose:** Every component in `src/components/ui/` and `src/components/layout/`, and when to reach for one instead of building a new one inline.
>
> **Related docs:** `../architecture/feature-conventions.md` (how pages/modals use these) · `../foundation/overview.md` (styling stack: Tailwind, no external component library)

---

## Rule First

Before writing a `<button>`, `<table>`, `<div className="modal...">`, or a status pill by hand inside a feature, check this list. All of these are exported from the single barrel `src/components/ui/index.ts` — import from `@/components/ui`, not the individual file paths.

## `components/ui/` — Feature-Agnostic Primitives

| Component | Purpose | Notes |
|---|---|---|
| `Button` | Standard button with variant/size props | Use for every clickable action; don't style a raw `<button>` per-feature |
| `IconButton` | Icon-only button (edit/delete row actions) | Pairs with `lucide-react` icons |
| `Input` | Text input with label + error message slot | Used with `react-hook-form` register |
| `Select` | Native `<select>` styled to match `Input` | For small, fixed option sets |
| `SearchableCombobox<T>` | Type-to-filter dropdown with keyboard nav (arrows/enter/escape), optional "Add new" action row | Use this instead of `Select` whenever the option list is a fetched resource (e.g. picking a customer, vendor, or product on a form) — see its `onAddNew` prop for the "create inline" pattern |
| `Badge` | Small colored label | Generic; feature-specific status colors live in each feature's own `statusBadge.tsx`, which wraps `Badge` — see `feature-conventions.md` |
| `Card`, `CardHeader`, `CardBody` | Generic bordered container with an optional header | Dashboard tiles, form sections |
| `StatTile` | A single number-with-label tile (e.g. "Total Products: 42") | Dashboard summary row |
| `Table<T>` | Generic sortable data table | Takes a `Column<T>[]` describing `key`/`header`/`render(row)`/`sortField`; pass `sortBy`/`sortDir`/`onSortChange` from `useTableQuery` to get clickable sortable headers for free. **This is the one table component — every list page uses it, never a hand-rolled `<table>`.** |
| `Pagination` | Page-number controls | Pairs with `useTableQuery`'s `page`/`setPage` |
| `EmptyState` | "Nothing here yet" placeholder with optional icon/action | Use instead of a bare "No data" text string |
| `Spinner`, `FullPageSpinner` | Loading indicators | `FullPageSpinner` for full-screen loads (e.g. `isInitializing` in auth), `Spinner` inline |
| `Modal` | Generic dialog shell (backdrop, close button, title slot) | Every `*FormModal.tsx` wraps its form in this. Optional `size?: 'md' \| 'xl'` prop, default `'md'` (`max-w-lg`) — pass `size="xl"` (`max-w-4xl`) for a form too wide for the default, like `AddPurchaseProductModal`'s embedded product cost sheet. Every pre-existing call site is unaffected since the prop is optional. |
| `ConfirmModal` | Yes/no confirmation dialog | Use for every destructive action (delete) — never a native `window.confirm` |
| `PageHeader` | Page title + optional action button/subtitle row | Top of every `*ListPage.tsx` |

## `components/layout/` — App Shell & Route Guards

| Component | Purpose |
|---|---|
| `AppShell` | The authenticated app's persistent chrome — sidebar navigation, top bar, renders the matched route via an `<Outlet />` |
| `ProtectedRoute` | Auth gate — see `../architecture/auth-and-routing.md` |
| `AdminRoute` | Auth + role gate — see `../architecture/auth-and-authorization.md` (backend) and `../architecture/auth-and-routing.md` (frontend) |

## When to Add a New Shared Component

Add to `components/ui/` only when a UI pattern repeats across **2+ features** — a one-off layout stays local to its feature folder (e.g. `sales/InvoicePdfModal.tsx` is sales-specific, not generic, so it lives in the feature, not `ui/`). Adding a component here means:

1. Create `src/components/ui/<Name>.tsx`, following the existing components' prop-naming style (`getOptionLabel`-style accessor props for generic list components, not hardcoded field names).
2. Export it from `src/components/ui/index.ts`.
3. Add its row to the table above in the same change.
