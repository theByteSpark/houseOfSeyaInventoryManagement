# Domain: Inventory

> **Purpose:** The screens, DTO shapes, and API calls for products/categories/subcategories/stock — what this app expects the backend to return.
>
> **Related docs:** Backend's `brain/domains/inventory-and-stock.md` (the business rules behind these shapes) · `../architecture/feature-conventions.md` · feature: `src/features/inventory/`

---

## Screens

| Component | Route | Purpose |
|---|---|---|
| `ProductsListPage` | `/inventory/products` | Paginated product table, search, low-stock filter toggle, sort by name/design number/subcategory/selling price/stock/created |
| `ProductFormPage` | `/inventory/products/new`, `/inventory/products/:id/edit` | Full-page jewelry cost sheet — Design Number/Name/Subcategory, a Metal section, a repeatable Diamond section, a Labour section, Fixed Expense, a computed cost summary, and the Selling Price input. See "The Jewelry Cost Sheet Form" below. |
| `RestockModal` | (modal on `ProductsListPage`) | Add quantity + optional reason to an existing product |
| `CategoriesPage` | `/inventory/categories` | Paginated category table with subcategory counts |
| `CategoryFormModal` | (modal on `CategoriesPage`) | Create/edit a category |
| `SubcategoriesPage` | `/inventory/subcategories` | Paginated subcategory table, filterable by category, with product counts |
| `SubcategoryFormModal` | (modal on `SubcategoriesPage`) | Create/edit a subcategory |
| `AttributeOptionsPage` | `/settings/attributes` (admin-only) | Manage the Metal Type / Diamond Shape / Diamond Quality picklists — feature: `src/features/attributes/` |

## The Jewelry Cost Sheet Form

`ProductFormPage` is a full page, not a modal — see `../architecture/feature-conventions.md`'s Modal-vs-Page note. It's `react-hook-form` + `zodResolver`, with the Diamond section as a `useFieldArray` (0+ rows, each independently added/removed). Every cost figure (Metal Cost, each diamond row's Amount, Total Diamond Cost, Labour Charge, Total Cost, 3% Tax, Final Amount) is recomputed **live in this component** via a local `computeCosts()` helper as the user types — mirroring, field-for-field, the backend's `toProductDto()` formulas (see the backend's `brain/domains/inventory-and-stock.md`). This is a UI convenience only: the backend recomputes independently and is the authority on save, the same "duplicate a simple formula on both sides for instant feedback" precedent `SaleFormPage` already set with its hardcoded 10% tax preview.

Metal Type / Diamond Shape / Diamond Quality are `Select`s populated from `useAttributeOptions('METAL' | 'DIAMOND_SHAPE' | 'DIAMOND_QUALITY')` (`src/features/attributes/hooks.ts`). Because an admin can delete an option later (see the backend's `data-conventions.md` Rule 10), the form injects the record's *current* stored value as an extra option if it's missing from the fetched list (`withCurrentValue()` helper) — otherwise editing an old product whose metal/shape/quality was since removed from the picklist would silently blank that field.

Selling Price is the one field that is **not** computed — required manual entry, shown right below the computed Final Amount as a reference.

## DTO Shapes Consumed (from `src/types/index.ts`)

```ts
type AttributeType = 'METAL' | 'DIAMOND_SHAPE' | 'DIAMOND_QUALITY';
interface AttributeOption { id: string; type: AttributeType; label: string; sortOrder: number; }
interface ProductDiamond {
  id?: string; shape: string; quality: string; pieces: number;
  caratWeight: number; weight: number; rate: number; amount?: number;
}
interface Product {
  id: string; designNumber: string; name: string;
  metalType: string | null; grossWeight: number | null; metalRatePerGram: number | null; metalCost: number;
  diamonds: ProductDiamond[]; totalDiamondCost: number;
  makingChargePerGram: number | null; labourCost: number; fixedExpense: number;
  totalCost: number; taxAmount: number; finalAmount: number; sellingPrice: number;
  quantityInStock: number; reorderLevel: number;
  subcategoryId: string | null; subcategoryName: string | null;
  categoryId: string | null; categoryName: string | null; createdAt: string;
}
interface Category { id: string; name: string; subcategoryCount: number; }
interface Subcategory { id: string; name: string; categoryId: string; categoryName: string; productCount: number; }
interface StockMovement { id: string; productId: string; type: 'RESTOCK' | 'SALE' | 'ADJUSTMENT'; quantity: number; reason: string | null; createdAt: string; }
```

`sellingPrice`, `metalCost`, `totalDiamondCost`, `labourCost`, `totalCost`, `taxAmount`, `finalAmount`, and each diamond's `amount` all arrive as plain `number`s, computed server-side on every read — never sent by the client as part of a write (see the backend's `data-conventions.md` Rule 2 and the jewelry-costing section of its `domains/inventory-and-stock.md`). `categoryId`/`categoryName` on `Product` are flattened from a two-level backend `include` — the frontend never has to walk `subcategory.category.name` itself.

## API Calls (`src/features/inventory/api.ts`)

| Function | Endpoint |
|---|---|
| `fetchProducts()` / `fetchProductsPage(params)` | `GET /inventory/products` (unpaginated / paginated, `stockFilter: 'all' \| 'low'`) |
| `fetchProduct(id)` | `GET /inventory/products/:id` |
| `createProduct(input)` / `updateProduct(id, input)` / `deleteProduct(id)` | `POST` / `PATCH` / `DELETE /inventory/products/:id` — `input.diamonds` is the full replacement list of diamond rows, sent wholesale on every save |
| `restockProduct(id, quantity, reason?)` | `POST /inventory/products/:id/restock` |
| `fetchStockMovements(productId)` | `GET /inventory/products/:id/movements` |
| `fetchCategories()` / `fetchCategoriesPage(params)` / CRUD | `/inventory/categories` |
| `fetchSubcategories(categoryId?)` / `fetchSubcategoriesPage(params)` / CRUD | `/inventory/subcategories` |
| `fetchAttributeOptions(type?)` / CRUD (`src/features/attributes/api.ts`) | `/attribute-options` — CRUD is admin-only server-side |

## Invalidation Web

Because products/categories/subcategories show each other's derived counts, every mutation on any one of the three invalidates all three query-key `.all` entries (`productKeys.all`, `categoryKeys.all`, `subcategoryKeys.all`) — see `hooks.ts` and `../architecture/data-fetching-and-state.md`'s "Mutation → Invalidation Convention." When adding a new mutation here, keep this three-way invalidation rather than narrowing it — a narrower invalidation is how a stale subcategory count on the categories page sneaks back in.

## Business Rules the UI Must Respect

These live on the backend but the UI reflects them — see the backend doc for the actual enforcement:

- A category/subcategory delete action should be disabled or produce a clear error when it still has children — the backend returns a 400 (`extractErrorMessage` surfaces its message), but the UI can pre-empt this by disabling the delete button when `subcategoryCount`/`productCount > 0`.
- The low-stock filter (`stockFilter=low`) mirrors the backend's `quantityInStock <= reorderLevel` definition exactly — don't reimplement this threshold client-side differently.
