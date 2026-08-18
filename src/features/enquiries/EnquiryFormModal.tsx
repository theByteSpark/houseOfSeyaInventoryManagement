import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button, Input, Modal, SearchableCombobox } from '@/components/ui';
import { useProducts } from '@/features/inventory/hooks';
import { useCreateEnquiry } from './hooks';
import type { Product } from '@/types';

const schema = z.object({
  productId: z.string().min(1, 'Select a product'),
  quantity: z.coerce.number().int('Enter a whole number').positive('Enter a quantity of at least 1'),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export function EnquiryFormModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: products } = useProducts();
  const createEnquiry = useCreateEnquiry();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (isOpen) {
      reset({ productId: '', quantity: 1 });
    }
  }, [isOpen, reset]);

  const onSubmit = async (values: FormValues) => {
    await createEnquiry.mutateAsync({ productId: values.productId, quantity: values.quantity });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add enquiry"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="enquiry-form" isLoading={isSubmitting}>
            Add enquiry
          </Button>
        </>
      }
    >
      <form id="enquiry-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Controller
          name="productId"
          control={control}
          render={({ field }) => (
            <SearchableCombobox
              label="Product"
              items={products ?? []}
              value={field.value || null}
              onChange={(product: Product) => field.onChange(product.id)}
              getOptionLabel={(p) => p.name}
              getOptionValue={(p) => p.id}
              getOptionSublabel={(p) => p.sku}
              placeholder="Search product by name or SKU…"
              error={errors.productId?.message}
            />
          )}
        />
        <Input
          label="Quantity (kgs)"
          type="number"
          min="1"
          step="1"
          error={errors.quantity?.message}
          {...register('quantity')}
        />
      </form>
    </Modal>
  );
}
