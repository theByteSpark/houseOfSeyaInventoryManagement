import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { extractErrorMessage } from '@/lib/apiClient';
import { formatCurrency } from '@/lib/format';
import { Button, Card, CardBody, CardHeader, EmptyState, FullPageSpinner, IconButton, Input, PageHeader, Select, SearchableCombobox, MultiSelectProductPicker, toast } from '@/components/ui';
import { useVendors } from '@/features/vendors/hooks';
import { VendorFormModal } from '@/features/vendors/VendorFormModal';
import { useProducts } from '@/features/inventory/hooks';
import { useAuth } from '@/features/auth/useAuth';
import { useWarehouses } from '@/features/warehouses/hooks';
import { useIsAdmin } from '@/features/warehouses/WarehouseFilter';
import { useCreatePurchase, usePurchase, useUpdatePurchase } from './hooks';
import type { Vendor } from '@/types';

interface DraftLine {
  productId: string;
  quantity: number;
  unitCost: number;
}

export function PurchaseFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: vendors, isLoading: isLoadingVendors } = useVendors();
  const { data: products, isLoading: isLoadingProducts } = useProducts();
  const { data: existingPurchase, isLoading: isLoadingPurchase, isError: isPurchaseError, error: purchaseFetchError } = usePurchase(id);
  const createPurchase = useCreatePurchase();
  const updatePurchase = useUpdatePurchase();

  const { user } = useAuth();
  const isCompanyLevel = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isAdmin = useIsAdmin();
  const { data: warehouses } = useWarehouses();

  const [vendorId, setVendorId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);

  useEffect(() => {
    if (!isEdit || !existingPurchase || initialized) return;
    if (existingPurchase.status === 'RECEIVED' || existingPurchase.status === 'CANCELLED') {
      setError('This purchase cannot be edited.');
      return;
    }
    setVendorId(existingPurchase.vendorId);
    setWarehouseId(existingPurchase.warehouseId);
    setLines(
      existingPurchase.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
      })),
    );
    setInitialized(true);
  }, [isEdit, existingPurchase, initialized]);

  const toggleProduct = (productId: string) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (existing) {
        return prev.filter((l) => l.productId !== productId);
      }
      return [...prev, { productId, quantity: 1, unitCost: 0 }];
    });
  };

  const updateLine = (index: number, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const productById = useMemo(() => new Map(products?.map((p) => [p.id, p])), [products]);

  const getLineQuantityError = (line: DraftLine): string | null => {
    if (!line.quantity || line.quantity < 1) return 'Enter a quantity of at least 1.';
    return null;
  };

  const getLineCostError = (line: DraftLine): string | null => {
    if (line.unitCost < 0) return 'Cost cannot be negative.';
    return null;
  };

  const total = lines.reduce((sum, l) => {
    const product = productById.get(l.productId);
    return sum + (product ? l.unitCost * l.quantity : 0);
  }, 0);

  const handleSubmit = async () => {
    setError(null);
    if (!vendorId) {
      setError('Select a vendor.');
      return;
    }
    if (isCompanyLevel && !warehouseId) {
      setError('Select a warehouse.');
      return;
    }
    if (lines.length === 0) {
      setError('Add at least one product line.');
      return;
    }
    if (lines.some((line) => getLineQuantityError(line) !== null || getLineCostError(line) !== null)) {
      setError('Fix the highlighted fields before saving.');
      return;
    }
    const input = {
      vendorId,
      items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitCost: l.unitCost })),
      warehouseId: isCompanyLevel ? warehouseId : undefined,
    };

    try {
      const purchase = isEdit
        ? await updatePurchase.mutateAsync({ id: id as string, input })
        : await createPurchase.mutateAsync(input);
      toast.success(isEdit ? 'Purchase updated successfully' : 'Purchase created successfully');
      navigate(`/purchases/${purchase.id}`, { replace: true });
    } catch (err) {
      const msg = extractErrorMessage(err, isEdit ? 'Could not update purchase.' : 'Could not create purchase.');
      setError(msg);
      toast.error(msg);
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
            <CardBody className="flex flex-col gap-4">
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
                isLoading={isLoadingVendors}
              />
              {isCompanyLevel && (
                <Select label="Warehouse" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                  <option value="">Select a warehouse</option>
                  {warehouses?.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </Select>
              )}
            </CardBody>
          </Card>

          <Card className="mt-6">
            <CardHeader title="Line items" />
            <CardBody className="flex flex-col gap-4">
              <MultiSelectProductPicker
                products={products?.map((p) => ({ id: p.id, name: p.name, sku: p.sku, quantityInStock: p.quantityInStock, unitPrice: p.unitPrice })) ?? []}
                selectedIds={lines.map((l) => l.productId)}
                onToggle={toggleProduct}
                isLoading={isLoadingProducts}
              />
              {lines.length === 0 ? (
                <EmptyState title="No products added" description="Search and select products above to add them to this purchase order." />
              ) : (
                <div className="flex flex-col gap-3">
                  {lines.map((line, index) => {
                    const product = productById.get(line.productId);
                    return (
                      <div key={line.productId} className="grid grid-cols-1 items-center gap-3 rounded-lg border border-graphite-100 p-3 sm:grid-cols-12">
                        <div className="sm:col-span-4">
                          <p className="truncate text-sm font-medium text-graphite-900">{product?.name}</p>
                          <p className="text-xs text-graphite-400">{product?.sku}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <Input
                            label="Qty"
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => updateLine(index, { quantity: Number(e.target.value) })}
                            error={getLineQuantityError(line) ?? undefined}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          {isAdmin && (
                            <Input
                              label="Unit cost"
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.unitCost}
                              onChange={(e) => updateLine(index, { unitCost: Number(e.target.value) })}
                              error={getLineCostError(line) ?? undefined}
                            />
                          )}
                        </div>
                        <div className="flex items-end justify-between gap-2 sm:col-span-3 sm:block sm:text-right sm:text-sm sm:text-graphite-500">
                          {product && isAdmin && (
                            <p className="font-medium text-graphite-800">{formatCurrency(line.unitCost * line.quantity)}</p>
                          )}
                        </div>
                        <div className="flex justify-end sm:col-span-1">
                          <IconButton label="Remove line item" tone="danger" onClick={() => removeLine(index)}>
                            <Trash2 className="h-4 w-4" strokeWidth={2} />
                          </IconButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div>
          {isAdmin && (
            <Card>
              <CardHeader title="Summary" />
              <CardBody>
                <dl className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-graphite-500">Total cost</dt>
                    <dd className="font-medium text-graphite-800">{formatCurrency(total)}</dd>
                  </div>
                </dl>
              </CardBody>
            </Card>
          )}

          <Card className={isAdmin ? 'mt-6' : ''}>
            <CardBody>
              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button
                className="w-full"
                onClick={handleSubmit}
                isLoading={isEdit ? updatePurchase.isPending : createPurchase.isPending}
                disabled={lines.length === 0 || lines.some((line) => getLineQuantityError(line) !== null || getLineCostError(line) !== null)}
              >
                {isEdit ? 'Save changes' : 'Save draft purchase'}
              </Button>
              <p className="mt-2 text-center text-xs text-graphite-400">
                Stock is only updated when items are received.
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
    </div>
  );
}
