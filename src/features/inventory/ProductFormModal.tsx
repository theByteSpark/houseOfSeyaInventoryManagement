import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button, Input, Modal, Select } from '@/components/ui';
import { useAuth } from '@/features/auth/useAuth';
import { useWarehouses } from '@/features/warehouses/hooks';
import { useCategories, useCreateProduct, useUpdateProduct } from './hooks';
import type { Product } from '@/types';

const schema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  quantityInStock: z.coerce.number().int().min(0, 'Cannot be negative'),
  reorderLevel: z.coerce.number().int().min(0, 'Cannot be negative'),
  categoryId: z.string().optional(),
  warehouseId: z.string().optional(),
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
  const { user } = useAuth();
  const isCompanyLevel = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';
  const { data: categories } = useCategories();
  const { data: warehouses } = useWarehouses();
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
        sku: product?.sku ?? '',
        name: product?.name ?? '',
        description: product?.description ?? '',
        quantityInStock: product?.quantityInStock ?? 0,
        reorderLevel: product?.reorderLevel ?? 0,
        categoryId: product?.categoryId ?? '',
        warehouseId: '',
      });
    }
  }, [isOpen, product, reset]);

  const onSubmit = async (values: FormOutput) => {
    if (isEditing && product) {
      await updateProduct.mutateAsync({ id: product.id, input: values });
    } else {
      await createProduct.mutateAsync(values);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit product' : 'Add product'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="product-form" isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Add product'}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="SKU" placeholder="FAB-COT-001" error={errors.sku?.message} {...register('sku')} />
          <Input label="Product name" placeholder="Cotton Poplin — Ivory" error={errors.name?.message} {...register('name')} />
        </div>
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
        {isCompanyLevel && !isEditing && (
          <div className="flex flex-col gap-1">
            <Select label="Warehouse" error={errors.warehouseId?.message} {...register('warehouseId')}>
              <option value="">Select a warehouse</option>
              {warehouses?.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
            <p className="text-xs text-graphite-400">Where the initial stock quantity will be added</p>
          </div>
        )}
      </form>
    </Modal>
  );
}
