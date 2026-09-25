import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Card, CardBody, CardHeader, FullPageSpinner, Input, PageHeader } from '@/components/ui';
import { extractErrorMessage } from '@/lib/apiClient';
import { ProductCostSheetSections, ProductCostSummary } from './ProductCostSheetSections';
import { productCostSheetSchema } from './productCostSheet';
import { useCreateProduct, useProduct, useUpdateProduct } from './hooks';

const schema = productCostSheetSchema.extend({
  quantityInStock: z.coerce.number().int().min(0, 'Cannot be negative'),
  reorderLevel: z.coerce.number().int().min(0, 'Cannot be negative'),
});

type FormValues = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function ProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: product, isLoading: isLoadingProduct } = useProduct(id);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(schema),
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && !product) return;
    reset({
      designNumber: product?.designNumber ?? '',
      name: product?.name ?? '',
      subcategoryId: product?.subcategoryId ?? '',
      metalType: product?.metalType ?? '',
      grossWeight: product?.grossWeight ?? 0,
      metalRatePerGram: product?.metalRatePerGram ?? 0,
      diamondShape: product?.diamondShape ?? '',
      diamondQuality: product?.diamondQuality ?? '',
      diamondPieces: product?.diamondPieces ?? undefined,
      diamondCaratWeight: product?.diamondCaratWeight ?? undefined,
      diamondWeight: product?.diamondWeight ?? undefined,
      diamondRate: product?.diamondRate ?? undefined,
      makingChargePerGram: product?.makingChargePerGram ?? 0,
      fixedExpense: product?.fixedExpense ?? 0,
      sellingPrice: product?.sellingPrice ?? 0,
      quantityInStock: product?.quantityInStock ?? 0,
      reorderLevel: product?.reorderLevel ?? 0,
    });
  }, [isEdit, product, reset]);

  const watched = watch();

  const onSubmit = async (values: FormOutput) => {
    setSubmitError(null);
    try {
      if (isEdit && id) {
        await updateProduct.mutateAsync({ id, input: values });
      } else {
        await createProduct.mutateAsync(values);
      }
      navigate('/inventory/products');
    } catch (err) {
      setSubmitError(extractErrorMessage(err, isEdit ? 'Could not update product.' : 'Could not create product.'));
    }
  };

  if (isEdit && isLoadingProduct) return <FullPageSpinner />;

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit product' : 'Add product'}
        description="Build the cost sheet for this design, then set the selling price."
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <ProductCostSheetSections register={register} errors={errors} watched={watched} />

            <Card>
              <CardHeader title="Stock" />
              <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Stock qty"
                  type="number"
                  min="0"
                  disabled={isEdit}
                  hint={isEdit ? 'Use Restock to change stock' : undefined}
                  error={errors.quantityInStock?.message}
                  {...register('quantityInStock')}
                />
                <Input label="Reorder level" type="number" min="0" error={errors.reorderLevel?.message} {...register('reorderLevel')} />
              </CardBody>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader title="Cost summary" />
              <CardBody>
                <ProductCostSummary register={register} errors={errors} watched={watched} />

                {submitError && <p className="mt-4 text-sm text-red-600">{submitError}</p>}

                <Button
                  type="submit"
                  className="mt-6 w-full"
                  isLoading={isEdit ? updateProduct.isPending : createProduct.isPending}
                >
                  {isEdit ? 'Save changes' : 'Add product'}
                </Button>
                <Button type="button" variant="secondary" className="mt-2 w-full" onClick={() => navigate('/inventory/products')}>
                  Cancel
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
