import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button, Input, Modal, Select, toast } from '@/components/ui';
import { useAuth } from '@/features/auth/useAuth';
import { useWarehouses } from '@/features/warehouses/hooks';
import { useCategories, useCreateCategory, useCreateProduct, useUpdateProduct } from './hooks';
import type { Product } from '@/types';

const schema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  unitPrice: z.coerce.number().positive('Must be greater than 0'),
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
  const createCategory = useCreateCategory();
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, FormOutput>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (isOpen) {
      setShowNewCategory(false);
      setNewCategoryName('');
      reset({
        sku: product?.sku ?? '',
        name: product?.name ?? '',
        description: product?.description ?? '',
        unitPrice: product?.unitPrice ?? 0,
        quantityInStock: product?.quantityInStock ?? 0,
        reorderLevel: product?.reorderLevel ?? 0,
        categoryId: product?.categoryId ?? '',
        warehouseId: '',
      });
    }
  }, [isOpen, product, reset]);

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    setIsCreatingCategory(true);
    try {
      const created = await createCategory.mutateAsync({ name });
      toast.success('Category created');
      setValue('categoryId', created.id);
      setNewCategoryName('');
      setShowNewCategory(false);
    } catch {
      toast.error('Could not create category');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const onSubmit = async (values: FormOutput) => {
    if (isEditing && product) {
      await updateProduct.mutateAsync({ id: product.id, input: values });
      toast.success('Product updated successfully');
    } else {
      await createProduct.mutateAsync(values);
      toast.success('Product created successfully');
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
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-medium text-graphite-700">Category</label>
            <button
              type="button"
              onClick={() => setShowNewCategory((v) => !v)}
              className="flex cursor-pointer items-center gap-0.5 text-[12px] font-medium text-brand-600 hover:underline"
            >
              <Plus className="h-3 w-3" strokeWidth={2} />
              Add new
            </button>
          </div>
          {showNewCategory ? (
            <div className="flex gap-2">
              <Input
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateCategory();
                  }
                }}
                autoFocus
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCreateCategory}
                isLoading={isCreatingCategory}
              >
                Add
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowNewCategory(false);
                  setNewCategoryName('');
                }}
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </Button>
            </div>
          ) : (
            <Select error={errors.categoryId?.message} {...register('categoryId')}>
              <option value="">Uncategorized</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </div>
        <Input label="Description (optional)" placeholder="Short description" error={errors.description?.message} {...register('description')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Unit price" type="number" step="0.01" min="0" error={errors.unitPrice?.message} {...register('unitPrice')} />
          <Input
            label="Stock qty"
            type="number"
            min="0"
            disabled={isEditing}
            hint={isEditing ? 'Use Restock to change stock' : undefined}
            error={errors.quantityInStock?.message}
            {...register('quantityInStock')}
          />
          <Input label="Reorder level" type="number" min="0" error={errors.reorderLevel?.message} {...register('reorderLevel')} />
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
