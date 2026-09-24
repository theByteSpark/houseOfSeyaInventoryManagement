import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

export const enquiryKeys = {
  all: ['enquiries'] as const,
  detail: (id: string) => ['enquiries', id] as const,
  page: (params: api.FetchEnquiriesPageParams) => ['enquiries', 'page', params] as const,
};

export function useEnquiries() {
  return useQuery({ queryKey: enquiryKeys.all, queryFn: api.fetchEnquiries });
}

export function useEnquiriesPage(params: api.FetchEnquiriesPageParams) {
  return useQuery({
    queryKey: enquiryKeys.page(params),
    queryFn: () => api.fetchEnquiriesPage(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useEnquiry(id: string | undefined) {
  return useQuery({
    queryKey: enquiryKeys.detail(id ?? ''),
    queryFn: () => api.fetchEnquiry(id as string),
    enabled: !!id,
  });
}

export function useCreateEnquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createEnquiry,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: enquiryKeys.all }),
  });
}

export function useUpdateEnquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: api.EnquiryInput }) => api.updateEnquiry(id, input),
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
