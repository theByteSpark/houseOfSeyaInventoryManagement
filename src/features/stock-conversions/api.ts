import { apiClient } from '@/lib/apiClient';
import type { StockConversion } from '@/types';

export interface CreateConversionInput {
  fromProductId: string;
  toProductId: string;
  warehouseId: string;
  quantity: number;
}

export async function fetchConversions(): Promise<StockConversion[]> {
  const { data } = await apiClient.get<StockConversion[]>('/stock-conversions');
  return data;
}

export async function createConversion(input: CreateConversionInput): Promise<StockConversion> {
  const { data } = await apiClient.post<StockConversion>('/stock-conversions', input);
  return data;
}
