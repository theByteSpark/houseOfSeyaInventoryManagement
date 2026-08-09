import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

export const warehouseKeys = {
  all: ['warehouses'] as const,
  detail: (id: string) => ['warehouses', id] as const,
  page: (params: api.FetchWarehousesPageParams) => ['warehouses', 'page', params] as const,
};

export function useWarehouses() {
  return useQuery({ queryKey: warehouseKeys.all, queryFn: api.fetchWarehouses });
}

export function useWarehousesPage(params: api.FetchWarehousesPageParams) {
  return useQuery({
    queryKey: warehouseKeys.page(params),
    queryFn: () => api.fetchWarehousesPage(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useWarehouse(id: string | undefined) {
  return useQuery({
    queryKey: warehouseKeys.detail(id ?? ''),
    queryFn: () => api.fetchWarehouse(id as string),
    enabled: !!id,
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createWarehouse,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: warehouseKeys.all }),
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: api.WarehouseInput }) =>
      api.updateWarehouse(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: warehouseKeys.all }),
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteWarehouse,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: warehouseKeys.all }),
  });
}
