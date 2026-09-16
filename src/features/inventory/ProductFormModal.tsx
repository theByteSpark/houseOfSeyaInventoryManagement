import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button, Input, Modal, Select } from '@/components/ui';
import { useWarehouseContext } from '@/features/warehouses/WarehouseContext';
import { useCategories, useCreateProduct, useUpdateProduct } from './hooks';
import type { Product } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  quantityInStock: z.coerce.number().int().min(0, 'Cannot be negative'),
  reorderLevel: z.coerce.number().int().min(0, 'Cannot be negative'),
  categoryId: z.string().optional(),
});

type FormValues = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function ProductFormModal({
  isOpen,
  onClose,
  product,
}: {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}) {
  const isEditing = !!product;
  const { selectedWarehouseId } = useWarehouseContext();
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, FormOutput>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: product?.name ?? '',
        description: product?.description ?? '',
        quantityInStock: product?.quantityInStock ?? 0,
        reorderLevel: product?.reorderLevel ?? 0,
        categoryId: product?.categoryId ?? '',
      });
    }
  }, [isOpen, product, reset]);

  const onSubmit = async (values: FormOutput) => {
    const input = { ...values, warehouseId: selectedWarehouseId ?? undefined };
    if (isEditing && product) {
      await updateProduct.mutateAsync({ id: product.id, input });
    } else {
      await createProduct.mutateAsync(input);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit inventory item' : 'Add inventory item'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="product-form" isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Add inventory item'}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Product name" placeholder="Cotton Poplin — Ivory" error={errors.name?.message} {...register('name')} />
        <Select label="Category" error={errors.categoryId?.message} {...register('categoryId')}>
          <option value="">Uncategorized</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Input label="Description (optional)" placeholder="Short description" error={errors.description?.message} {...register('description')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Stock qty (kgs)"
            type="number"
            min="0"
            disabled={isEditing}
            hint={isEditing ? 'Use Restock to change stock' : undefined}
            error={errors.quantityInStock?.message}
            {...register('quantityInStock')}
          />
          <Input label="Reorder level (kgs)" type="number" min="0" error={errors.reorderLevel?.message} {...register('reorderLevel')} />
        </div>
      </form>
    </Modal>
  );
}
