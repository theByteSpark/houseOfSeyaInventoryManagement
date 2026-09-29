import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { extractErrorMessage } from '@/lib/apiClient';
import { formatCurrency } from '@/lib/format';
import { Button, Card, CardBody, CardHeader, EmptyState, FullPageSpinner, IconButton, Input, PageHeader, Select, SearchableCombobox } from '@/components/ui';
import { useCustomers } from '@/features/customers/hooks';
import { CustomerFormModal } from '@/features/customers/CustomerFormModal';
import { useProducts } from '@/features/inventory/hooks';
import { useCreateSale, useSale, useUpdateSale } from './hooks';
import type { Customer } from '@/types';

interface DraftLine {
  productId: string;
}

export function SaleFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  const { data: existingSale, isLoading: isLoadingSale, isError: isSaleError, error: saleFetchError } = useSale(id);
  const createSale = useCreateSale();
  const updateSale = useUpdateSale();

  const [customerId, setCustomerId] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number | ''>('');
  const [discountAmount, setDiscountAmount] = useState<number | ''>('');
  const [receivedAmount, setReceivedAmount] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  useEffect(() => {
    if (!isEdit || !existingSale || initialized) return;
    if (existingSale.status !== 'DRAFT') {
      setError('Only draft sales can be edited.');
      return;
    }
    setCustomerId(existingSale.customerId);
    setLines(existingSale.items.map((item) => ({ productId: item.productId })));
    setDiscountPercent(existingSale.discountPercent ?? '');
    setDiscountAmount(existingSale.discountAmount ?? '');
    setReceivedAmount(existingSale.receivedAmount || '');
    setInitialized(true);
  }, [isEdit, existingSale, initialized]);

  const availableProducts = useMemo(
    () => products?.filter((p) => !lines.some((l) => l.productId === p.id)) ?? [],
    [products, lines],
  );

  const addLine = () => {
    if (availableProducts.length === 0) return;
    setLines((prev) => [...prev, { productId: availableProducts[0].id }]);
  };

  const updateLine = (index: number, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const productById = useMemo(() => new Map(products?.map((p) => [p.id, p])), [products]);

  const subtotal = lines.reduce((sum, l) => {
    const product = productById.get(l.productId);
    return sum + (product ? product.sellingPrice : 0);
  }, 0);
  const collectedTax = subtotal * 0.03;
  const discountValue =
    discountPercent !== '' ? subtotal * (Number(discountPercent) / 100) : Math.min(Number(discountAmount) || 0, subtotal);
  const total = subtotal - discountValue;
  const balanceDue = total - (Number(receivedAmount) || 0);

  const handleDiscountPercentChange = (value: string) => {
    setDiscountPercent(value === '' ? '' : Number(value));
    if (value !== '') setDiscountAmount('');
  };

  const handleDiscountAmountChange = (value: string) => {
    setDiscountAmount(value === '' ? '' : Number(value));
    if (value !== '') setDiscountPercent('');
  };

  const handleSubmit = async () => {
    setError(null);
    if (!customerId) {
      setError('Select a customer.');
      return;
    }
    if (lines.length === 0) {
      setError('Add at least one product line.');
      return;
    }
    const input = {
      customerId,
      items: lines.map((l) => ({ productId: l.productId, quantity: 1 })),
      discountPercent: discountPercent === '' ? undefined : discountPercent,
      discountAmount: discountAmount === '' ? undefined : discountAmount,
      receivedAmount: receivedAmount === '' ? undefined : receivedAmount,
    };

    try {
      const sale = isEdit
        ? await updateSale.mutateAsync({ id: id as string, input })
        : await createSale.mutateAsync(input);
      navigate(`/sales/${sale.id}`, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, isEdit ? 'Could not update sale.' : 'Could not create sale.'));
    }
  };

  if (isEdit && isLoadingSale) return <FullPageSpinner />;

  if (isEdit && isSaleError) {
    return (
      <div className="py-16 text-center text-sm text-red-600">
        {extractErrorMessage(saleFetchError, 'Could not load this sale.')}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit sale' : 'Add sale'}
        description="Select a customer and add the products being sold."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Customer" />
            <CardBody>
              <SearchableCombobox
                label="Customer"
                items={customers ?? []}
                value={customerId || null}
                onChange={(customer: Customer) => setCustomerId(customer.id)}
                getOptionLabel={(c) => c.name}
                getOptionValue={(c) => c.id}
                getOptionSublabel={(c) => c.email ?? null}
                placeholder="Search customer by name or email…"
                addNewLabel="Add new customer"
                onAddNew={() => setCustomerModalOpen(true)}
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
                <EmptyState title="No products added" description="Use “Add product” to start building this sale." />
              ) : (
                <div className="flex flex-col gap-4">
                  {lines.map((line, index) => {
                    const product = productById.get(line.productId);
                    return (
                      <div key={index} className="rounded-lg border border-graphite-100 p-3">
                        <div className="flex items-end gap-3">
                          <div className="flex-1">
                            <Select
                              label="Product"
                              value={line.productId}
                              onChange={(e) => updateLine(index, { productId: e.target.value })}
                            >
                              <option value={line.productId}>{product?.name}</option>
                              {availableProducts.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.designNumber})
                                </option>
                              ))}
                            </Select>
                          </div>
                          <IconButton label="Remove line item" tone="danger" onClick={() => removeLine(index)}>
                            <Trash2 className="h-4 w-4" strokeWidth={2} />
                          </IconButton>
                        </div>

                        {product && (
                          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-5">
                            <div className="flex justify-between gap-2 sm:block">
                              <dt className="text-graphite-500">Metal cost</dt>
                              <dd className="text-graphite-800">{formatCurrency(product.metalCost)}</dd>
                            </div>
                            <div className="flex justify-between gap-2 sm:block">
                              <dt className="text-graphite-500">Diamond cost</dt>
                              <dd className="text-graphite-800">{formatCurrency(product.diamondCost)}</dd>
                            </div>
                            <div className="flex justify-between gap-2 sm:block">
                              <dt className="text-graphite-500">Labour cost</dt>
                              <dd className="text-graphite-800">{formatCurrency(product.labourCost)}</dd>
                            </div>
                            <div className="flex justify-between gap-2 sm:block">
                              <dt className="text-graphite-500">Other cost</dt>
                              <dd className="text-graphite-800">{formatCurrency(product.fixedExpense)}</dd>
                            </div>
                            <div className="flex justify-between gap-2 sm:block">
                              <dt className="text-graphite-500">Selling price</dt>
                              <dd className="font-medium text-graphite-900">{formatCurrency(product.sellingPrice)}</dd>
                            </div>
                          </dl>
                        )}
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
                  <dt className="text-graphite-500">Subtotal</dt>
                  <dd className="font-medium text-graphite-800">{formatCurrency(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-graphite-500">Collected tax (3%, included)</dt>
                  <dd className="font-medium text-graphite-800">{formatCurrency(collectedTax)}</dd>
                </div>
              </dl>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Input
                  label="Discount %"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  disabled={discountAmount !== ''}
                  value={discountPercent}
                  onChange={(e) => handleDiscountPercentChange(e.target.value)}
                />
                <Input
                  label="Discount amount"
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={discountPercent !== ''}
                  value={discountAmount}
                  onChange={(e) => handleDiscountAmountChange(e.target.value)}
                />
              </div>

              <div className="mt-3 flex justify-between border-t border-graphite-100 pt-2 text-base">
                <dt className="font-semibold text-graphite-900">Total</dt>
                <dd className="font-semibold text-graphite-900">{formatCurrency(total)}</dd>
              </div>

              <div className="mt-4 flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    label="Received amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
                <Button type="button" variant="secondary" onClick={() => setReceivedAmount(Math.round(total * 100) / 100)}>
                  Full amount received
                </Button>
              </div>

              <div className="mt-2 flex justify-between text-sm">
                <dt className="text-graphite-500">Balance due</dt>
                <dd className="font-medium text-graphite-800">{formatCurrency(Math.max(balanceDue, 0))}</dd>
              </div>

              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

              <Button
                className="mt-6 w-full"
                onClick={handleSubmit}
                isLoading={isEdit ? updateSale.isPending : createSale.isPending}
                disabled={lines.length === 0}
              >
                {isEdit ? 'Save changes' : 'Save draft sale'}
              </Button>
              <p className="mt-2 text-center text-xs text-graphite-400">
                Stock is only deducted once the sale is issued as an invoice.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>

      <CustomerFormModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onCreated={(customer) => {
          setCustomerId(customer.id);
          setCustomerModalOpen(false);
        }}
      />
    </div>
  );
}
