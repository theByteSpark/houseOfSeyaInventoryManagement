import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import { productKeys } from '@/features/inventory/hooks';

export const purchaseKeys = {
  all: ['purchases'] as const,
  detail: (id: string) => ['purchases', id] as const,
  page: (params: api.FetchPurchasesPageParams) => ['purchases', 'page', params] as const,
};

export function usePurchases() {
  return useQuery({ queryKey: purchaseKeys.all, queryFn: api.fetchPurchases });
}

export function usePurchasesPage(params: api.FetchPurchasesPageParams) {
  return useQuery({
    queryKey: purchaseKeys.page(params),
    queryFn: () => api.fetchPurchasesPage(params),
    placeholderData: (previousData) => previousData,
  });
}

export function usePurchase(id: string | undefined) {
  return useQuery({
    queryKey: purchaseKeys.detail(id ?? ''),
    queryFn: () => api.fetchPurchase(id as string),
    enabled: !!id,
  });
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: purchaseKeys.all, refetchType: 'all' });
}

function invalidateDetail(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  return queryClient.invalidateQueries({ queryKey: purchaseKeys.detail(id), refetchType: 'all' });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createPurchase,
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useUpdatePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: api.PurchaseInput }) => api.updatePurchase(id, input),
    onSuccess: (purchase) => {
      invalidateAll(queryClient);
      invalidateDetail(queryClient, purchase.id);
    },
  });
}

function invalidateAfterStockChange(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  invalidateAll(queryClient);
  invalidateDetail(queryClient, id);
  queryClient.invalidateQueries({ queryKey: productKeys.all, refetchType: 'all' });
}

export function useMarkPurchaseInwardTransit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.markPurchaseInwardTransit,
    onSuccess: (purchase) => {
      invalidateAll(queryClient);
      invalidateDetail(queryClient, purchase.id);
    },
  });
}

export function useMarkPurchaseInStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.markPurchaseInStock,
    onSuccess: (purchase) => invalidateAfterStockChange(queryClient, purchase.id),
  });
}

export function useCancelPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.cancelPurchase,
    onSuccess: (purchase) => {
      invalidateAll(queryClient);
      invalidateDetail(queryClient, purchase.id);
    },
  });
}
