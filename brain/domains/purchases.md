# Domain: Purchases & Vendors

> **Purpose:** The screens, DTO shapes, and state-machine UI rules for purchases and vendors — what this app expects the backend to return and enforce.
>
> **Related docs:** Backend's `brain/domains/purchases-and-vendors.md` (the state machine and receiving rules behind this) · feature: `src/features/purchases/`, `src/features/vendors/`

---

## Screens

| Component | Route | Purpose |
|---|---|---|
| `VendorsListPage` | `/vendors` | Paginated vendor table with derived order stats |
| `VendorFormModal` | (modal on `VendorsListPage`) | Create/edit a vendor |
| `PurchasesListPage` | `/purchases` | Paginated table, search, status filter |
| `PurchaseFormPage` | `/purchases/new`, `/purchases/:id/edit` | Vendor picker + vendor invoice number/date + a repeatable list of newly-created products |
| `AddPurchaseProductModal` | (modal on `PurchaseFormPage`, `size="xl"`) | The full jewelry cost sheet (reused from `inventory`) plus Quantity/Unit Cost for this line — see "Adding a Product" below |
| `PurchaseDetailPage` | `/purchases/:id` | Read-only view + vendor invoice number/date + status action buttons + receiving |
| `ReceiveItemsModal` | (modal on `PurchaseDetailPage`) | Enter received quantity per line item, supports partial receiving |
| `statusBadge.tsx` | (shared within this feature) | Maps `PurchaseStatus` → a colored `Badge` |

## Adding a Product

`PurchaseFormPage` does **not** offer a picker over existing products — "Add product" always opens `AddPurchaseProductModal`, which defines a brand-new design end to end. It reuses the exact same pieces `ProductFormPage` uses (see `../architecture/feature-conventions.md`'s shared-form-pieces note): `src/features/inventory/productCostSheet.ts` for the schema/formulas and `src/features/inventory/ProductCostSheetSections.tsx` (`ProductCostSheetSections` + `ProductCostSummary`) for the Metal/Diamond/Labour/Cost-summary JSX, extended with `quantity`/`unitCost` fields specific to this purchase line.

On submit, the modal calls `useCreateProduct()` directly (`quantityInStock: 0, reorderLevel: 0` — stock isn't real until this purchase is received) and hands the parent an `AddedPurchaseLine` (`productId`, `productName`, `designNumber`, `quantity`, `unitCost`) via its `onAdded` callback — the product already exists in the catalog the moment the modal closes, the same "create immediately, don't defer to the parent's save" pattern `CustomerFormModal`/`VendorFormModal` already use from `SearchableCombobox`'s `onAddNew`. `PurchaseFormPage`'s line rows carry these display fields directly (no `useProducts()`/lookup-by-id needed) — Quantity and Unit Cost stay editable inline per row after creation, same as before.

## DTO Shapes Consumed

```ts
type PurchaseStatus = 'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
interface PurchaseItem { id: string; productId: string; productName: string; sku: string; quantity: number; receivedQuantity: number; unitCost: number; lineTotal: number; }
interface Purchase {
  id: string; purchaseNumber: string; vendorId: string; vendorName: string;
  status: PurchaseStatus; items: PurchaseItem[]; subtotal: number; total: number;
  vendorInvoiceNumber: string | null; vendorInvoiceDate: string | null;
  orderedAt: string | null; receivedAt: string | null; createdAt: string;
}
interface Vendor {
  id: string; companyName: string; contactPerson: string | null; email: string | null;
  phone: string | null; address: string | null; totalOrders: number;
  lastOrderedDate: string | null; lastOrderedProduct: string | null; lastOrderedQty: number | null;
  createdAt: string;
}
```

`Purchase.subtotal`/`total` are computed by the backend at read time from `items`, not stored — see backend `data-conventions.md`. `Vendor`'s `totalOrders`/`lastOrdered*` fields are similarly derived, not stored columns — don't assume these update instantly from a purely optimistic local mutation; they only refresh on refetch (which the standard invalidation triggers).

## State Machine (UI Side)

| Status | Editable? | Actions shown on `PurchaseDetailPage` |
|---|---|---|
| `DRAFT` | Yes | Order, Cancel, Edit |
| `ORDERED` | No | Receive Items, Cancel |
| `PARTIALLY_RECEIVED` | No | Receive Items (remaining), Cancel |
| `RECEIVED` | No | (terminal — no Cancel) |
| `CANCELLED` | No | (terminal) |

`ReceiveItemsModal` only shows line items with `receivedQuantity < quantity`, and clamps the input max to `quantity - receivedQuantity` per line — the backend re-validates this regardless (see backend `receivePurchaseItems`), but the UI should not let a user type an obviously-invalid number and only find out from a 400.

## API Calls

| Function | Endpoint |
|---|---|
| `fetchPurchases()` / `fetchPurchasesPage(params)` | `GET /purchases` |
| `fetchPurchase(id)` | `GET /purchases/:id` |
| `createPurchase(input)` / `updatePurchase(id, input)` | `POST` / `PATCH /purchases/:id` |
| `orderPurchase(id)` / `cancelPurchase(id)` | One endpoint per transition |
| `receivePurchaseItems(id, items)` | `POST /purchases/:id/receive` — `items: { productId, receivedQty }[]` |
| `fetchVendors()` / `fetchVendorsPage(params)` / CRUD | `/vendors` |

## Invalidation Note

Receiving items changes both the purchase (`receivedQuantity`, status) and product stock (`quantityInStock`) on the backend — the receive mutation must invalidate both `purchaseKeys` (detail + list) and `productKeys.all`/inventory-related keys, mirroring the cross-domain effect documented in the backend's `domains/inventory-and-stock.md` ("Cross-Module Dependency"). Missing the product-side invalidation is how a receive succeeds but the inventory screen keeps showing stale stock until a manual refresh.

`AddPurchaseProductModal`'s product creation reuses `useCreateProduct()` as-is — its existing `productKeys.all`/`categoryKeys.all`/`subcategoryKeys.all` invalidation (see `../architecture/data-fetching-and-state.md`) already covers a brand-new product showing up correctly everywhere else in the app; nothing purchase-specific needed there.
