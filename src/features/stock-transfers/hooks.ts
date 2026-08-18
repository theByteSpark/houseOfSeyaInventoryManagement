import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import { productKeys } from '@/features/inventory/hooks';

export const transferKeys = {
  all: ['stock-transfers'] as const,
};

export function useTransfers() {
  return useQuery({ queryKey: transferKeys.all, queryFn: api.fetchTransfers });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transferKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
