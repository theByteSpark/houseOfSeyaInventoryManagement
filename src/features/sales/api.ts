import { apiClient } from '@/lib/apiClient';
import type { PaginatedResult, Sale, SaleStatus, SortDir } from '@/types';

export interface SaleLineInput {
  productId: string;
  quantity: number;
}

export interface SaleInput {
  customerId: string;
  items: SaleLineInput[];
}

export interface FetchSalesPageParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDir?: SortDir;
  status?: SaleStatus | 'ALL';
}

export async function fetchSales(): Promise<Sale[]> {
  const { data } = await apiClient.get<Sale[]>('/sales');
  return data;
}

export async function fetchSalesPage(params: FetchSalesPageParams): Promise<PaginatedResult<Sale>> {
  const { data } = await apiClient.get<PaginatedResult<Sale>>('/sales', { params });
  return data;
}

export async function fetchSale(id: string): Promise<Sale> {
  const { data } = await apiClient.get<Sale>(`/sales/${id}`);
  return data;
}

export async function createSale(input: SaleInput): Promise<Sale> {
  const { data } = await apiClient.post<Sale>('/sales', input);
  return data;
}

export async function updateSale(id: string, input: SaleInput): Promise<Sale> {
  const { data } = await apiClient.patch<Sale>(`/sales/${id}`, input);
  return data;
}

export async function issueSale(id: string): Promise<Sale> {
  const { data } = await apiClient.patch<Sale>(`/sales/${id}/issue`);
  return data;
}

export async function markSalePaid(id: string): Promise<Sale> {
  const { data } = await apiClient.patch<Sale>(`/sales/${id}/pay`);
  return data;
}

export async function cancelSale(id: string): Promise<Sale> {
  const { data } = await apiClient.patch<Sale>(`/sales/${id}/cancel`);
  return data;
}

export async function fetchInvoicePdfBlob(id: string): Promise<Blob> {
  const { data } = await apiClient.get(`/sales/${id}/invoice-pdf`, { responseType: 'blob' });
  return data;
}
