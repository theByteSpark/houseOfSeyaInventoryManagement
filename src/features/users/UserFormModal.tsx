import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Button, Input, Modal, Select } from '@/components/ui';
import { extractErrorMessage } from '@/lib/apiClient';
import { useWarehouses } from '@/features/warehouses/hooks';
import { useCreateUser } from './hooks';
import { ROLE_LABELS } from './roleBadge';

const WAREHOUSE_SCOPED_ROLES = new Set(['USER', 'ADMIN']);

const schema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['USER', 'ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
    warehouseId: z.string().optional(),
  })
  .refine((data) => (WAREHOUSE_SCOPED_ROLES.has(data.role) ? !!data.warehouseId : true), {
    message: 'Select a warehouse for this role',
    path: ['warehouseId'],
  });

type FormValues = z.infer<typeof schema>;

export function UserFormModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const createUser = useCreateUser();
  const { data: warehouses } = useWarehouses();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: 'USER' } });

  const role = watch('role');
  const isWarehouseScoped = WAREHOUSE_SCOPED_ROLES.has(role);

  useEffect(() => {
    if (isOpen) {
      reset({ name: '', email: '', password: '', role: 'USER', warehouseId: '' });
      setServerError(null);
    }
  }, [isOpen, reset]);

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await createUser.mutateAsync({
        ...values,
        warehouseId: isWarehouseScoped ? values.warehouseId : undefined,
      });
      onClose();
    } catch (err) {
      setServerError(extractErrorMessage(err, 'Could not create user.'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add user"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="user-form" isLoading={isSubmitting}>
            Add user
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Name" placeholder="Full name" error={errors.name?.message} {...register('name')} />
        <Input
          label="Email"
          type="email"
          placeholder="name@paragonresin.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Temporary password"
          type="password"
          placeholder="••••••••"
          hint="The user can change this later."
          error={errors.password?.message}
          {...register('password')}
        />
        <Select label="Role" error={errors.role?.message} {...register('role')}>
          <option value="USER">{ROLE_LABELS.USER}</option>
          <option value="COMPANY_ADMIN">{ROLE_LABELS.COMPANY_ADMIN}</option>
        </Select>
        {isWarehouseScoped && (
          <Select label="Warehouse" error={errors.warehouseId?.message} {...register('warehouseId')}>
            <option value="">Select a warehouse</option>
            {warehouses?.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        )}
        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
      </form>
    </Modal>
  );
}
