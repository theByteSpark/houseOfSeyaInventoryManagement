import { z } from 'zod';

export const TAX_RATE = 0.03;

export const productCostSheetSchema = z.object({
  designNumber: z.string().min(1, 'Design number is required'),
  name: z.string().min(1, 'Name is required'),
  subcategoryId: z.string().optional(),
  metalType: z.string().min(1, 'Select a metal type'),
  grossWeight: z.coerce.number().positive('Must be greater than 0'),
  metalRatePerGram: z.coerce.number().positive('Must be greater than 0'),
  diamondShape: z.string().optional(),
  diamondQuality: z.string().optional(),
  diamondPieces: z.coerce.number().int().positive('Must be > 0').optional(),
  diamondCaratWeight: z.coerce.number().positive('Must be > 0').optional(),
  diamondWeight: z.coerce.number().positive('Must be > 0').optional(),
  diamondRate: z.coerce.number().positive('Must be > 0').optional(),
  makingChargePerGram: z.coerce.number().min(0, 'Cannot be negative'),
  fixedExpense: z.coerce.number().min(0, 'Cannot be negative'),
  sellingPrice: z.coerce.number().positive('Must be greater than 0'),
});

function round2(n: number): number {
  return Math.round((Number.isFinite(n) ? n : 0) * 100) / 100;
}

export function computeCosts(values: {
  grossWeight?: unknown;
  metalRatePerGram?: unknown;
  makingChargePerGram?: unknown;
  fixedExpense?: unknown;
  diamondCaratWeight?: unknown;
  diamondRate?: unknown;
}) {
  const grossWeight = Number(values.grossWeight) || 0;
  const metalRatePerGram = Number(values.metalRatePerGram) || 0;
  const makingChargePerGram = Number(values.makingChargePerGram) || 0;
  const fixedExpense = Number(values.fixedExpense) || 0;
  const diamondCaratWeight = Number(values.diamondCaratWeight) || 0;
  const diamondRate = Number(values.diamondRate) || 0;

  const metalCost = round2(grossWeight * metalRatePerGram);
  const labourCost = round2(grossWeight * makingChargePerGram);
  const diamondCost = round2(diamondCaratWeight * diamondRate);
  const totalCost = round2(metalCost + diamondCost + labourCost + fixedExpense);
  const taxAmount = round2(totalCost * TAX_RATE);
  const finalAmount = round2(totalCost + taxAmount);

  return { metalCost, labourCost, diamondCost, totalCost, taxAmount, finalAmount };
}

export function withCurrentValue(options: { id: string; label: string }[] | undefined, current: string | undefined) {
  const list = options ?? [];
  if (!current || list.some((o) => o.label === current)) return list;
  return [...list, { id: `current-${current}`, label: current }];
}
