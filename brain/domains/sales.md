# Domain: Sales

> **Purpose:** The screens, DTO shapes, and state-machine UI rules for sales — what this app expects the backend to return and enforce.
>
> **Related docs:** Backend's `brain/domains/sales-and-invoicing.md` (the state machine and stock-deduction rules behind this) · feature: `src/features/sales/`

---

## Screens

| Component | Route | Purpose |
|---|---|---|
| `SalesListPage` | `/sales` | Paginated table, search, status filter, sort by sale number/customer/status/total/created; "Import" button opens the shared `CsvImportModal` for bulk sale import via `/import/sales` — see `../architecture/feature-conventions.md`'s bulk-import note |
| `SaleFormPage` | `/sales/new`, `/sales/:id/edit` | Multi-line item form (customer picker + line items with product/qty) — a full page, not a modal, because it's multi-line |
| `SaleDetailPage` | `/sales/:id` | Read-only view + status action buttons (issue/mark paid/cancel) + "view invoice" |
| `InvoicePdfModal` | (modal on `SaleDetailPage`) | Renders/downloads the backend-generated invoice PDF |
| `statusBadge.tsx` | (shared within this feature) | Maps `SaleStatus` → a colored `Badge` |

## DTO Shapes Consumed

```ts
type SaleStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';
interface SaleItem { id: string; productId: string; productName: string; sku: string; quantity: number; unitPrice: number; lineTotal: number; }
interface Sale {
  id: string; saleNumber: string; customerId: string; customerName: string;
  status: SaleStatus; items: SaleItem[]; subtotal: number; tax: number; total: number;
  issuedAt: string | null; createdAt: string;
}
```

`SaleItem.unitPrice`/`lineTotal` are the **snapshotted** values at sale-creation time — see backend `data-conventions.md` Rule 6. The UI must not assume these match the product's current price if it also fetches the product elsewhere on the same screen.

## State Machine (UI Side)

Mirrors the backend exactly (see backend's `domains/sales-and-invoicing.md`) — the UI's job is to show only the valid next actions per status, not to enforce the rule itself (the backend is the enforcement; a stale UI showing an invalid button just gets a 400 back, handled via `extractErrorMessage`):

| Status | Editable? | Actions shown on `SaleDetailPage` |
|---|---|---|
| `DRAFT` | Yes — `SaleFormPage` edit route works | Issue, Cancel, Edit |
| `ISSUED` | No | Mark Paid, Cancel, View Invoice |
| `PAID` | No | View Invoice only — no Cancel button |
| `CANCELLED` | No | (terminal — no actions) |

## API Calls (`src/features/sales/api.ts`)

| Function | Endpoint |
|---|---|
| `fetchSales()` / `fetchSalesPage(params)` | `GET /sales` |
| `fetchSale(id)` | `GET /sales/:id` |
| `createSale(input)` / `updateSale(id, input)` | `POST` / `PATCH /sales/:id` |
| `issueSale(id)` / `markSalePaid(id)` / `cancelSale(id)` | `POST /sales/:id/issue` etc. — one endpoint per transition, not a generic "set status" call |

**Rule:** if a new transition is ever added on the backend, add its own dedicated API function here rather than a generic `updateSaleStatus(id, status)` — mirrors the backend's one-function-per-transition shape in `sales.service.ts` and keeps the frontend from being able to request an arbitrary status.

## Line-Item Editing Pattern

`SaleFormPage` uses `SearchableCombobox` (see `../ui/component-library.md`) per line to pick a product, auto-filling `unitPrice` from the selected product's current price — this is the *initial* value only; the backend re-snapshots it at save time regardless of what the form sends, so the form's job is a good default, not the source of truth.

## Invoicing

`InvoicePdfModal` fetches/displays a PDF the backend generates from the sale's full data (see backend's `sales.pdf.ts`) — this screen never constructs invoice layout client-side.
