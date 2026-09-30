import { apiClient } from '@/lib/apiClient';
import type { PaginatedResult, PurchaseEnquiry, SortDir } from '@/types';

export interface PurchaseEnquiryInput {
  vendorId: string;
  subcategoryId?: string;
  metalType: string;
  grossWeight: number;
  diamondShape?: string;
  diamondQuality?: string;
  diamondPieces?: number;
  diamondCaratWeight?: number;
}

export interface FetchPurchaseEnquiriesPageParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDir?: SortDir;
}

export async function fetchPurchaseEnquiries(): Promise<PurchaseEnquiry[]> {
  const { data } = await apiClient.get<PurchaseEnquiry[]>('/purchase-enquiries');
  return data;
}

export async function fetchPurchaseEnquiriesPage(
  params: FetchPurchaseEnquiriesPageParams,
): Promise<PaginatedResult<PurchaseEnquiry>> {
  const { data } = await apiClient.get<PaginatedResult<PurchaseEnquiry>>('/purchase-enquiries', { params });
  return data;
}

export async function fetchPurchaseEnquiry(id: string): Promise<PurchaseEnquiry> {
  const { data } = await apiClient.get<PurchaseEnquiry>(`/purchase-enquiries/${id}`);
  return data;
}

export async function createPurchaseEnquiry(input: PurchaseEnquiryInput): Promise<PurchaseEnquiry> {
  const { data } = await apiClient.post<PurchaseEnquiry>('/purchase-enquiries', input);
  return data;
}

export async function updatePurchaseEnquiry(id: string, input: PurchaseEnquiryInput): Promise<PurchaseEnquiry> {
  const { data } = await apiClient.patch<PurchaseEnquiry>(`/purchase-enquiries/${id}`, input);
  return data;
}

export async function deletePurchaseEnquiry(id: string): Promise<void> {
  await apiClient.delete(`/purchase-enquiries/${id}`);
}
