import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

export const purchaseEnquiryKeys = {
  all: ['purchase-enquiries'] as const,
  detail: (id: string) => ['purchase-enquiries', id] as const,
  page: (params: api.FetchPurchaseEnquiriesPageParams) => ['purchase-enquiries', 'page', params] as const,
};

export function usePurchaseEnquiries() {
  return useQuery({ queryKey: purchaseEnquiryKeys.all, queryFn: api.fetchPurchaseEnquiries });
}

export function usePurchaseEnquiriesPage(params: api.FetchPurchaseEnquiriesPageParams) {
  return useQuery({
    queryKey: purchaseEnquiryKeys.page(params),
    queryFn: () => api.fetchPurchaseEnquiriesPage(params),
    placeholderData: (previousData) => previousData,
  });
}

export function usePurchaseEnquiry(id: string | undefined) {
  return useQuery({
    queryKey: purchaseEnquiryKeys.detail(id ?? ''),
    queryFn: () => api.fetchPurchaseEnquiry(id as string),
    enabled: !!id,
  });
}

export function useCreatePurchaseEnquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createPurchaseEnquiry,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseEnquiryKeys.all }),
  });
}

export function useUpdatePurchaseEnquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: api.PurchaseEnquiryInput }) => api.updatePurchaseEnquiry(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseEnquiryKeys.all }),
  });
}

export function useDeletePurchaseEnquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deletePurchaseEnquiry,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseEnquiryKeys.all }),
  });
}
