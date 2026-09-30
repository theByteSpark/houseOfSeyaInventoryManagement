import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Modal, SearchableCombobox, Select } from '@/components/ui';
import { extractErrorMessage } from '@/lib/apiClient';
import { useVendors } from '@/features/vendors/hooks';
import { VendorFormModal } from '@/features/vendors/VendorFormModal';
import { useAttributeOptions } from '@/features/attributes/hooks';
import { useSubcategoryGroups } from '@/features/inventory/hooks';
import { withCurrentValue } from '@/features/inventory/productCostSheet';
import { useCreatePurchaseEnquiry, useUpdatePurchaseEnquiry } from './hooks';
import type { PurchaseEnquiry, Vendor } from '@/types';

const schema = z.object({
  vendorId: z.string().min(1, 'Select a vendor'),
  subcategoryId: z.string().optional(),
  metalType: z.string().min(1, 'Select a metal type'),
  grossWeight: z.coerce.number().positive('Must be greater than 0'),
  diamondShape: z.string().optional(),
  diamondQuality: z.string().optional(),
  diamondPieces: z.coerce.number().int().positive('Must be > 0').optional(),
  diamondCaratWeight: z.coerce.number().positive('Must be > 0').optional(),
});

type FormValues = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function PurchaseEnquiryFormModal({
  isOpen,
  onClose,
  enquiry,
}: {
  isOpen: boolean;
  onClose: () => void;
  enquiry?: PurchaseEnquiry | null;
}) {
  const isEditing = !!enquiry;
  const { data: vendors } = useVendors();
  const subcategoriesByCategory = useSubcategoryGroups();
  const { data: metalOptions } = useAttributeOptions('METAL');
  const { data: shapeOptions } = useAttributeOptions('DIAMOND_SHAPE');
  const { data: qualityOptions } = useAttributeOptions('DIAMOND_QUALITY');
  const createPurchaseEnquiry = useCreatePurchaseEnquiry();
  const updatePurchaseEnquiry = useUpdatePurchaseEnquiry();
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
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

  const watched = watch();

  useEffect(() => {
    if (isOpen) {
      setSubmitError(null);
      reset({
        vendorId: enquiry?.vendorId ?? '',
        subcategoryId: enquiry?.subcategoryId ?? '',
        metalType: enquiry?.metalType ?? '',
        grossWeight: enquiry?.grossWeight ?? 0,
        diamondShape: enquiry?.diamondShape ?? '',
        diamondQuality: enquiry?.diamondQuality ?? '',
        diamondPieces: enquiry?.diamondPieces ?? undefined,
        diamondCaratWeight: enquiry?.diamondCaratWeight ?? undefined,
      });
    }
  }, [isOpen, enquiry, reset]);

  const onSubmit = async (values: FormOutput) => {
    setSubmitError(null);
    try {
      if (isEditing && enquiry) {
        await updatePurchaseEnquiry.mutateAsync({ id: enquiry.id, input: values });
      } else {
        await createPurchaseEnquiry.mutateAsync(values);
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
      title={isEditing ? 'Edit purchase order' : 'Add purchase order'}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="purchase-enquiry-form" isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Add purchase order'}
          </Button>
        </>
      }
    >
      <form id="purchase-enquiry-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Controller
          control={control}
          name="vendorId"
          render={({ field }) => (
            <SearchableCombobox
              label="Vendor"
              items={vendors ?? []}
              value={field.value || null}
              onChange={(vendor: Vendor) => field.onChange(vendor.id)}
              getOptionLabel={(v) => v.companyName}
              getOptionValue={(v) => v.id}
              getOptionSublabel={(v) => v.contactPerson ?? null}
              placeholder="Search vendor by company or contact…"
              addNewLabel="Add new vendor"
              onAddNew={() => setVendorModalOpen(true)}
              error={errors.vendorId?.message}
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
          <p className="mb-2 text-[13px] font-medium text-graphite-700">Diamond (optional)</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <Select label="Shape" error={errors.diamondShape?.message} {...register('diamondShape')}>
              <option value="">Select</option>
              {withCurrentValue(shapeOptions, watched.diamondShape).map((opt) => (
                <option key={opt.id} value={opt.label}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <Select label="Quality" error={errors.diamondQuality?.message} {...register('diamondQuality')}>
              <option value="">Select</option>
              {withCurrentValue(qualityOptions, watched.diamondQuality).map((opt) => (
                <option key={opt.id} value={opt.label}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <Input label="Pcs" type="number" min="1" error={errors.diamondPieces?.message} {...register('diamondPieces')} />
            <Input
              label="Ct.Wt"
              type="number"
              step="0.001"
              min="0"
              error={errors.diamondCaratWeight?.message}
              {...register('diamondCaratWeight')}
            />
          </div>
        </div>

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}
      </form>

      <VendorFormModal
        isOpen={vendorModalOpen}
        onClose={() => setVendorModalOpen(false)}
        onCreated={(vendor) => {
          setValue('vendorId', vendor.id, { shouldValidate: true });
          setVendorModalOpen(false);
        }}
      />
    </Modal>
  );
}
