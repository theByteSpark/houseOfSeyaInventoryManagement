import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button, Input, Modal, Select } from '@/components/ui';
import { useAuth } from '@/features/auth/useAuth';
import { useWarehouses } from '@/features/warehouses/hooks';
import { useRestockProduct } from './hooks';
import type { Product } from '@/types';

const schema = z.object({
  quantity: z.coerce.number().int().positive('Enter a quantity greater than 0'),
  reason: z.string().optional(),
  warehouseId: z.string().optional(),
});

type FormValues = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function RestockModal({
  isOpen,
  onClose,
  product,
}: {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}) {
  const { user } = useAuth();
  const isCompanyLevel = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';
  const { data: warehouses } = useWarehouses();
  const restock = useRestockProduct();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 1, reason: '', warehouseId: '' },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ quantity: 1, reason: '', warehouseId: '' });
    }
  }, [isOpen, reset]);

  if (!product) return null;

  const onSubmit = async (values: FormOutput) => {
    await restock.mutateAsync({
      id: product.id,
      quantity: values.quantity,
      reason: values.reason,
      warehouseId: values.warehouseId,
    });
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Restock — ${product.name}`}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="restock-form" isLoading={isSubmitting}>
            Add stock
          </Button>
        </>
      }
    >
      <form id="restock-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <p className="text-sm text-graphite-500">
          Current stock: <span className="font-medium text-graphite-800">{product.quantityInStock}</span>
        </p>
        {isCompanyLevel && (
          <Select label="Warehouse" error={errors.warehouseId?.message} {...register('warehouseId')}>
            <option value="">Select a warehouse</option>
            {warehouses?.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        )}
        <Input label="Quantity to add" type="number" min="1" error={errors.quantity?.message} {...register('quantity')} />
        <Input label="Reason (optional)" placeholder="e.g. Supplier delivery #4521" error={errors.reason?.message} {...register('reason')} />
      </form>
    </Modal>
  );
}
