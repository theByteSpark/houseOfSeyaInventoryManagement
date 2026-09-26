import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import { productKeys } from '@/features/inventory/hooks';
import { purchaseKeys } from '@/features/purchases/hooks';
import { saleKeys } from '@/features/sales/hooks';

export const enquiryKeys = {
  all: ['enquiries'] as const,
  list: (params?: api.FetchEnquiriesParams) => ['enquiries', 'list', params ?? {}] as const,
};

export function useEnquiries(params?: api.FetchEnquiriesParams) {
  return useQuery({ queryKey: enquiryKeys.list(params), queryFn: () => api.fetchEnquiries(params) });
}

export function useCreateEnquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createEnquiry,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: enquiryKeys.all }),
  });
}

export function useEditEnquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: api.EditEnquiryInput }) => api.editEnquiry(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: enquiryKeys.all }),
  });
}

export function useDeleteEnquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteEnquiry,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: enquiryKeys.all }),
  });
}

export function useConfirmEnquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: api.ConfirmEnquiryInput }) => api.confirmEnquiry(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enquiryKeys.all });
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all });
      queryClient.invalidateQueries({ queryKey: saleKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
