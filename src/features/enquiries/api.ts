import { apiClient } from '@/lib/apiClient';
import type { Enquiry, PaginatedResult, SortDir } from '@/types';

export interface EnquiryDiamondInput {
  shape: string;
  quality: string;
  pieces: number;
  caratWeight: number;
}

export interface EnquiryInput {
  customerId: string;
  subcategoryId?: string;
  metalType: string;
  grossWeight: number;
  diamonds: EnquiryDiamondInput[];
}

export interface FetchEnquiriesPageParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDir?: SortDir;
}

export async function fetchEnquiries(): Promise<Enquiry[]> {
  const { data } = await apiClient.get<Enquiry[]>('/enquiries');
  return data;
}

export async function fetchEnquiriesPage(params: FetchEnquiriesPageParams): Promise<PaginatedResult<Enquiry>> {
  const { data } = await apiClient.get<PaginatedResult<Enquiry>>('/enquiries', { params });
  return data;
}

export async function fetchEnquiry(id: string): Promise<Enquiry> {
  const { data } = await apiClient.get<Enquiry>(`/enquiries/${id}`);
  return data;
}

export async function createEnquiry(input: EnquiryInput): Promise<Enquiry> {
  const { data } = await apiClient.post<Enquiry>('/enquiries', input);
  return data;
}

export async function updateEnquiry(id: string, input: EnquiryInput): Promise<Enquiry> {
  const { data } = await apiClient.patch<Enquiry>(`/enquiries/${id}`, input);
  return data;
}

export async function deleteEnquiry(id: string): Promise<void> {
  await apiClient.delete(`/enquiries/${id}`);
}
