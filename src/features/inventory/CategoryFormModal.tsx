import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button, Input, Modal, toast } from '@/components/ui';
import { useCreateCategory, useUpdateCategory } from './hooks';
import type { Category } from '@/types';

const schema = z.object({ name: z.string().min(1, 'Name is required') });
type FormValues = z.infer<typeof schema>;

export function CategoryFormModal({
  isOpen,
  onClose,
  category,
}: {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
}) {
  const isEditing = !!category;
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (isOpen) {
      reset({ name: category?.name ?? '' });
    }
  }, [isOpen, category, reset]);

  const onSubmit = async (values: FormValues) => {
    if (isEditing && category) {
      await updateCategory.mutateAsync({ id: category.id, input: values });
      toast.success('Category updated successfully');
    } else {
      await createCategory.mutateAsync(values);
      toast.success('Category created successfully');
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit category' : 'Add category'}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Add category'}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Category name" placeholder="e.g. Fabrics" error={errors.name?.message} {...register('name')} />
      </form>
    </Modal>
  );
}
