import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import { productKeys } from '@/features/inventory/hooks';

export const conversionKeys = {
  all: ['stock-conversions'] as const,
};

export function useConversions() {
  return useQuery({ queryKey: conversionKeys.all, queryFn: api.fetchConversions });
}

export function useCreateConversion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createConversion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversionKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
