import { apiClient } from '@/lib/apiClient';
import type { PaginatedResult, SortDir, Warehouse } from '@/types';

export interface WarehouseInput {
  name: string;
  code?: string;
  address?: string;
  isActive?: boolean;
}

export interface FetchWarehousesPageParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDir?: SortDir;
}

export async function fetchWarehouses(): Promise<Warehouse[]> {
  const { data } = await apiClient.get<Warehouse[]>('/warehouses');
  return data;
}

export async function fetchWarehousesPage(params: FetchWarehousesPageParams): Promise<PaginatedResult<Warehouse>> {
  const { data } = await apiClient.get<PaginatedResult<Warehouse>>('/warehouses', { params });
  return data;
}

export async function fetchWarehouse(id: string): Promise<Warehouse> {
  const { data } = await apiClient.get<Warehouse>(`/warehouses/${id}`);
  return data;
}

export async function createWarehouse(input: WarehouseInput): Promise<Warehouse> {
  const { data } = await apiClient.post<Warehouse>('/warehouses', input);
  return data;
}

export async function updateWarehouse(id: string, input: WarehouseInput): Promise<Warehouse> {
  const { data } = await apiClient.patch<Warehouse>(`/warehouses/${id}`, input);
  return data;
}

export async function deleteWarehouse(id: string): Promise<void> {
  await apiClient.delete(`/warehouses/${id}`);
}
