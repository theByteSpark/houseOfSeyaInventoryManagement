import { apiClient } from '@/lib/apiClient';
import type { BlockedQuantity, Sale } from '@/types';

export interface CreateBlockedQuantityInput {
  productId: string;
  quantity: number;
  warehouseId?: string;
}

export interface EditBlockedQuantityInput {
  additionalQuantity: number;
}

export interface ConfirmBlockedQuantityInput {
  customerId: string;
  unitPrice: number;
}

export interface FetchBlockedQuantitiesParams {
  status?: 'OPEN' | 'CONFIRMED' | 'CANCELLED' | 'ALL';
  warehouseId?: string;
  productId?: string;
}

export async function fetchBlockedQuantities(params?: FetchBlockedQuantitiesParams): Promise<BlockedQuantity[]> {
  const { data } = await apiClient.get<BlockedQuantity[]>('/blocked-quantities', { params });
  return data;
}

export async function createBlockedQuantity(input: CreateBlockedQuantityInput): Promise<BlockedQuantity> {
  const { data } = await apiClient.post<BlockedQuantity>('/blocked-quantities', input);
  return data;
}

export async function editBlockedQuantity(id: string, input: EditBlockedQuantityInput): Promise<BlockedQuantity> {
  const { data } = await apiClient.patch<BlockedQuantity>(`/blocked-quantities/${id}`, input);
  return data;
}

export async function deleteBlockedQuantity(id: string): Promise<void> {
  await apiClient.delete(`/blocked-quantities/${id}`);
}

export async function confirmBlockedQuantity(id: string, input: ConfirmBlockedQuantityInput): Promise<Sale> {
  const { data } = await apiClient.post<Sale>(`/blocked-quantities/${id}/confirm`, input);
  return data;
}
