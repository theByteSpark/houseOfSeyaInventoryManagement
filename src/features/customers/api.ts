import { apiClient } from '@/lib/apiClient';
import type { Customer, PaginatedResult, SortDir } from '@/types';

export interface CustomerInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface FetchCustomersPageParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDir?: SortDir;
}

export async function fetchCustomers(): Promise<Customer[]> {
  const { data } = await apiClient.get<Customer[]>('/customers');
  return data;
}

export async function fetchCustomersPage(params: FetchCustomersPageParams): Promise<PaginatedResult<Customer>> {
  const { data } = await apiClient.get<PaginatedResult<Customer>>('/customers', { params });
  return data;
}

export async function fetchCustomer(id: string): Promise<Customer> {
  const { data } = await apiClient.get<Customer>(`/customers/${id}`);
  return data;
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  const { data } = await apiClient.post<Customer>('/customers', input);
  return data;
}

export async function updateCustomer(id: string, input: CustomerInput): Promise<Customer> {
  const { data } = await apiClient.patch<Customer>(`/customers/${id}`, input);
  return data;
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiClient.delete(`/customers/${id}`);
}
