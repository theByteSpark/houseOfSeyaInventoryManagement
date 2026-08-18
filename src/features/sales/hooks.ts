import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import { productKeys } from '@/features/inventory/hooks';

export const saleKeys = {
  all: ['sales'] as const,
  detail: (id: string) => ['sales', id] as const,
  page: (params: api.FetchSalesPageParams) => ['sales', 'page', params] as const,
};

export function useSales() {
  return useQuery({ queryKey: saleKeys.all, queryFn: api.fetchSales });
}

export function useSalesPage(params: api.FetchSalesPageParams) {
  return useQuery({
    queryKey: saleKeys.page(params),
    queryFn: () => api.fetchSalesPage(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useSale(id: string | undefined) {
  return useQuery({
    queryKey: saleKeys.detail(id ?? ''),
    queryFn: () => api.fetchSale(id as string),
    enabled: !!id,
  });
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: saleKeys.all, refetchType: 'all' });
}

function invalidateDetail(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  return queryClient.invalidateQueries({ queryKey: saleKeys.detail(id), refetchType: 'all' });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createSale,
    onSuccess: () => {
      // Sales are created directly in OUTWARD_TRANSIT and decrement stock immediately.
      invalidateAll(queryClient);
      queryClient.invalidateQueries({ queryKey: productKeys.all, refetchType: 'all' });
    },
  });
}

export function useCancelSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.cancelSale,
    onSuccess: (sale) => {
      invalidateAll(queryClient);
      invalidateDetail(queryClient, sale.id);
      queryClient.invalidateQueries({ queryKey: productKeys.all, refetchType: 'all' });
    },
  });
}
