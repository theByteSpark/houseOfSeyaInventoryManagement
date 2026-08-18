import { apiClient } from '@/lib/apiClient';
import type { Enquiry, Purchase, Sale } from '@/types';

export interface EnquiryInput {
  productId: string;
  quantity: number;
}

export interface ConfirmEnquiryInput {
  warehouseId: string;
  vendor: { vendorId: string; quantity: number; price: number };
  customer: { customerId: string; quantity: number; price: number };
}

export interface ConfirmEnquiryResult {
  purchase: Purchase;
  sale: Sale;
  enquiry: { id: string; quantity: number; status: Enquiry['status'] };
}

export interface FetchEnquiriesParams {
  status?: 'OPEN' | 'FULFILLED' | 'ALL';
}

export async function fetchEnquiries(params?: FetchEnquiriesParams): Promise<Enquiry[]> {
  const { data } = await apiClient.get<Enquiry[]>('/enquiries', { params });
  return data;
}

export async function createEnquiry(input: EnquiryInput): Promise<Enquiry> {
  const { data } = await apiClient.post<Enquiry>('/enquiries', input);
  return data;
}

export async function confirmEnquiry(id: string, input: ConfirmEnquiryInput): Promise<ConfirmEnquiryResult> {
  const { data } = await apiClient.post<ConfirmEnquiryResult>(`/enquiries/${id}/confirm`, input);
  return data;
}
