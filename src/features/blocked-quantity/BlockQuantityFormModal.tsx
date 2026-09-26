import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useMemo } from 'react';
import { Button, Input, Modal, SearchableCombobox } from '@/components/ui';
import { useProducts } from '@/features/inventory/hooks';
import { useWarehouseContext } from '@/features/warehouses/WarehouseContext';
import { useCreateBlockedQuantity } from './hooks';
import type { Product } from '@/types';

const schema = z.object({
  productId: z.string().min(1, 'Select a product'),
  quantity: z.coerce.number().int('Enter a whole number').positive('Enter a quantity of at least 1'),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export function BlockQuantityFormModal({
  isOpen,
  onClose,
  product: lockedProduct,
}: {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
}) {
  const { selectedWarehouseId } = useWarehouseContext();
  const { data: fetchedProducts } = useProducts(selectedWarehouseId ?? undefined);
  const products = lockedProduct ? [lockedProduct] : fetchedProducts;
  const createBlockedQuantity = useCreateBlockedQuantity();

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (isOpen) {
      reset({ productId: lockedProduct?.id ?? '', quantity: 1 });
    }
  }, [isOpen, reset, lockedProduct]);

  const selectedProductId = watch('productId');
  const quantity = watch('quantity');
  const selectedProduct = useMemo(
    () => products?.find((p) => p.id === selectedProductId),
    [products, selectedProductId],
  );
  const availableToBlock = selectedProduct
    ? Math.max(selectedProduct.quantityInStock - selectedProduct.blockedQuantity, 0)
    : null;
  const exceedsAvailable =
    availableToBlock !== null && Number(quantity) > availableToBlock;

  const onSubmit = async (values: FormValues) => {
    await createBlockedQuantity.mutateAsync({
      productId: values.productId,
      quantity: values.quantity,
      warehouseId: selectedWarehouseId ?? undefined,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Block quantity"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="block-quantity-form" isLoading={isSubmitting} disabled={exceedsAvailable}>
            Block quantity
          </Button>
        </>
      }
    >
      <form id="block-quantity-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {lockedProduct ? (
          <div>
            <p className="mb-1 text-xs font-medium text-graphite-500">Product</p>
            <p className="text-sm font-medium text-graphite-900">{lockedProduct.name}</p>
            <p className="text-xs text-graphite-400">{lockedProduct.sku}</p>
          </div>
        ) : (
          <Controller
            name="productId"
            control={control}
            render={({ field }) => (
              <SearchableCombobox
                label="Product"
                items={products ?? []}
                value={field.value || null}
                onChange={(product: Product) => field.onChange(product.id)}
                getOptionLabel={(p) => p.name}
                getOptionValue={(p) => p.id}
                getOptionSublabel={(p) => p.sku}
                placeholder="Search product by name or SKU…"
                error={errors.productId?.message}
              />
            )}
          />
        )}
        <Input
          label="Quantity (kgs)"
          type="number"
          min="1"
          step="1"
          error={errors.quantity?.message ?? (exceedsAvailable ? `Only ${availableToBlock} kgs available to block.` : undefined)}
          {...register('quantity')}
        />
        {selectedProduct && !exceedsAvailable && (
          <p className="text-xs text-graphite-400">{availableToBlock} kgs available to block.</p>
        )}
      </form>
    </Modal>
  );
}
