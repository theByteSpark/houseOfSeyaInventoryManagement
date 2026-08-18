import { apiClient } from '@/lib/apiClient';
import type { PaginatedResult, SortDir, Vendor } from '@/types';

export interface VendorInput {
  companyName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface FetchVendorsPageParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDir?: SortDir;
}

export async function fetchVendors(): Promise<Vendor[]> {
  const { data } = await apiClient.get<Vendor[]>('/vendors');
  return data;
}

export async function fetchVendorsPage(params: FetchVendorsPageParams): Promise<PaginatedResult<Vendor>> {
  const { data } = await apiClient.get<PaginatedResult<Vendor>>('/vendors', { params });
  return data;
}

export async function fetchVendor(id: string): Promise<Vendor> {
  const { data } = await apiClient.get<Vendor>(`/vendors/${id}`);
  return data;
}

export async function createVendor(input: VendorInput): Promise<Vendor> {
  const { data } = await apiClient.post<Vendor>('/vendors', input);
  return data;
}

export async function updateVendor(id: string, input: VendorInput): Promise<Vendor> {
  const { data } = await apiClient.patch<Vendor>(`/vendors/${id}`, input);
  return data;
}

export async function deleteVendor(id: string): Promise<void> {
  await apiClient.delete(`/vendors/${id}`);
}
