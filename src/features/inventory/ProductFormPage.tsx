import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  FullPageSpinner,
  IconButton,
  Input,
  PageHeader,
  Select,
} from '@/components/ui';
import { extractErrorMessage } from '@/lib/apiClient';
import { formatCurrency } from '@/lib/format';
import { useAttributeOptions } from '@/features/attributes/hooks';
import { useCreateProduct, useProduct, useSubcategories, useUpdateProduct } from './hooks';

const TAX_RATE = 0.03;

const diamondSchema = z.object({
  shape: z.string().min(1, 'Required'),
  quality: z.string().min(1, 'Required'),
  pieces: z.coerce.number().int().positive('Must be > 0'),
  caratWeight: z.coerce.number().positive('Must be > 0'),
  weight: z.coerce.number().positive('Must be > 0'),
  rate: z.coerce.number().positive('Must be > 0'),
});

const schema = z.object({
  designNumber: z.string().min(1, 'Design number is required'),
  name: z.string().min(1, 'Name is required'),
  subcategoryId: z.string().optional(),
  metalType: z.string().min(1, 'Select a metal type'),
  grossWeight: z.coerce.number().positive('Must be greater than 0'),
  metalRatePerGram: z.coerce.number().positive('Must be greater than 0'),
  diamonds: z.array(diamondSchema).default([]),
  makingChargePerGram: z.coerce.number().min(0, 'Cannot be negative'),
  fixedExpense: z.coerce.number().min(0, 'Cannot be negative'),
  sellingPrice: z.coerce.number().positive('Must be greater than 0'),
  quantityInStock: z.coerce.number().int().min(0, 'Cannot be negative'),
  reorderLevel: z.coerce.number().int().min(0, 'Cannot be negative'),
});

type FormValues = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

function round2(n: number): number {
  return Math.round((Number.isFinite(n) ? n : 0) * 100) / 100;
}

function computeCosts(values: {
  grossWeight?: unknown;
  metalRatePerGram?: unknown;
  makingChargePerGram?: unknown;
  fixedExpense?: unknown;
  diamonds?: { caratWeight?: unknown; rate?: unknown }[];
}) {
  const grossWeight = Number(values.grossWeight) || 0;
  const metalRatePerGram = Number(values.metalRatePerGram) || 0;
  const makingChargePerGram = Number(values.makingChargePerGram) || 0;
  const fixedExpense = Number(values.fixedExpense) || 0;

  const metalCost = round2(grossWeight * metalRatePerGram);
  const labourCost = round2(grossWeight * makingChargePerGram);
  const diamondAmounts = (values.diamonds ?? []).map((d) => round2((Number(d.caratWeight) || 0) * (Number(d.rate) || 0)));
  const totalDiamondCost = round2(diamondAmounts.reduce((sum, a) => sum + a, 0));
  const totalCost = round2(metalCost + totalDiamondCost + labourCost + fixedExpense);
  const taxAmount = round2(totalCost * TAX_RATE);
  const finalAmount = round2(totalCost + taxAmount);

  return { metalCost, labourCost, diamondAmounts, totalDiamondCost, totalCost, taxAmount, finalAmount };
}

function withCurrentValue(options: { id: string; label: string }[] | undefined, current: string | undefined) {
  const list = options ?? [];
  if (!current || list.some((o) => o.label === current)) return list;
  return [...list, { id: `current-${current}`, label: current }];
}

const emptyDiamondRow = { shape: '', quality: '', pieces: 1, caratWeight: 0, weight: 0, rate: 0 };

