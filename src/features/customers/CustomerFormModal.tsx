import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button, Input, Modal, Select, toast } from '@/components/ui';
import { COUNTRY_CODES, DEFAULT_COUNTRY_DIAL_CODE, joinPhoneNumber, splitPhoneNumber } from '@/lib/countryCodes';
import { useCreateCustomer, useUpdateCustomer } from './hooks';
import type { Customer } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phoneDialCode: z.string(),
  phoneNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || (val.replace(/[\s\-()]/g, '').length >= 7 && val.replace(/[\s\-()]/g, '').length <= 11 && /^\d[\d\s\-()]*$/),
      'Enter a valid phone number (7-11 digits)',
    ),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CustomerFormModal({
  isOpen,
  onClose,
  customer,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onCreated?: (customer: Customer) => void;
}) {
  const isEditing = !!customer;
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (isOpen) {
      const { dialCode, number } = splitPhoneNumber(customer?.phone);
      reset({
        name: customer?.name ?? '',
        email: customer?.email ?? '',
        phoneDialCode: dialCode || DEFAULT_COUNTRY_DIAL_CODE,
        phoneNumber: number,
        address: customer?.address ?? '',
      });
    }
  }, [isOpen, customer, reset]);

  const onSubmit = async (values: FormValues) => {
    const input = {
      name: values.name,
      email: values.email,
      phone: joinPhoneNumber(values.phoneDialCode, values.phoneNumber ?? ''),
      address: values.address,
    };
    if (isEditing && customer) {
      await updateCustomer.mutateAsync({ id: customer.id, input });
      toast.success('Customer updated successfully');
      onClose();
    } else {
      const created = await createCustomer.mutateAsync(input);
      toast.success('Customer created successfully');
      if (onCreated) {
        onCreated(created);
      } else {
        onClose();
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit customer' : 'Add customer'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="customer-form" isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Add customer'}
          </Button>
        </>
      }
    >
      <form id="customer-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Name" placeholder="Company or contact name" error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" placeholder="name@company.com" error={errors.email?.message} {...register('email')} />
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-graphite-700">Phone</label>
          <div className="flex gap-2">
            <Select className="w-28 shrink-0" aria-label="Country code" {...register('phoneDialCode')}>
              {COUNTRY_CODES.map((country) => (
                <option key={country.code} value={country.dialCode}>
                  {country.dialCode} {country.code}
                </option>
              ))}
            </Select>
            <div className="flex-1">
              <Input
                placeholder="98765 43210"
                error={errors.phoneNumber?.message}
                {...register('phoneNumber')}
              />
            </div>
          </div>
        </div>
        <Input label="Address" placeholder="Street, city, country" error={errors.address?.message} {...register('address')} />
      </form>
    </Modal>
  );
}
