import { apiClient } from '@/lib/apiClient';
import type { StockTransfer } from '@/types';

export interface CreateTransferInput {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
}

export async function fetchTransfers(): Promise<StockTransfer[]> {
  const { data } = await apiClient.get<StockTransfer[]>('/stock-transfers');
  return data;
}

export async function createTransfer(input: CreateTransferInput): Promise<StockTransfer> {
  const { data } = await apiClient.post<StockTransfer>('/stock-transfers', input);
  return data;
}
