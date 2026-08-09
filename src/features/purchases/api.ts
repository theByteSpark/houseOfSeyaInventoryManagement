import { apiClient } from '@/lib/apiClient';
import type { PaginatedResult, Purchase, PurchaseStatus, SortDir } from '@/types';

export interface PurchaseLineInput {
  productId: string;
  quantity: number;
  unitCost: number;
}

export interface PurchaseInput {
  vendorId: string;
  items: PurchaseLineInput[];
  warehouseId?: string; // required for COMPANY_ADMIN/SUPER_ADMIN; auto-resolved otherwise
}

export interface ReceiveItemInput {
  productId: string;
  receivedQty: number;
}

export interface ReceiveInput {
  items: ReceiveItemInput[];
}

export interface FetchPurchasesPageParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDir?: SortDir;
  status?: PurchaseStatus | 'ALL';
  warehouseId?: string;
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

export async function orderPurchase(id: string): Promise<Purchase> {
  const { data } = await apiClient.patch<Purchase>(`/purchases/${id}/order`);
  return data;
}

export async function receivePurchaseItems(id: string, input: ReceiveInput): Promise<Purchase> {
  const { data } = await apiClient.patch<Purchase>(`/purchases/${id}/receive`, input);
  return data;
}

export async function cancelPurchase(id: string): Promise<Purchase> {
  const { data } = await apiClient.patch<Purchase>(`/purchases/${id}/cancel`);
  return data;
}
