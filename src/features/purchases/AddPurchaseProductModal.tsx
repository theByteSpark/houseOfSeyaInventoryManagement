import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Button, Card, CardBody, CardHeader, Input, Modal } from '@/components/ui';
import { extractErrorMessage } from '@/lib/apiClient';
import { ProductCostSheetSections, ProductCostSummary } from '@/features/inventory/ProductCostSheetSections';
import { productCostSheetSchema } from '@/features/inventory/productCostSheet';
import { useCreateProduct } from '@/features/inventory/hooks';

const schema = productCostSheetSchema.extend({
  quantity: z.coerce.number().int().positive('Enter a quantity greater than 0'),
  unitCost: z.coerce.number().min(0, 'Cannot be negative'),
});

type FormValues = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export interface AddedPurchaseLine {
  productId: string;
  productName: string;
  designNumber: string;
  quantity: number;
  unitCost: number;
}

export function AddPurchaseProductModal({
  isOpen,
  onClose,
  onAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (line: AddedPurchaseLine) => void;
}) {
  const createProduct = useCreateProduct();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 1, unitCost: 0 },
  });

  const watched = watch();

  const handleClose = () => {
    reset({ quantity: 1, unitCost: 0 });
    setSubmitError(null);
    onClose();
  };

  const onSubmit = async (values: FormOutput) => {
    setSubmitError(null);
    const { quantity, unitCost, ...productInput } = values;
    try {
      const product = await createProduct.mutateAsync({
        ...productInput,
        quantityInStock: 0,
        reorderLevel: 0,
      });
      onAdded({ productId: product.id, productName: product.name, designNumber: product.designNumber, quantity, unitCost });
      reset({ quantity: 1, unitCost: 0 });
    } catch (err) {
      setSubmitError(extractErrorMessage(err, 'Could not create this product.'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add product"
      size="xl"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-purchase-product-form" isLoading={createProduct.isPending}>
            Add to purchase
          </Button>
        </>
      }
    >
      <form id="add-purchase-product-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <ProductCostSheetSections register={register} errors={errors} watched={watched} />

        <Card>
          <CardHeader title="This purchase line" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Quantity" type="number" min="1" error={errors.quantity?.message} {...register('quantity')} />
            <Input label="Unit cost" type="number" step="0.01" min="0" error={errors.unitCost?.message} {...register('unitCost')} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Cost summary" />
          <CardBody>
            <ProductCostSummary register={register} errors={errors} watched={watched} />
          </CardBody>
        </Card>

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}
      </form>
    </Modal>
  );
}
