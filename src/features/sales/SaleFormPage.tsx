import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { extractErrorMessage } from '@/lib/apiClient';
import { formatCurrency } from '@/lib/format';
import { Button, Card, CardBody, CardHeader, EmptyState, FullPageSpinner, IconButton, Input, PageHeader, Select, SearchableCombobox, toast } from '@/components/ui';
import { useCustomers } from '@/features/customers/hooks';
import { CustomerFormModal } from '@/features/customers/CustomerFormModal';
import { useProducts } from '@/features/inventory/hooks';
import { useAuth } from '@/features/auth/useAuth';
import { useWarehouses } from '@/features/warehouses/hooks';
import { useCreateSale, useSale, useUpdateSale } from './hooks';
import type { Customer } from '@/types';

interface DraftLine {
  productId: string;
  quantity: number;
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

  const { user } = useAuth();
  const isCompanyLevel = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';
  const { data: warehouses } = useWarehouses();

  const [customerId, setCustomerId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);
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
    setWarehouseId(existingSale.warehouseId);
    setLines(existingSale.items.map((item) => ({ productId: item.productId, quantity: item.quantity })));
    setInitialized(true);
  }, [isEdit, existingSale, initialized]);

  const availableProducts = useMemo(
    () => products?.filter((p) => !lines.some((l) => l.productId === p.id)) ?? [],
    [products, lines],
  );

  const addLine = () => {
    if (availableProducts.length === 0) return;
    setLines((prev) => [...prev, { productId: availableProducts[0].id, quantity: 1 }]);
  };

  const updateLine = (index: number, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const productById = useMemo(() => new Map(products?.map((p) => [p.id, p])), [products]);

  const getLineQuantityError = (line: DraftLine): string | null => {
    const product = productById.get(line.productId);
    if (!product) return null;
    if (!line.quantity || line.quantity < 1) return 'Enter a quantity of at least 1.';
    if (line.quantity > product.quantityInStock) {
      return `Only ${product.quantityInStock} in stock.`;
    }
    return null;
  };

  const subtotal = lines.reduce((sum, l) => {
    const product = productById.get(l.productId);
    return sum + (product ? product.unitPrice * l.quantity : 0);
  }, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleSubmit = async () => {
    setError(null);
    if (!customerId) {
      setError('Select a customer.');
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
    if (lines.some((line) => getLineQuantityError(line) !== null)) {
      setError('Fix the highlighted quantities before saving.');
      return;
    }
    const input = {
      customerId,
      items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      warehouseId: isCompanyLevel ? warehouseId : undefined,
    };

    try {
      const sale = isEdit
        ? await updateSale.mutateAsync({ id: id as string, input })
        : await createSale.mutateAsync(input);
      toast.success(isEdit ? 'Sale updated successfully' : 'Sale created successfully');
      navigate(`/sales/${sale.id}`, { replace: true });
    } catch (err) {
      const msg = extractErrorMessage(err, isEdit ? 'Could not update sale.' : 'Could not create sale.');
      setError(msg);
      toast.error(msg);
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
            <CardBody className="flex flex-col gap-4">
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
                <div className="flex flex-col gap-3">
                  {lines.map((line, index) => {
                    const product = productById.get(line.productId);
                    return (
                      <div key={index} className="grid grid-cols-1 items-end gap-3 rounded-lg border border-graphite-100 p-3 sm:grid-cols-12">
                        <div className="sm:col-span-6">
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
                            label="Qty"
                            type="number"
                            min="1"
                            max={product?.quantityInStock}
                            value={line.quantity}
                            onChange={(e) => updateLine(index, { quantity: Number(e.target.value) })}
                            error={getLineQuantityError(line) ?? undefined}
                          />
                        </div>
                        <div className="flex items-end justify-between gap-2 sm:col-span-2 sm:block sm:text-right sm:text-sm sm:text-graphite-500">
                          {product && (
                            <>
                              <p className="text-xs text-graphite-400 sm:text-xs">In stock: {product.quantityInStock}</p>
                              <p className="font-medium text-graphite-800 sm:font-medium sm:text-graphite-800">{formatCurrency(product.unitPrice * line.quantity)}</p>
                            </>
                          )}
                        </div>
                        <div className="flex justify-end sm:col-span-2">
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
                  <dt className="text-graphite-500">Subtotal</dt>
                  <dd className="font-medium text-graphite-800">{formatCurrency(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-graphite-500">Tax (10%)</dt>
                  <dd className="font-medium text-graphite-800">{formatCurrency(tax)}</dd>
                </div>
                <div className="mt-1 flex justify-between border-t border-graphite-100 pt-2 text-base">
                  <dt className="font-semibold text-graphite-900">Total</dt>
                  <dd className="font-semibold text-graphite-900">{formatCurrency(total)}</dd>
                </div>
              </dl>

              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

              <Button
                className="mt-6 w-full"
                onClick={handleSubmit}
                isLoading={isEdit ? updateSale.isPending : createSale.isPending}
                disabled={lines.length === 0 || lines.some((line) => getLineQuantityError(line) !== null)}
              >
                {isEdit ? 'Save changes' : 'Save draft sale'}
              </Button>
              <p className="mt-2 text-center text-xs text-graphite-400">
                Stock is only deducted once the sale is confirmed.
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
