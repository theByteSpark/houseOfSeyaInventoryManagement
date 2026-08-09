import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button, Input, Modal, Select, toast } from '@/components/ui';
import { COUNTRY_CODES, DEFAULT_COUNTRY_DIAL_CODE, joinPhoneNumber, splitPhoneNumber } from '@/lib/countryCodes';
import { useCreateVendor, useUpdateVendor } from './hooks';
import type { Vendor } from '@/types';

const schema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactPerson: z.string().optional(),
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

export function VendorFormModal({
  isOpen,
  onClose,
  vendor,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  vendor?: Vendor | null;
  onCreated?: (vendor: Vendor) => void;
}) {
  const isEditing = !!vendor;
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (isOpen) {
      const { dialCode, number } = splitPhoneNumber(vendor?.phone);
      reset({
        companyName: vendor?.companyName ?? '',
        contactPerson: vendor?.contactPerson ?? '',
        email: vendor?.email ?? '',
        phoneDialCode: dialCode || DEFAULT_COUNTRY_DIAL_CODE,
        phoneNumber: number,
        address: vendor?.address ?? '',
      });
    }
  }, [isOpen, vendor, reset]);

  const onSubmit = async (values: FormValues) => {
    const input = {
      companyName: values.companyName,
      contactPerson: values.contactPerson,
      email: values.email,
      phone: joinPhoneNumber(values.phoneDialCode, values.phoneNumber ?? ''),
      address: values.address,
    };
    if (isEditing && vendor) {
      await updateVendor.mutateAsync({ id: vendor.id, input });
      toast.success('Vendor updated successfully');
      onClose();
    } else {
      const created = await createVendor.mutateAsync(input);
      toast.success('Vendor created successfully');
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
      title={isEditing ? 'Edit vendor' : 'Add vendor'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="vendor-form" isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Add vendor'}
          </Button>
        </>
      }
    >
      <form id="vendor-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Company name" placeholder="Business / company name" error={errors.companyName?.message} {...register('companyName')} />
        <Input label="Contact person" placeholder="Person you deal with" error={errors.contactPerson?.message} {...register('contactPerson')} />
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
