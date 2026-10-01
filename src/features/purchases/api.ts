import { apiClient } from '@/lib/apiClient';
import type { PaginatedResult, Purchase, PurchaseStatus, SortDir } from '@/types';

export interface PurchaseLineInput {
  productId: string;
  quantity: number;
  unitCost: number;
}

export interface PurchaseInput {
  vendorId: string;
  vendorInvoiceNumber?: string;
  vendorInvoiceDate?: string;
  items: PurchaseLineInput[];
}

export interface FetchPurchasesPageParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDir?: SortDir;
  status?: PurchaseStatus | 'ALL';
}

export async function fetchPurchases(): Promise<Purchase[]> {
  const { data } = await apiClient.get<Purchase[]>('/purchases');
  return data;
}

export async function fetchPurchasesPage(params: FetchPurchasesPageParams): Promise<PaginatedResult<Purchase>> {
  const { data } = await apiClient.get<PaginatedResult<Purchase>>('/purchases', { params });
  return data;
}

export async function fetchPurchase(id: string): Promise<Purchase> {
  const { data } = await apiClient.get<Purchase>(`/purchases/${id}`);
  return data;
}

export async function createPurchase(input: PurchaseInput): Promise<Purchase> {
  const { data } = await apiClient.post<Purchase>('/purchases', input);
  return data;
}

export async function updatePurchase(id: string, input: PurchaseInput): Promise<Purchase> {
  const { data } = await apiClient.patch<Purchase>(`/purchases/${id}`, input);
  return data;
}

export async function receivePurchase(id: string): Promise<Purchase> {
  const { data } = await apiClient.patch<Purchase>(`/purchases/${id}/receive`);
  return data;
}

export async function cancelPurchase(id: string): Promise<Purchase> {
  const { data } = await apiClient.patch<Purchase>(`/purchases/${id}/cancel`);
  return data;
}
