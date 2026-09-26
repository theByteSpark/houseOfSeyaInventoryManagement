import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Button, Input, Modal } from '@/components/ui';
import { extractErrorMessage } from '@/lib/apiClient';
import { useEditEnquiry } from './hooks';
import type { Enquiry } from '@/types';

const schema = z.object({
  additionalQuantity: z.coerce.number().int('Enter a whole number').positive('Enter a quantity of at least 1'),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export function EditEnquiryModal({
  isOpen,
  onClose,
  enquiry,
}: {
  isOpen: boolean;
  onClose: () => void;
  enquiry: Enquiry | null;
}) {
  const editEnquiry = useEditEnquiry();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (isOpen) {
      setError(null);
      reset({ additionalQuantity: 1 });
    }
  }, [isOpen, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!enquiry) return;
    setError(null);
    try {
      await editEnquiry.mutateAsync({ id: enquiry.id, input: values });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not update enquiry.'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add to enquiry"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="edit-enquiry-form" isLoading={isSubmitting}>
            Add
          </Button>
        </>
      }
    >
      <form id="edit-enquiry-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {enquiry && (
          <p className="text-sm text-graphite-500">
            <span className="font-medium text-graphite-800">{enquiry.productName}</span> currently has{' '}
            {enquiry.quantity} kgs enquired.
          </p>
        )}
        <Input
          label="Additional quantity (kgs)"
          type="number"
          min="1"
          step="1"
          error={errors.additionalQuantity?.message}
          {...register('additionalQuantity')}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}
