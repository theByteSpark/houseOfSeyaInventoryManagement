import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import { productKeys } from '@/features/inventory/hooks';
import { saleKeys } from '@/features/sales/hooks';

export const blockedQuantityKeys = {
  all: ['blocked-quantities'] as const,
  list: (params?: api.FetchBlockedQuantitiesParams) => ['blocked-quantities', 'list', params ?? {}] as const,
};

export function useBlockedQuantities(params?: api.FetchBlockedQuantitiesParams) {
  return useQuery({
    queryKey: blockedQuantityKeys.list(params),
    queryFn: () => api.fetchBlockedQuantities(params),
  });
}

export function useCreateBlockedQuantity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createBlockedQuantity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockedQuantityKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useEditBlockedQuantity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: api.EditBlockedQuantityInput }) =>
      api.editBlockedQuantity(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockedQuantityKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useDeleteBlockedQuantity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteBlockedQuantity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockedQuantityKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useConfirmBlockedQuantity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: api.ConfirmBlockedQuantityInput }) =>
      api.confirmBlockedQuantity(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockedQuantityKeys.all });
      queryClient.invalidateQueries({ queryKey: saleKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
