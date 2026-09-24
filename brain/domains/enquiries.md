# Domain: Enquiries

> **Purpose:** The screens and DTO shape for recording customer interest — deliberately the lightest-weight form in this app, with no pricing at all.
>
> **Related docs:** Backend's `brain/domains/enquiries.md` (why there's no pricing, no status yet) · `domains/inventory.md` (the costed sibling — `Product`) · feature: `src/features/enquiries/`

---

## Screens

| Component | Route | Purpose |
|---|---|---|
| `EnquiriesListPage` | `/enquiries` | Paginated table, search by customer/subcategory/metal, sortable |
| `EnquiryFormModal` | (modal, `size="xl"`) | Create/edit — opened from `EnquiriesListPage`'s "Add enquiry" **and** `DashboardPage`'s "Add enquiry" button in its `PageHeader` action slot |

Unlike `ProductFormPage`/`AddPurchaseProductModal`, this stayed a modal rather than a full page — see `../architecture/feature-conventions.md`'s Modal-vs-Page note: one short section plus a repeatable diamond list with **no computation** doesn't cross the complexity threshold a full page exists for.

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
interface EnquiryDiamond { id?: string; shape: string; quality: string; pieces: number; caratWeight: number; }
interface Enquiry {
  id: string; customerId: string; customerName: string;
  subcategoryId: string | null; subcategoryName: string | null;
  categoryId: string | null; categoryName: string | null;
  metalType: string; grossWeight: number; diamonds: EnquiryDiamond[]; createdAt: string;
}
```

No `amount`, no `rate`, no `weight` on the diamond rows, no cost/tax/final-amount anywhere on `Enquiry` itself — confirm against the backend's `brain/domains/enquiries.md` before assuming any of `Product`'s costing fields apply here; they deliberately don't.

## API Calls (`src/features/enquiries/api.ts`)

| Function | Endpoint |
|---|---|
| `fetchEnquiries()` / `fetchEnquiriesPage(params)` | `GET /enquiries` |
| `fetchEnquiry(id)` | `GET /enquiries/:id` |
| `createEnquiry(input)` / `updateEnquiry(id, input)` / `deleteEnquiry(id)` | `POST` / `PATCH` / `DELETE /enquiries/:id` — `input.diamonds` is the full replacement list, same as `Product`'s diamonds |

## Not Built Yet (On Purpose)

No status/lifecycle, no "convert to product" action, no link from an `Enquiry` to the `Product` it might become — the request that created this domain only described the input fields, not a workflow. See the backend doc's "Extending This Domain" before adding any of these speculatively.
