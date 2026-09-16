import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { extractErrorMessage } from '@/lib/apiClient';
import { formatCurrency } from '@/lib/format';
import { Button, Card, CardBody, CardHeader, EmptyState, IconButton, Input, PageHeader, Select, SearchableCombobox } from '@/components/ui';
import { useCustomers } from '@/features/customers/hooks';
import { CustomerFormModal } from '@/features/customers/CustomerFormModal';
import { useProducts } from '@/features/inventory/hooks';
import { useWarehouseContext } from '@/features/warehouses/WarehouseContext';
import { useCreateSale } from './hooks';
import type { Customer } from '@/types';

interface DraftLine {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export function SaleFormPage() {
  const navigate = useNavigate();

  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  const createSale = useCreateSale();

  const { selectedWarehouseId } = useWarehouseContext();

  const [customerId, setCustomerId] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  const availableProducts = useMemo(
    () => products?.filter((p) => !lines.some((l) => l.productId === p.id)) ?? [],
    [products, lines],
  );

  const addLine = () => {
    if (availableProducts.length === 0) return;
    setLines((prev) => [...prev, { productId: availableProducts[0].id, quantity: 1, unitPrice: 0 }]);
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

  const getLinePriceError = (line: DraftLine): string | null => {
    if (line.unitPrice < 0) return 'Price cannot be negative.';
    return null;
  };

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  const handleSubmit = async () => {
    setError(null);
    if (!customerId) {
      setError('Select a customer.');
      return;
    }
    if (!selectedWarehouseId) {
      setError('Select a warehouse.');
      return;
    }
    if (lines.length === 0) {
      setError('Add at least one product line.');
      return;
    }
    if (lines.some((line) => getLineQuantityError(line) !== null || getLinePriceError(line) !== null)) {
      setError('Fix the highlighted fields before saving.');
      return;
    }
    const input = {
      customerId,
      items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.unitPrice })),
      warehouseId: selectedWarehouseId ?? undefined,
    };

    try {
      const sale = await createSale.mutateAsync(input);
      navigate(`/sales/${sale.id}`, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not create sale.'));
    }
  };

  return (
    <div>
      <PageHeader
        title="Add sale"
        description="Select a customer and add the products being sold. Stock is deducted immediately."
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
                            max={product?.quantityInStock}
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
                            value={line.unitPrice === 0 ? '' : line.unitPrice}
                            onChange={(e) => updateLine(index, { unitPrice: e.target.value === '' ? 0 : Number(e.target.value) })}
                            error={getLinePriceError(line) ?? undefined}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2 sm:col-span-3 sm:items-end">
                          <div className="flex flex-col gap-0.5 sm:text-right sm:text-sm sm:text-graphite-500">
                            {product && (
                              <>
                                <p className="text-xs text-graphite-400">In stock: {product.quantityInStock} kgs</p>
                                <p className="font-medium text-graphite-800">{formatCurrency(line.unitPrice * line.quantity)}</p>
                              </>
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
                  <dt className="text-graphite-500">Subtotal</dt>
                  <dd className="font-medium text-graphite-800">{formatCurrency(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-graphite-500">Tax (18%)</dt>
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
                isLoading={createSale.isPending}
                disabled={lines.length === 0 || lines.some((line) => getLineQuantityError(line) !== null || getLinePriceError(line) !== null)}
              >
                Save sale
              </Button>
              <p className="mt-2 text-center text-xs text-graphite-400">
                Stock is deducted immediately once the sale is saved.
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
