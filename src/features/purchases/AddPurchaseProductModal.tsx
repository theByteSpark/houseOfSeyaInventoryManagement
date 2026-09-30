import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Button, Card, CardBody, CardHeader, Modal } from '@/components/ui';
import { extractErrorMessage } from '@/lib/apiClient';
import { ProductCostSheetSections, ProductCostSummary } from '@/features/inventory/ProductCostSheetSections';
import { productCostSheetSchema } from '@/features/inventory/productCostSheet';
import { useCreateProduct, useUpdateProduct } from '@/features/inventory/hooks';
import type { Product } from '@/types';

const schema = productCostSheetSchema;

type FormValues = import('zod').input<typeof schema>;
type FormOutput = import('zod').output<typeof schema>;

const EMPTY_DEFAULTS: FormValues = {
  designNumber: '',
  name: '',
  subcategoryId: '',
  metalType: '',
  grossWeight: 0,
  metalRatePerGram: 0,
  diamondShape: '',
  diamondQuality: '',
  diamondPieces: undefined,
  diamondCaratWeight: undefined,
  diamondRate: undefined,
  makingChargePerGram: 0,
  fixedExpense: 0,
  sellingPrice: 0,
};

function defaultsFromProduct(product: Product): FormValues {
  return {
    designNumber: product.designNumber,
    name: product.name,
    subcategoryId: product.subcategoryId ?? '',
    metalType: product.metalType ?? '',
    grossWeight: product.grossWeight ?? 0,
    metalRatePerGram: product.metalRatePerGram ?? 0,
    diamondShape: product.diamondShape ?? '',
    diamondQuality: product.diamondQuality ?? '',
    diamondPieces: product.diamondPieces ?? undefined,
    diamondCaratWeight: product.diamondCaratWeight ?? undefined,
    diamondRate: product.diamondRate ?? undefined,
    makingChargePerGram: product.makingChargePerGram ?? 0,
    fixedExpense: product.fixedExpense,
    sellingPrice: product.sellingPrice,
  };
}

export function AddPurchaseProductModal({
  isOpen,
  onClose,
  product,
  initialValues,
  onAdded,
  onEdited,
}: {
  isOpen: boolean;
  onClose: () => void;
  // When set, the modal edits this already-created product instead of
  // creating a new one — a purchase line's product is a real Product row
  // from the moment it's added, not a local draft.
  product?: Product | null;
  // Partial defaults for create mode only — e.g. carried over from a
  // converted Purchase Enquiry, which only ever captures a subset of the
  // cost sheet (no design number/name/rates/selling price).
  initialValues?: Partial<FormValues>;
  onAdded: (product: Product) => void;
  onEdited: (product: Product) => void;
}) {
  const isEditing = !!product;
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_DEFAULTS,
  });

  useEffect(() => {
    if (!isOpen) return;
    reset(product ? defaultsFromProduct(product) : { ...EMPTY_DEFAULTS, ...initialValues });
    setSubmitError(null);
  }, [isOpen, product, initialValues, reset]);

  const watched = watch();

  const handleClose = () => {
    onClose();
  };

  const onSubmit = async (values: FormOutput) => {
    setSubmitError(null);
    try {
      if (product) {
        // quantityInStock/reorderLevel are carried over unchanged — the
        // backend's updateProduct never touches stock from a plain field
        // update anyway, this just satisfies ProductInput's shape.
        const updated = await updateProduct.mutateAsync({
          id: product.id,
          input: { ...values, quantityInStock: product.quantityInStock, reorderLevel: product.reorderLevel },
        });
        onEdited(updated);
      } else {
        const created = await createProduct.mutateAsync({ ...values, quantityInStock: 0, reorderLevel: 0, status: 'ORDERED' });
        onAdded(created);
      }
    } catch (err) {
      setSubmitError(extractErrorMessage(err, 'Could not save this product.'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit product' : 'Add product'}
      size="xl"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-purchase-product-form" isLoading={createProduct.isPending || updateProduct.isPending}>
            {isEditing ? 'Save changes' : 'Add to purchase'}
          </Button>
        </>
      }
    >
      <form id="add-purchase-product-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <ProductCostSheetSections register={register} errors={errors} watched={watched} />

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
