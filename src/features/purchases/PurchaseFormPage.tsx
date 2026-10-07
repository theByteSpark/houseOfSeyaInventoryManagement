import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { extractErrorMessage } from '@/lib/apiClient';
import { formatCurrency, todayIso } from '@/lib/format';
import { Button, DateInput, Card, CardBody, CardHeader, EmptyState, FullPageSpinner, IconButton, Input, PageHeader, SearchableCombobox } from '@/components/ui';
import { useVendors } from '@/features/vendors/hooks';
import { VendorFormModal } from '@/features/vendors/VendorFormModal';
import { useCreatePurchase, usePurchase, useUpdatePurchase } from './hooks';
import { AddPurchaseProductModal } from './AddPurchaseProductModal';
import type { Product, Vendor } from '@/types';

interface PurchaseEnquiryPrefillState {
  vendorId?: string;
  prefill?: {
    subcategoryId?: string;
    metalType?: string;
    grossWeight?: number;
    diamondShape?: string;
    diamondQuality?: string;
    diamondPieces?: number;
    diamondCaratWeight?: number;
  };
}

export function PurchaseFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: vendors } = useVendors();
  const { data: existingPurchase, isLoading: isLoadingPurchase, isError: isPurchaseError, error: purchaseFetchError } = usePurchase(id);
  const createPurchase = useCreatePurchase();
  const updatePurchase = useUpdatePurchase();

  const [vendorId, setVendorId] = useState('');
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState('');
  const [vendorInvoiceDate, setVendorInvoiceDate] = useState(todayIso());
  const [lines, setLines] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productPrefill, setProductPrefill] = useState<PurchaseEnquiryPrefillState['prefill']>(undefined);

  // Arrived here from a Purchase Order's "Convert to purchase" — pre-select
  // the vendor and open the Add Product modal pre-filled with whatever the
  // enquiry captured (design number/name/rates/selling price are left blank,
  // the enquiry never had them). Consumed once, then cleared so a refresh
  // doesn't re-trigger it.
  useEffect(() => {
    if (isEdit) return;
    const state = location.state as PurchaseEnquiryPrefillState | null;
    if (!state) return;
    if (state.vendorId) setVendorId(state.vendorId);
    if (state.prefill) {
      setProductPrefill(state.prefill);
      setEditingProduct(null);
      setAddProductOpen(true);
    }
    navigate(location.pathname, { replace: true, state: null });
    // Deliberately runs once on mount only — location/navigate are excluded
    // since navigate() itself changes location and would otherwise re-fire.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit || !existingPurchase || initialized) return;
    if (existingPurchase.status === 'CANCELLED') {
      setError('A cancelled purchase cannot be edited.');
      return;
    }
    setVendorId(existingPurchase.vendorId);
    setVendorInvoiceNumber(existingPurchase.vendorInvoiceNumber ?? '');
    setVendorInvoiceDate(existingPurchase.vendorInvoiceDate ? existingPurchase.vendorInvoiceDate.split('T')[0] : '');
    setLines(existingPurchase.items.map((item) => item.product));
    setInitialized(true);
  }, [isEdit, existingPurchase, initialized]);

  const openAddProduct = () => {
    setEditingProduct(null);
    setAddProductOpen(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setAddProductOpen(true);
  };

  const handleProductAdded = (product: Product) => {
    setLines((prev) => [...prev, product]);
    setAddProductOpen(false);
    setProductPrefill(undefined);
  };

  const handleProductEdited = (product: Product) => {
    setLines((prev) => prev.map((p) => (p.id === product.id ? product : p)));
    setAddProductOpen(false);
    setEditingProduct(null);
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const total = lines.reduce((sum, p) => sum + p.totalCost, 0);

  const handleSubmit = async () => {
    setError(null);
    if (!vendorId) {
      setError('Select a vendor.');
      return;
    }
    if (lines.length === 0) {
      setError('Add at least one product.');
      return;
    }
    const input = {
      vendorId,
      vendorInvoiceNumber: vendorInvoiceNumber.trim() || undefined,
      vendorInvoiceDate: vendorInvoiceDate || undefined,
      items: lines.map((p) => ({ productId: p.id, quantity: 1, unitCost: p.totalCost })),
    };

    try {
      const purchase = isEdit
        ? await updatePurchase.mutateAsync({ id: id as string, input })
        : await createPurchase.mutateAsync(input);
      navigate(`/purchases/${purchase.id}`, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, isEdit ? 'Could not update purchase.' : 'Could not create purchase.'));
    }
  };

  if (isEdit && isLoadingPurchase) return <FullPageSpinner />;

  if (isEdit && isPurchaseError) {
    return (
      <div className="py-16 text-center text-sm text-red-600">
        {extractErrorMessage(purchaseFetchError, 'Could not load this purchase.')}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit purchase' : 'Add purchase'}
        description="Select a vendor and add the products being ordered."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Vendor" />
            <CardBody>
              <SearchableCombobox
                label="Vendor"
                items={vendors ?? []}
                value={vendorId || null}
                onChange={(vendor: Vendor) => setVendorId(vendor.id)}
                getOptionLabel={(v) => v.companyName}
                getOptionValue={(v) => v.id}
                getOptionSublabel={(v) => v.contactPerson ?? null}
                placeholder="Search vendor by company or contact…"
                addNewLabel="Add new vendor"
                onAddNew={() => setVendorModalOpen(true)}
              />
            </CardBody>
          </Card>

          <Card className="mt-6">
            <CardHeader title="Vendor invoice" />
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Vendor invoice number"
                placeholder="e.g. INV-4521"
                value={vendorInvoiceNumber}
                onChange={(e) => setVendorInvoiceNumber(e.target.value)}
              />
              <DateInput label="Vendor invoice date" value={vendorInvoiceDate} onChange={setVendorInvoiceDate} />
            </CardBody>
          </Card>

          <Card className="mt-6">
            <CardHeader
              title="Products"
              action={
                <Button size="sm" variant="secondary" onClick={openAddProduct} icon={<Plus className="h-3.5 w-3.5" strokeWidth={2} />}>
                  Add product
                </Button>
              }
            />
            <CardBody>
              {lines.length === 0 ? (
                <EmptyState title="No products added" description="Use the Add product button to define a design for this purchase." />
              ) : (
                <div className="flex flex-col gap-4">
                  {lines.map((product, index) => (
                    <div key={`${product.id}-${index}`} className="rounded-lg border border-graphite-100 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-graphite-900">{product.name}</p>
                          <p className="text-xs text-graphite-400">{product.designNumber}</p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <IconButton label="Edit product" tone="brand" onClick={() => openEditProduct(product)}>
                            <Pencil className="h-4 w-4" strokeWidth={2} />
                          </IconButton>
                          <IconButton label="Remove product" tone="danger" onClick={() => removeLine(index)}>
                            <Trash2 className="h-4 w-4" strokeWidth={2} />
                          </IconButton>
                        </div>
                      </div>

                      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3">
                        <div className="flex justify-between gap-2 sm:block">
                          <dt className="text-graphite-500">Subcategory</dt>
                          <dd className="text-graphite-800">{product.subcategoryName ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-2 sm:block">
                          <dt className="text-graphite-500">Metal type</dt>
                          <dd className="text-graphite-800">{product.metalType ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-2 sm:block">
                          <dt className="text-graphite-500">Gr.Wt (grams)</dt>
                          <dd className="text-graphite-800">{product.grossWeight ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-2 sm:block">
                          <dt className="text-graphite-500">Metal price / gm</dt>
                          <dd className="text-graphite-800">{formatCurrency(product.metalRatePerGram ?? 0)}</dd>
                        </div>
                        <div className="flex justify-between gap-2 sm:block">
                          <dt className="text-graphite-500">Shape</dt>
                          <dd className="text-graphite-800">{product.diamondShape ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-2 sm:block">
                          <dt className="text-graphite-500">Quality</dt>
                          <dd className="text-graphite-800">{product.diamondQuality ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-2 sm:block">
                          <dt className="text-graphite-500">Pcs</dt>
                          <dd className="text-graphite-800">{product.diamondPieces ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-2 sm:block">
                          <dt className="text-graphite-500">Ct.Wt</dt>
                          <dd className="text-graphite-800">{product.diamondCaratWeight ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-2 sm:block">
                          <dt className="text-graphite-500">Rate</dt>
                          <dd className="text-graphite-800">{formatCurrency(product.diamondRate ?? 0)}</dd>
                        </div>
                        <div className="flex justify-between gap-2 sm:block">
                          <dt className="text-graphite-500">Making charge / gm</dt>
                          <dd className="text-graphite-800">{formatCurrency(product.makingChargePerGram ?? 0)}</dd>
                        </div>
                        <div className="flex justify-between gap-2 sm:block">
                          <dt className="text-graphite-500">Other cost</dt>
                          <dd className="text-graphite-800">{formatCurrency(product.fixedExpense)}</dd>
                        </div>
                        <div className="flex justify-between gap-2 sm:block">
                          <dt className="text-graphite-500">Selling price</dt>
                          <dd className="text-graphite-800">{formatCurrency(product.sellingPrice)}</dd>
                        </div>
                      </dl>

                      <div className="mt-3 flex flex-wrap justify-end gap-x-4 gap-y-1 border-t border-graphite-100 pt-2 text-sm">
                        <span className="text-graphite-500">
                          Total cost:&nbsp;<span className="font-medium text-graphite-800">{formatCurrency(product.totalCost)}</span>
                        </span>
                        <span className="text-graphite-500">
                          Tax (3%):&nbsp;<span className="font-medium text-graphite-800">{formatCurrency(product.taxAmount)}</span>
                        </span>
                        <span className="text-graphite-500">
                          Final amount:&nbsp;<span className="font-semibold text-graphite-900">{formatCurrency(product.finalAmount)}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader title="Summary" />
            <CardBody>
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-graphite-500">Total cost</dt>
                  <dd className="font-medium text-graphite-800">{formatCurrency(total)}</dd>
                </div>
              </dl>

              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

              <Button
                className="mt-6 w-full"
                onClick={handleSubmit}
                isLoading={isEdit ? updatePurchase.isPending : createPurchase.isPending}
                disabled={lines.length === 0}
              >
                {isEdit ? 'Save changes' : 'Create purchase'}
              </Button>
              <p className="mt-2 text-center text-xs text-graphite-400">
                Stock is updated immediately — a purchase is received as soon as it's created.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>

      <VendorFormModal
        isOpen={vendorModalOpen}
        onClose={() => setVendorModalOpen(false)}
        onCreated={(vendor) => {
          setVendorId(vendor.id);
          setVendorModalOpen(false);
        }}
      />

      <AddPurchaseProductModal
        isOpen={addProductOpen}
        onClose={() => {
          setAddProductOpen(false);
          setEditingProduct(null);
          setProductPrefill(undefined);
        }}
        product={editingProduct}
        initialValues={editingProduct ? undefined : productPrefill}
        onAdded={handleProductAdded}
        onEdited={handleProductEdited}
      />
    </div>
  );
}
