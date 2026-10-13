# Domain: Enquiries

> **Purpose:** The screens and DTO shape for recording customer interest — the lightest-weight form in this app, with almost no pricing.
>
> **Related docs:** Backend's `brain/domains/enquiries.md` (field-by-field why) · `domains/inventory.md` (the costed sibling — `Product`) · feature: `src/features/enquiries/`

---

## Screens

| Component | Route | Purpose |
|---|---|---|
| `EnquiriesListPage` | `/enquiries` | Paginated table — Customer, Subcategory, Metal, Gr.Wt, Diamond, Selling amount, Recorded, Actions — search by customer/subcategory/metal, sortable |
| `EnquiryFormModal` | (modal, `size="xl"`) | Create/edit — opened from `EnquiriesListPage`'s "Add enquiry", `DashboardPage`'s Enquiries card (its own Add/Edit icons), and the row-level Edit icon on both |
| `DashboardPage`'s Enquiries card | `/` | Up to the last 10 enquiries, same columns as the list page minus Diamond, plus Edit/Delete/Convert-to-Purchase-Order icons per row |

Unlike `ProductFormPage`/`AddPurchaseProductModal`, this stayed a modal rather than a full page — see `../architecture/feature-conventions.md`'s Modal-vs-Page note: one short section with **no computation** doesn't cross the complexity threshold a full page exists for.

## The Customer Field Is a `Controller`, Not a Plain `useState`

`EnquiryFormModal` runs the whole form on `react-hook-form` (unlike `SaleFormPage`/`PurchaseFormPage`, which are plain `useState` throughout and so can wire `SearchableCombobox` directly). Since `SearchableCombobox` isn't a native form element, plugging it into an RHF-managed form uses RHF's `Controller`:

```tsx
<Controller
  control={control}
  name="customerId"
  render={({ field }) => (
    <SearchableCombobox value={field.value || null} onChange={(c) => field.onChange(c.id)} ... />
  )}
/>
```

"Add new customer" still opens the existing `CustomerFormModal` exactly like `SaleFormPage` does, but its `onCreated` callback calls `setValue('customerId', customer.id, { shouldValidate: true })` directly (from the same `useForm()`) rather than going through the `Controller`'s `field.onChange` — the two are independent, and `setValue` is simpler here since it doesn't need to be inside the render prop's scope. This is the pattern to copy the next time a `SearchableCombobox`-backed field needs to live inside an RHF form instead of a plain `useState` one.

## DTO Shape Consumed

```ts
interface Enquiry {
  id: string; customerId: string; customerName: string;
  subcategoryId: string | null; subcategoryName: string | null;
  categoryId: string | null; categoryName: string | null;
  metalType: string; grossWeight: number;
  diamondShape: string | null; diamondQuality: string | null;
  diamondPieces: number | null; diamondCaratWeight: number | null;
  sellingAmount: number | null; notes: string | null;
  createdAt: string;
}
```

One flat diamond block directly on `Enquiry` (not a repeatable `diamonds[]` — that was an earlier shape, flattened in migration `20260930080000_flatten_enquiry_diamond`, same reasoning as `Product`'s own diamond flatten). `sellingAmount` is the one priced field — required by the form's Zod schema even though nullable in the DB (pre-existing rows). `notes` is free text for anything about a custom order that doesn't fit the structured fields. Still no `rate`/`weight`/cost/tax/final-amount anywhere — confirm against the backend's `brain/domains/enquiries.md` before assuming any of `Product`'s costing fields apply here; they deliberately don't.

## API Calls (`src/features/enquiries/api.ts`)

| Function | Endpoint |
|---|---|
| `fetchEnquiries()` / `fetchEnquiriesPage(params)` | `GET /enquiries` |
| `fetchEnquiry(id)` | `GET /enquiries/:id` |
| `createEnquiry(input)` / `updateEnquiry(id, input)` | `POST` / `PATCH /enquiries/:id` |
| `deleteEnquiry(id)` | `DELETE /enquiries/:id` — admin-only (`isAdmin` gate on the Delete icon in both `EnquiriesListPage` and `DashboardPage`, enforced again server-side) |

## Convert to Purchase Order

`EnquiriesListPage` and `DashboardPage` both have a "Convert to Purchase Order" icon per row (`convertToPurchaseOrder()`): `navigate('/purchase-enquiries', { state: { prefill: {...} } })` carrying `subcategoryId`/`metalType`/`grossWeight`/`diamondShape`/`diamondQuality`/`diamondPieces`/`diamondCaratWeight` — **not** `sellingAmount` or `notes`, since `PurchaseEnquiry` has neither field. `PurchaseEnquiriesListPage` reads `location.state.prefill` on mount and pre-opens `PurchaseEnquiryFormModal` with it via its `initialValues` prop, then clears the state (`navigate(..., { replace: true, state: null })`) so a refresh doesn't re-trigger it. No vendor is carried over — a customer enquiry never has one, so the vendor field starts empty. This is a pure client-side form-to-form handoff; nothing is persisted linking the two records (mirrors the identical `PurchaseEnquiry → Purchase` "Convert to purchase" pattern already in `domains/purchases.md`).

## Not Built Yet (On Purpose)

No status/lifecycle, no stored link from an `Enquiry` to the `Product`/`PurchaseEnquiry` it might become beyond the one-shot form prefill above — the request that created this domain only described the input fields, not a persisted workflow. See the backend doc's "Extending This Domain" before adding any of these speculatively.