export function ProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: product, isLoading: isLoadingProduct } = useProduct(id);
  const { data: subcategories } = useSubcategories();
  const { data: metalOptions } = useAttributeOptions('METAL');
  const { data: shapeOptions } = useAttributeOptions('DIAMOND_SHAPE');
  const { data: qualityOptions } = useAttributeOptions('DIAMOND_QUALITY');
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { diamonds: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'diamonds' });
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
      diamonds: product?.diamonds.map((d) => ({
        shape: d.shape,
        quality: d.quality,
        pieces: d.pieces,
        caratWeight: d.caratWeight,
        weight: d.weight,
        rate: d.rate,
      })) ?? [],
      makingChargePerGram: product?.makingChargePerGram ?? 0,
      fixedExpense: product?.fixedExpense ?? 0,
      sellingPrice: product?.sellingPrice ?? 0,
      quantityInStock: product?.quantityInStock ?? 0,
      reorderLevel: product?.reorderLevel ?? 0,
    });
  }, [isEdit, product, reset]);

  const subcategoriesByCategory = useMemo(() => {
    const groups = new Map<string, { categoryName: string; items: typeof subcategories }>();
    for (const s of subcategories ?? []) {
      if (!groups.has(s.categoryId)) groups.set(s.categoryId, { categoryName: s.categoryName, items: [] });
      groups.get(s.categoryId)!.items!.push(s);
    }
    return [...groups.values()];
  }, [subcategories]);

  const watched = watch();
  const costs = computeCosts(watched);

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
            <Card>
              <CardHeader title="Product details" />
              <CardBody className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input label="Design number" placeholder="RNG-ENG-001" error={errors.designNumber?.message} {...register('designNumber')} />
                  <Input label="Product name" placeholder="Solitaire Engagement Ring" error={errors.name?.message} {...register('name')} />
                </div>
                <Select label="Subcategory" error={errors.subcategoryId?.message} {...register('subcategoryId')}>
                  <option value="">Uncategorized</option>
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Metal" />
              <CardBody className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Select label="Metal type" error={errors.metalType?.message} {...register('metalType')}>
                    <option value="">Select metal</option>
                    {withCurrentValue(metalOptions, watched.metalType).map((opt) => (
                      <option key={opt.id} value={opt.label}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                  <Input
                    label="Gr.Wt (grams)"
                    type="number"
                    step="0.001"
                    min="0"
                    error={errors.grossWeight?.message}
                    {...register('grossWeight')}
                  />
                  <Input
                    label="Metal price / gm"
                    type="number"
                    step="0.01"
                    min="0"
                    error={errors.metalRatePerGram?.message}
                    {...register('metalRatePerGram')}
                  />
                </div>
                <div className="flex justify-end text-sm">
                  <span className="text-graphite-500">Metal cost:&nbsp;</span>
                  <span className="font-semibold text-graphite-900">{formatCurrency(costs.metalCost)}</span>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Diamond"
                action={
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => append(emptyDiamondRow)}
                    icon={<Plus className="h-3.5 w-3.5" strokeWidth={2} />}
                  >
                    Add diamond
                  </Button>
                }
              />
              <CardBody className="flex flex-col gap-3">
                {fields.length === 0 && (
                  <p className="text-sm text-graphite-400">No diamonds on this design. Use "Add diamond" if it has one or more.</p>
                )}
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 items-end gap-3 rounded-lg border border-graphite-100 p-3 sm:grid-cols-12">
                    <div className="sm:col-span-2">
                      <Select label="Shape" error={errors.diamonds?.[index]?.shape?.message} {...register(`diamonds.${index}.shape`)}>
                        <option value="">Select</option>
                        {withCurrentValue(shapeOptions, watched.diamonds?.[index]?.shape).map((opt) => (
                          <option key={opt.id} value={opt.label}>
                            {opt.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="sm:col-span-2">
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
                    <div className="sm:col-span-1">
                      <Input
                        label="Wt"
                        type="number"
                        step="0.001"
                        min="0"
                        error={errors.diamonds?.[index]?.weight?.message}
                        {...register(`diamonds.${index}.weight`)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input label="Rate" type="number" step="0.01" min="0" error={errors.diamonds?.[index]?.rate?.message} {...register(`diamonds.${index}.rate`)} />
                    </div>
                    <div className="flex items-end justify-between gap-2 sm:col-span-1 sm:block sm:text-right">
                      <p className="text-xs text-graphite-400">Amount</p>
                      <p className="text-sm font-medium text-graphite-800">{formatCurrency(costs.diamondAmounts[index] ?? 0)}</p>
                    </div>
                    <div className="flex justify-end sm:col-span-1">
                      <IconButton label="Remove diamond" tone="danger" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </IconButton>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end border-t border-graphite-100 pt-3 text-sm">
                  <span className="text-graphite-500">Total diamond cost:&nbsp;</span>
                  <span className="font-semibold text-graphite-900">{formatCurrency(costs.totalDiamondCost)}</span>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Labour & other costs" />
              <CardBody className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Making charge / gm"
                    type="number"
                    step="0.01"
                    min="0"
                    error={errors.makingChargePerGram?.message}
                    {...register('makingChargePerGram')}
                  />
                  <Input
                    label="Fixed expense"
                    type="number"
                    step="0.01"
                    min="0"
                    error={errors.fixedExpense?.message}
                    {...register('fixedExpense')}
                  />
                </div>
                <div className="flex justify-end text-sm">
                  <span className="text-graphite-500">Labour charge:&nbsp;</span>
                  <span className="font-semibold text-graphite-900">{formatCurrency(costs.labourCost)}</span>
                </div>
              </CardBody>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader title="Cost summary" />
              <CardBody>
                <dl className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-graphite-500">Total cost</dt>
                    <dd className="font-medium text-graphite-800">{formatCurrency(costs.totalCost)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-graphite-500">Tax (3%)</dt>
                    <dd className="font-medium text-graphite-800">{formatCurrency(costs.taxAmount)}</dd>
                  </div>
                  <div className="mt-1 flex justify-between border-t border-graphite-100 pt-2 text-base">
                    <dt className="font-semibold text-graphite-900">Final amount</dt>
                    <dd className="font-semibold text-graphite-900">{formatCurrency(costs.finalAmount)}</dd>
                  </div>
                </dl>

                <div className="mt-4">
                  <Input
                    label="Selling price"
                    type="number"
                    step="0.01"
                    min="0"
                    error={errors.sellingPrice?.message}
                    {...register('sellingPrice')}
                  />
                </div>

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
