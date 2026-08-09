import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button, Input, Modal } from '@/components/ui';
import { useCreateWarehouse, useUpdateWarehouse } from './hooks';
import type { Warehouse } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().optional(),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function WarehouseFormModal({
  isOpen,
  onClose,
  warehouse,
}: {
  isOpen: boolean;
  onClose: () => void;
  warehouse?: Warehouse | null;
}) {
  const isEditing = !!warehouse;
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: warehouse?.name ?? '',
        code: warehouse?.code ?? '',
        address: warehouse?.address ?? '',
      });
    }
  }, [isOpen, warehouse, reset]);

  const onSubmit = async (values: FormValues) => {
    if (isEditing && warehouse) {
      await updateWarehouse.mutateAsync({ id: warehouse.id, input: values });
    } else {
      await createWarehouse.mutateAsync(values);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit warehouse' : 'Add warehouse'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="warehouse-form" isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Add warehouse'}
          </Button>
        </>
      }
    >
      <form id="warehouse-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Name" placeholder="Main Warehouse" error={errors.name?.message} {...register('name')} />
        <Input label="Code (optional)" placeholder="MAIN" error={errors.code?.message} {...register('code')} />
        <Input label="Address (optional)" placeholder="Street, city, country" error={errors.address?.message} {...register('address')} />
      </form>
    </Modal>
  );
}
