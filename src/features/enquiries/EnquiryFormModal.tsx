import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { Button, IconButton, Input, Modal, SearchableCombobox, Select } from '@/components/ui';
import { extractErrorMessage } from '@/lib/apiClient';
import { useCustomers } from '@/features/customers/hooks';
import { CustomerFormModal } from '@/features/customers/CustomerFormModal';
import { useAttributeOptions } from '@/features/attributes/hooks';
import { useSubcategoryGroups } from '@/features/inventory/hooks';
import { withCurrentValue } from '@/features/inventory/productCostSheet';
import { useCreateEnquiry, useUpdateEnquiry } from './hooks';
import type { Customer, Enquiry } from '@/types';

const diamondSchema = z.object({
  shape: z.string().min(1, 'Required'),
  quality: z.string().min(1, 'Required'),
  pieces: z.coerce.number().int().positive('Must be > 0'),
  caratWeight: z.coerce.number().positive('Must be > 0'),
});

const schema = z.object({
  customerId: z.string().min(1, 'Select a customer'),
  subcategoryId: z.string().optional(),
  metalType: z.string().min(1, 'Select a metal type'),
  grossWeight: z.coerce.number().positive('Must be greater than 0'),
  diamonds: z.array(diamondSchema).default([]),
});

type FormValues = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

const emptyDiamondRow = { shape: '', quality: '', pieces: 1, caratWeight: 0 };

export function EnquiryFormModal({
  isOpen,
  onClose,
  enquiry,
}: {
  isOpen: boolean;
  onClose: () => void;
  enquiry?: Enquiry | null;
}) {
  const isEditing = !!enquiry;
  const { data: customers } = useCustomers();
  const subcategoriesByCategory = useSubcategoryGroups();
  const { data: metalOptions } = useAttributeOptions('METAL');
  const { data: shapeOptions } = useAttributeOptions('DIAMOND_SHAPE');
  const { data: qualityOptions } = useAttributeOptions('DIAMOND_QUALITY');
  const createEnquiry = useCreateEnquiry();
  const updateEnquiry = useUpdateEnquiry();
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, FormOutput>({ resolver: zodResolver(schema) });

  const { fields, append, remove } = useFieldArray({ control, name: 'diamonds' });
  const watched = watch();

  useEffect(() => {
    if (isOpen) {
      setSubmitError(null);
      reset({
        customerId: enquiry?.customerId ?? '',
        subcategoryId: enquiry?.subcategoryId ?? '',
        metalType: enquiry?.metalType ?? '',
        grossWeight: enquiry?.grossWeight ?? 0,
        diamonds: enquiry?.diamonds.map((d) => ({
          shape: d.shape,
          quality: d.quality,
          pieces: d.pieces,
          caratWeight: d.caratWeight,
        })) ?? [],
      });
    }
  }, [isOpen, enquiry, reset]);

  const onSubmit = async (values: FormOutput) => {
    setSubmitError(null);
    try {
      if (isEditing && enquiry) {
        await updateEnquiry.mutateAsync({ id: enquiry.id, input: values });
      } else {
        await createEnquiry.mutateAsync(values);
      }
      onClose();
    } catch (err) {
      setSubmitError(extractErrorMessage(err, isEditing ? 'Could not update enquiry.' : 'Could not add enquiry.'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit enquiry' : 'Add enquiry'}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="enquiry-form" isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Add enquiry'}
          </Button>
        </>
      }
    >
      <form id="enquiry-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Controller
          control={control}
          name="customerId"
          render={({ field }) => (
            <SearchableCombobox
              label="Customer"
              items={customers ?? []}
              value={field.value || null}
              onChange={(customer: Customer) => field.onChange(customer.id)}
              getOptionLabel={(c) => c.name}
              getOptionValue={(c) => c.id}
              getOptionSublabel={(c) => c.email ?? null}
              placeholder="Search customer by name or email…"
              addNewLabel="Add new customer"
              onAddNew={() => setCustomerModalOpen(true)}
              error={errors.customerId?.message}
            />
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Subcategory" error={errors.subcategoryId?.message} {...register('subcategoryId')}>
            <option value="">Unspecified</option>
            {subcategoriesByCategory.map((group) => (
              <optgroup key={group.categoryName} label={group.categoryName}>
                {group.items?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
          <Select label="Metal" error={errors.metalType?.message} {...register('metalType')}>
            <option value="">Select metal</option>
            {withCurrentValue(metalOptions, watched.metalType).map((opt) => (
              <option key={opt.id} value={opt.label}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <Input
          label="Gr.Wt (grams)"
          type="number"
          step="0.001"
          min="0"
          error={errors.grossWeight?.message}
          {...register('grossWeight')}
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-medium text-graphite-700">Diamonds</p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => append(emptyDiamondRow)}
              icon={<Plus className="h-3.5 w-3.5" strokeWidth={2} />}
            >
              Add diamond
            </Button>
          </div>
          {fields.length === 0 && (
            <p className="text-sm text-graphite-400">No diamonds noted for this enquiry. Use "Add diamond" if there are any.</p>
          )}
          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 items-end gap-3 rounded-lg border border-graphite-100 p-3 sm:grid-cols-12">
                <div className="sm:col-span-4">
                  <Select label="Shape" error={errors.diamonds?.[index]?.shape?.message} {...register(`diamonds.${index}.shape`)}>
                    <option value="">Select</option>
                    {withCurrentValue(shapeOptions, watched.diamonds?.[index]?.shape).map((opt) => (
                      <option key={opt.id} value={opt.label}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="sm:col-span-4">
                  <Select label="Quality" error={errors.diamonds?.[index]?.quality?.message} {...register(`diamonds.${index}.quality`)}>
                    <option value="">Select</option>
                    {withCurrentValue(qualityOptions, watched.diamonds?.[index]?.quality).map((opt) => (
                      <option key={opt.id} value={opt.label}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="sm:col-span-1">
                  <Input label="Pcs" type="number" min="1" error={errors.diamonds?.[index]?.pieces?.message} {...register(`diamonds.${index}.pieces`)} />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Ct.Wt"
                    type="number"
                    step="0.001"
                    min="0"
                    error={errors.diamonds?.[index]?.caratWeight?.message}
                    {...register(`diamonds.${index}.caratWeight`)}
                  />
                </div>
                <div className="flex justify-end sm:col-span-1">
                  <IconButton label="Remove diamond" tone="danger" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" strokeWidth={2} />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        </div>

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}
      </form>

      <CustomerFormModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onCreated={(customer) => {
          setValue('customerId', customer.id, { shouldValidate: true });
          setCustomerModalOpen(false);
        }}
      />
    </Modal>
  );
}
