import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { extractErrorMessage } from '@/lib/apiClient';
import { formatCurrency } from '@/lib/format';
import { Button, Card, CardBody, CardHeader, EmptyState, FullPageSpinner, IconButton, Input, PageHeader, Select, SearchableCombobox } from '@/components/ui';
import { useVendors } from '@/features/vendors/hooks';
import { VendorFormModal } from '@/features/vendors/VendorFormModal';
import { useProducts } from '@/features/inventory/hooks';
import { useWarehouseContext } from '@/features/warehouses/WarehouseContext';
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

  const { data: vendors } = useVendors();
  const { data: products } = useProducts();
  const { data: existingPurchase, isLoading: isLoadingPurchase, isError: isPurchaseError, error: purchaseFetchError } = usePurchase(id);
  const createPurchase = useCreatePurchase();
  const updatePurchase = useUpdatePurchase();

  const { selectedWarehouseId } = useWarehouseContext();

  const [vendorId, setVendorId] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);

  useEffect(() => {
    if (!isEdit || !existingPurchase || initialized) return;
    if (existingPurchase.status !== 'ORDERED') {
      setError('Only purchases that are still ordered (not yet in transit) can be edited.');
      return;
    }
    setVendorId(existingPurchase.vendorId);
    setLines(
      existingPurchase.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
      })),
    );
    setInitialized(true);
  }, [isEdit, existingPurchase, initialized]);

  const availableProducts = useMemo(
    () => products?.filter((p) => !lines.some((l) => l.productId === p.id)) ?? [],
    [products, lines],
  );

  const addLine = () => {
    if (availableProducts.length === 0) return;
    setLines((prev) => [...prev, { productId: availableProducts[0].id, quantity: 1, unitCost: 0 }]);
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
    if (!isEdit && !selectedWarehouseId) {
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
      warehouseId: isEdit ? undefined : (selectedWarehouseId ?? undefined),
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
              />
            </CardBody>
          </Card>

          <Card className="mt-6">
            <CardHeader
              title="Line items"
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={addLine}
                  disabled={availableProducts.length === 0}
                  icon={<Plus className="h-3.5 w-3.5" strokeWidth={2} />}
                >
                  Add product
                </Button>
              }
            />
            <CardBody>
              {lines.length === 0 ? (
                <EmptyState title="No products added" description="Use the Add product button to start building this purchase order." />
              ) : (
                <div className="flex flex-col gap-8">
                  {lines.map((line, index) => {
                    const product = productById.get(line.productId);
                    return (
                      <div key={index} className="grid grid-cols-1 items-end gap-3 sm:grid-cols-12">
                        <div className="sm:col-span-5">
                          <Select
                            label="Product"
                            value={line.productId}
                            onChange={(e) => updateLine(index, { productId: e.target.value })}
                          >
                            <option value={line.productId}>{product?.name}</option>
                            {availableProducts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div className="sm:col-span-2">
                          <Input
                            label="Qty (kgs)"
                            type="number"
                            min="1"
                            value={line.quantity === 0 ? '' : line.quantity}
                            onChange={(e) => updateLine(index, { quantity: e.target.value === '' ? 0 : Number(e.target.value) })}
                            error={getLineQuantityError(line) ?? undefined}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Input
                            label="Price (per kg)"
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.unitCost === 0 ? '' : line.unitCost}
                            onChange={(e) => updateLine(index, { unitCost: e.target.value === '' ? 0 : Number(e.target.value) })}
                            error={getLineCostError(line) ?? undefined}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2 sm:col-span-3 sm:items-end">
                          <div className="flex flex-col gap-0.5 sm:text-right sm:text-sm sm:text-graphite-500">
                            {product && (
                              <p className="font-medium text-graphite-800">{formatCurrency(line.unitCost * line.quantity)}</p>
                            )}
                          </div>
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
                disabled={lines.length === 0 || lines.some((line) => getLineQuantityError(line) !== null || getLineCostError(line) !== null)}
              >
                {isEdit ? 'Save changes' : 'Save purchase'}
              </Button>
              <p className="mt-2 text-center text-xs text-graphite-400">
                Stock is only updated once the purchase is marked in stock.
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
