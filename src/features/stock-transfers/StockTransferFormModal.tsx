import { useEffect, useState } from 'react';
import { Button, Input, Modal, SearchableCombobox, Select } from '@/components/ui';
import { extractErrorMessage } from '@/lib/apiClient';
import { useProducts } from '@/features/inventory/hooks';
import { useWarehouses } from '@/features/warehouses/hooks';
import { useCreateTransfer } from './hooks';
import type { Product } from '@/types';

export function StockTransferFormModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: products } = useProducts();
  const { data: warehouses } = useWarehouses();
  const createTransfer = useCreateTransfer();

  const [productId, setProductId] = useState('');
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setProductId('');
      setFromWarehouseId('');
      setToWarehouseId('');
      setQuantity(1);
      setError(null);
    }
  }, [isOpen]);

  const getQuantityError = (): string | null => {
    if (!Number.isInteger(quantity) || quantity < 1) return 'Enter a quantity of at least 1.';
    return null;
  };

  const getWarehouseError = (): string | null => {
    if (fromWarehouseId && toWarehouseId && fromWarehouseId === toWarehouseId) {
      return 'From and to warehouses must be different.';
    }
    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    if (!productId) {
      setError('Select a product.');
      return;
    }
    if (!fromWarehouseId || !toWarehouseId) {
      setError('Select both warehouses.');
      return;
    }
    if (getWarehouseError()) {
      setError(getWarehouseError());
      return;
    }
    if (getQuantityError()) {
      setError(getQuantityError());
      return;
    }
    try {
      await createTransfer.mutateAsync({ productId, fromWarehouseId, toWarehouseId, quantity });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not create stock transfer.'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New transfer"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} isLoading={createTransfer.isPending}>
            Save transfer
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <SearchableCombobox
          label="Product"
          items={products ?? []}
          value={productId || null}
          onChange={(product: Product) => setProductId(product.id)}
          getOptionLabel={(p) => p.name}
          getOptionValue={(p) => p.id}
          getOptionSublabel={(p) => p.sku}
          placeholder="Search product by name or SKU…"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="From warehouse"
            value={fromWarehouseId}
            onChange={(e) => setFromWarehouseId(e.target.value)}
            error={getWarehouseError() ?? undefined}
          >
            <option value="">Select warehouse…</option>
            {warehouses?.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
          <Select
            label="To warehouse"
            value={toWarehouseId}
            onChange={(e) => setToWarehouseId(e.target.value)}
            error={getWarehouseError() ?? undefined}
          >
            <option value="">Select warehouse…</option>
            {warehouses?.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </div>

        <Input
          label="Quantity (kgs)"
          type="number"
          min="1"
          step="1"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          error={getQuantityError() ?? undefined}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
