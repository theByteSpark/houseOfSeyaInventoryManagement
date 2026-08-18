import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button, Input, Modal } from '@/components/ui';
import { useWarehouseContext } from '@/features/warehouses/WarehouseContext';
import { useRestockProduct } from './hooks';
import type { Product } from '@/types';

const schema = z.object({
  quantity: z.coerce.number().int().positive('Enter a quantity greater than 0'),
  reason: z.string().optional(),
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
  const { selectedWarehouseId } = useWarehouseContext();
  const restock = useRestockProduct();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 1, reason: '' },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ quantity: 1, reason: '' });
    }
  }, [isOpen, reset]);

  if (!product) return null;

  const onSubmit = async (values: FormOutput) => {
    await restock.mutateAsync({
      id: product.id,
      quantity: values.quantity,
      reason: values.reason,
      warehouseId: selectedWarehouseId ?? undefined,
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
          Current stock: <span className="font-medium text-graphite-800">{product.quantityInStock} kgs</span>
        </p>
        <Input label="Quantity to add (kgs)" type="number" min="1" error={errors.quantity?.message} {...register('quantity')} />
        <Input label="Reason (optional)" placeholder="e.g. Supplier delivery #4521" error={errors.reason?.message} {...register('reason')} />
      </form>
    </Modal>
  );
}
