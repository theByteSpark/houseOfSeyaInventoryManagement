import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { extractErrorMessage } from '@/lib/apiClient';
import { formatCurrency } from '@/lib/format';
import { Button, Card, CardBody, CardHeader, EmptyState, FullPageSpinner, IconButton, Input, PageHeader, SearchableCombobox } from '@/components/ui';
import { useVendors } from '@/features/vendors/hooks';
import { VendorFormModal } from '@/features/vendors/VendorFormModal';
import { useCreatePurchase, usePurchase, useUpdatePurchase } from './hooks';
import { AddPurchaseProductModal, type AddedPurchaseLine } from './AddPurchaseProductModal';
import type { Vendor } from '@/types';

interface DraftLine {
  productId: string;
  productName: string;
  designNumber: string;
  quantity: number;
  unitCost: number;
}

export function PurchaseFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: vendors } = useVendors();
  const { data: existingPurchase, isLoading: isLoadingPurchase, isError: isPurchaseError, error: purchaseFetchError } = usePurchase(id);
  const createPurchase = useCreatePurchase();
  const updatePurchase = useUpdatePurchase();

  const [vendorId, setVendorId] = useState('');
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState('');
  const [vendorInvoiceDate, setVendorInvoiceDate] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);

  useEffect(() => {
    if (!isEdit || !existingPurchase || initialized) return;
    if (existingPurchase.status !== 'DRAFT') {
      setError('Only draft purchases can be edited.');
      return;
    }
    setVendorId(existingPurchase.vendorId);
    setVendorInvoiceNumber(existingPurchase.vendorInvoiceNumber ?? '');
    setVendorInvoiceDate(existingPurchase.vendorInvoiceDate ? existingPurchase.vendorInvoiceDate.split('T')[0] : '');
    setLines(
      existingPurchase.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        designNumber: item.designNumber,
        quantity: item.quantity,
        unitCost: item.unitCost,
      })),
    );
    setInitialized(true);
  }, [isEdit, existingPurchase, initialized]);

  const updateLine = (index: number, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductAdded = (line: AddedPurchaseLine) => {
    setLines((prev) => [...prev, line]);
    setAddProductOpen(false);
  };

  const getLineQuantityError = (line: DraftLine): string | null => {
    if (!line.quantity || line.quantity < 1) return 'Enter a quantity of at least 1.';
    return null;
  };

  const getLineCostError = (line: DraftLine): string | null => {
    if (line.unitCost < 0) return 'Cost cannot be negative.';
    return null;
  };

  const total = lines.reduce((sum, l) => sum + l.unitCost * l.quantity, 0);

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
    if (lines.some((line) => getLineQuantityError(line) !== null || getLineCostError(line) !== null)) {
      setError('Fix the highlighted fields before saving.');
      return;
    }
    const input = {
      vendorId,
      vendorInvoiceNumber: vendorInvoiceNumber.trim() || undefined,
      vendorInvoiceDate: vendorInvoiceDate || undefined,
      items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitCost: l.unitCost })),
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
              <Input
                label="Vendor invoice date"
                type="date"
                value={vendorInvoiceDate}
                onChange={(e) => setVendorInvoiceDate(e.target.value)}
              />
            </CardBody>
          </Card>

          <Card className="mt-6">
            <CardHeader
              title="Products"
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setAddProductOpen(true)}
                  icon={<Plus className="h-3.5 w-3.5" strokeWidth={2} />}
                >
                  Add product
                </Button>
              }
            />
            <CardBody>
              {lines.length === 0 ? (
                <EmptyState title="No products added" description="Use the Add product button to define a design for this purchase." />
              ) : (
                <div className="flex flex-col gap-3">
                  {lines.map((line, index) => (
                    <div key={`${line.productId}-${index}`} className="grid grid-cols-1 items-end gap-3 rounded-lg border border-graphite-100 p-3 sm:grid-cols-12">
                      <div className="sm:col-span-5">
                        <p className="font-medium text-graphite-900">{line.productName}</p>
                        <p className="text-xs text-graphite-400">{line.designNumber}</p>
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
                        <Input
                          label="Unit cost"
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.unitCost}
                          onChange={(e) => updateLine(index, { unitCost: Number(e.target.value) })}
                          error={getLineCostError(line) ?? undefined}
                        />
                      </div>
                      <div className="flex items-end justify-between gap-2 sm:col-span-2 sm:block sm:text-right sm:text-sm sm:text-graphite-500">
                        <p className="font-medium text-graphite-800">{formatCurrency(line.unitCost * line.quantity)}</p>
                      </div>
                      <div className="flex justify-end sm:col-span-1">
                        <IconButton label="Remove line item" tone="danger" onClick={() => removeLine(index)}>
                          <Trash2 className="h-4 w-4" strokeWidth={2} />
                        </IconButton>
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

      <AddPurchaseProductModal
        isOpen={addProductOpen}
        onClose={() => setAddProductOpen(false)}
        onAdded={handleProductAdded}
      />
    </div>
  );
}
