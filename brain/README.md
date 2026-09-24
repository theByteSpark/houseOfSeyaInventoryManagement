# House of Seya — Frontend Brain

> **Purpose:** Entry point to this repo's engineering knowledge base. Read this first — human or agent — before changing architecture or adding a feature.
>
> **How the Brain is written and organized:** `GOLDEN_RULES.md`. Every doc in `brain/` — new or edited — answers to that file.
>
> **Sibling repo:** the backend lives at `houseOfSeyaInventoryManagementBackend` and has its own `brain/` — its `database/schema-overview.md` is the source of truth for the DB this app's data ultimately comes from.

## What This Repo Is

A React 19 + TypeScript + Vite single-page app for House of Seya's inventory, sales, and purchasing operations. It talks to the Express API in the sibling backend repo over `VITE_API_URL`. If you're asking "how do I run this" or "where does feature X live," this Brain is the shortcut. The code in `src/` is always the final source of truth — see `GOLDEN_RULES.md` Rule 8 on drift.

## Where to Start, By Task

| I want to... | Read |
|---|---|
| Understand the stack, folder layout, and how routing/providers wire together | `foundation/overview.md` |
| Run this locally, set env vars, build/lint | `foundation/setup.md` |
| Understand the feature-folder shape (`api.ts` / `hooks.ts` / `*Page.tsx` / `*Modal.tsx`) | `architecture/feature-conventions.md` |
| Understand React Query usage, query keys, cache invalidation, `useTableQuery` | `architecture/data-fetching-and-state.md` |
| Understand login, token refresh, protected/admin routes | `architecture/auth-and-routing.md` |
| Know which shared component to reuse instead of building a new one | `ui/component-library.md` |
| See the DTO shapes this app expects from the API, per feature area | `domains/inventory.md`, `domains/sales.md`, `domains/purchases.md` |
| Manage the Metal/Diamond-Shape/Diamond-Quality picklists | `domains/inventory.md` (`AttributeOptionsPage`, `src/features/attributes/`) |
| Record what a customer is asking about (no pricing) | `domains/enquiries.md` |
| **Build a brand-new feature end to end** | `playbooks/add-a-new-feature.md` |

## The Map

| Doc | Answers |
|---|---|
| `GOLDEN_RULES.md` | How every Brain doc must be written, sized, and kept in sync with code |
| `foundation/overview.md` | Stack, folder layout, provider tree, routing model |
| `foundation/setup.md` | Env vars, `npm run dev`/`build`/`lint`/`preview` |
| `architecture/feature-conventions.md` | The `api.ts → hooks.ts → *Page.tsx/*Modal.tsx` shape every feature follows |
| `architecture/data-fetching-and-state.md` | React Query keys/invalidation, `useTableQuery`, `apiClient`'s token-refresh interceptor |
| `architecture/auth-and-routing.md` | `AuthProvider`, `ProtectedRoute`/`AdminRoute`, the full route table |
| `ui/component-library.md` | Every component in `src/components/ui/` and when to use it |
| `domains/inventory.md` | Products (as jewelry cost sheets)/categories/subcategories/stock/attribute options — screens and DTO shapes |
| `domains/sales.md` | Sale list/form/detail, invoice PDF — screens and DTO shapes |
| `domains/purchases.md` | Purchase list/form/detail, vendor invoice fields, inline product creation, receiving items — screens and DTO shapes |
| `domains/enquiries.md` | Recorded customer interest, no pricing — screens and DTO shape |
| `playbooks/add-a-new-feature.md` | The exact steps to add a new feature: types → api → hooks → page → route → nav |

## Where We Stand

**Current situation:** The app covers auth (login/forgot-password), a dashboard (with an "Add enquiry" quick action), customers, inventory (categories/subcategories/products — each a full jewelry cost sheet with Metal/Diamond/Labour sections, restock, and low-stock filtering), sales (list/create/edit/detail/PDF invoice), vendors, purchases (list/create/edit/detail/receive, vendor invoice fields, inline new-product creation), reports, enquiries (pricing-free recorded customer interest), admin-only user management, and admin-only attribute-option management (Metal Type/Diamond Shape/Diamond Quality picklists). Every list screen uses the same paginated-table pattern (`useTableQuery` + a `use<X>Page` React Query hook); `ProductFormPage`/`SaleFormPage`/`PurchaseFormPage` are full pages (multi-section, repeatable-line-item forms), while `EnquiryFormModal` stayed a modal despite its own repeatable diamond list, since it has no computation driving it toward a full page. This Brain was written by walking the actual code in `src/` as of the features listed above.

**Near-term ask:** Use this Brain when reviewing or extending the app — especially `playbooks/add-a-new-feature.md` for new screens and `architecture/feature-conventions.md` before writing a new `api.ts`/`hooks.ts` pair, so new work matches existing conventions instead of introducing a second pattern.

**Long-term goal:** Let anyone — a new contributor or an agent picking this up cold — understand the app's shape and safely extend it without reverse-engineering it from scratch each time, and keep that understanding accurate as the app grows (`GOLDEN_RULES.md` Rule 8).
