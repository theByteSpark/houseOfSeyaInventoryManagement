import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import type { AttributeType } from '@/types';

export const attributeOptionKeys = {
  all: ['attributeOptions'] as const,
  byType: (type?: AttributeType) => ['attributeOptions', type ?? 'ALL'] as const,
};

export function useAttributeOptions(type?: AttributeType) {
  return useQuery({
    queryKey: attributeOptionKeys.byType(type),
    queryFn: () => api.fetchAttributeOptions(type),
  });
}

export function useCreateAttributeOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createAttributeOption,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attributeOptionKeys.all }),
  });
}

export function useUpdateAttributeOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: api.AttributeOptionUpdateInput }) =>
      api.updateAttributeOption(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attributeOptionKeys.all }),
  });
}

export function useDeleteAttributeOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteAttributeOption,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attributeOptionKeys.all }),
  });
}
