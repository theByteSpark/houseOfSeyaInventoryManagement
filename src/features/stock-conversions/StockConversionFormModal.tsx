import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Modal, SearchableCombobox } from '@/components/ui';
import { extractErrorMessage } from '@/lib/apiClient';
import { useProducts } from '@/features/inventory/hooks';
import { useWarehouseContext } from '@/features/warehouses/WarehouseContext';
import { useCreateConversion } from './hooks';
import type { Product } from '@/types';

export function StockConversionFormModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: products } = useProducts();
  const { selectedWarehouseId } = useWarehouseContext();
  const createConversion = useCreateConversion();

  const [fromProductId, setFromProductId] = useState('');
  const [toProductId, setToProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFromProductId('');
      setToProductId('');
      setQuantity(1);
      setError(null);
    }
  }, [isOpen]);

  const fromProduct = useMemo(() => products?.find((p) => p.id === fromProductId) ?? null, [products, fromProductId]);
  const stockAtWarehouse = useMemo(() => {
    if (!fromProduct) return null;
    if (!selectedWarehouseId) return fromProduct.quantityInStock;
    return fromProduct.stockByWarehouse.find((s) => s.warehouseId === selectedWarehouseId)?.quantity ?? 0;
  }, [fromProduct, selectedWarehouseId]);

  const getProductError = (): string | null => {
    if (fromProductId && toProductId && fromProductId === toProductId) {
      return 'Source and destination product must differ.';
    }
    return null;
  };

  const getQuantityError = (): string | null => {
    if (!Number.isInteger(quantity) || quantity < 1) return 'Enter a quantity of at least 1.';
    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    if (!selectedWarehouseId) {
      setError('Select a warehouse from the header first.');
      return;
    }
    if (!fromProductId || !toProductId) {
      setError('Select both products.');
      return;
    }
    if (getProductError()) {
      setError(getProductError());
      return;
    }
    if (getQuantityError()) {
      setError(getQuantityError());
      return;
    }
    try {
      await createConversion.mutateAsync({
        fromProductId,
        toProductId,
        warehouseId: selectedWarehouseId,
        quantity,
      });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not transfer stock.'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer product stock"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} isLoading={createConversion.isPending}>
            Save transfer
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <SearchableCombobox
          label="From product"
          items={products ?? []}
          value={fromProductId || null}
          onChange={(product: Product) => setFromProductId(product.id)}
          getOptionLabel={(p) => p.name}
          getOptionValue={(p) => p.id}
          getOptionSublabel={(p) => p.sku}
          placeholder="Search product by name or SKU…"
        />
        {fromProduct && stockAtWarehouse !== null && (
          <p className="-mt-2 text-xs text-graphite-400">In stock: {stockAtWarehouse} kgs</p>
        )}

        <SearchableCombobox
          label="To product"
          items={products ?? []}
          value={toProductId || null}
          onChange={(product: Product) => setToProductId(product.id)}
          getOptionLabel={(p) => p.name}
          getOptionValue={(p) => p.id}
          getOptionSublabel={(p) => p.sku}
          placeholder="Search product by name or SKU…"
        />
        {getProductError() && <p className="-mt-2 text-xs text-red-600">{getProductError()}</p>}

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
