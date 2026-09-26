import { Card, CardBody, CardHeader, Input, Select } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { useAttributeOptions } from '@/features/attributes/hooks';
import { useSubcategoryGroups } from './hooks';
import { computeCosts, withCurrentValue } from './productCostSheet';

// register/errors are typed loosely on purpose: this section is shared by two different
// form shapes (ProductFormPage's own fields + this shared core, and the purchase quick-create
// modal's own fields + this shared core) that only agree on the field NAMES used below, not on
// react-hook-form's exact generic FieldValues type.
interface ProductCostSheetSectionsProps {
  register: any;
  errors: any;
  watched: {
    metalType?: string;
    grossWeight?: unknown;
    metalRatePerGram?: unknown;
    makingChargePerGram?: unknown;
    fixedExpense?: unknown;
    diamondShape?: string;
    diamondQuality?: string;
    diamondCaratWeight?: unknown;
    diamondRate?: unknown;
  };
}

export function ProductCostSheetSections({ register, errors, watched }: ProductCostSheetSectionsProps) {
  const subcategoriesByCategory = useSubcategoryGroups();
  const { data: metalOptions } = useAttributeOptions('METAL');
  const { data: shapeOptions } = useAttributeOptions('DIAMOND_SHAPE');
  const { data: qualityOptions } = useAttributeOptions('DIAMOND_QUALITY');
  const costs = computeCosts(watched);

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
        <CardHeader title="Diamond" />
        <CardBody className="flex flex-col gap-4">
          <p className="text-xs text-graphite-400">Leave blank if this design has no diamond.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            <Input
              label="Wt"
              type="number"
              step="0.001"
              min="0"
              error={errors.diamondWeight?.message}
              {...register('diamondWeight')}
            />
            <Input label="Rate" type="number" step="0.01" min="0" error={errors.diamondRate?.message} {...register('diamondRate')} />
          </div>
          <div className="flex justify-end text-sm">
            <span className="text-graphite-500">Diamond cost:&nbsp;</span>
            <span className="font-semibold text-graphite-900">{formatCurrency(costs.diamondCost)}</span>
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
    grossWeight?: unknown;
    metalRatePerGram?: unknown;
    makingChargePerGram?: unknown;
    fixedExpense?: unknown;
    diamondCaratWeight?: unknown;
    diamondRate?: unknown;
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
