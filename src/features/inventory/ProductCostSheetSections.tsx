import { useMemo } from 'react';
import { useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Card, CardBody, CardHeader, IconButton, Input, Select } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { useAttributeOptions } from '@/features/attributes/hooks';
import { useSubcategories } from './hooks';
import { computeCosts, emptyDiamondRow, withCurrentValue } from './productCostSheet';

// register/control/errors are typed loosely on purpose: this section is shared by two different
// form shapes (ProductFormPage's own fields + this shared core, and the purchase quick-create
// modal's own fields + this shared core) that only agree on the field NAMES used below, not on
// react-hook-form's exact generic FieldValues type.
interface ProductCostSheetSectionsProps {
  register: any;
  control: any;
  errors: any;
  watched: {
    metalType?: string;
    grossWeight?: unknown;
    metalRatePerGram?: unknown;
    makingChargePerGram?: unknown;
    fixedExpense?: unknown;
    diamonds?: { shape?: string; quality?: string; caratWeight?: unknown; rate?: unknown }[];
  };
}

export function ProductCostSheetSections({ register, control, errors, watched }: ProductCostSheetSectionsProps) {
  const { data: subcategories } = useSubcategories();
  const { data: metalOptions } = useAttributeOptions('METAL');
  const { data: shapeOptions } = useAttributeOptions('DIAMOND_SHAPE');
  const { data: qualityOptions } = useAttributeOptions('DIAMOND_QUALITY');
  const { fields, append, remove } = useFieldArray({ control, name: 'diamonds' });
  const costs = computeCosts(watched);

  const subcategoriesByCategory = useMemo(() => {
    const groups = new Map<string, { categoryName: string; items: typeof subcategories }>();
    for (const s of subcategories ?? []) {
      if (!groups.has(s.categoryId)) groups.set(s.categoryId, { categoryName: s.categoryName, items: [] });
      groups.get(s.categoryId)!.items!.push(s);
    }
    return [...groups.values()];
  }, [subcategories]);

  return (
    <>
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
          {fields.map((field: { id: string }, index: number) => (
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
    </>
  );
}

interface ProductCostSummaryProps {
  register: any;
  errors: any;
  watched: {
    metalType?: string;
    grossWeight?: unknown;
    metalRatePerGram?: unknown;
    makingChargePerGram?: unknown;
    fixedExpense?: unknown;
    diamonds?: { shape?: string; quality?: string; caratWeight?: unknown; rate?: unknown }[];
  };
}

/** Total Cost / Tax / Final Amount readout + the one field that isn't computed: Selling Price. */
export function ProductCostSummary({ register, errors, watched }: ProductCostSummaryProps) {
  const costs = computeCosts(watched);

  return (
    <>
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
    </>
  );
}
