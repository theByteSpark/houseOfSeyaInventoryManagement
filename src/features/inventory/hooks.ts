import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

export const productKeys = {
  all: ['products'] as const,
  detail: (id: string) => ['products', id] as const,
  movements: (id: string) => ['products', id, 'movements'] as const,
  page: (params: api.FetchProductsPageParams) => ['products', 'page', params] as const,
};

export const categoryKeys = {
  all: ['categories'] as const,
  page: (params: api.FetchCategoriesPageParams) => ['categories', 'page', params] as const,
};

export function useProducts() {
  return useQuery({ queryKey: productKeys.all, queryFn: api.fetchProducts });
}

export function useProductsPage(params: api.FetchProductsPageParams) {
  return useQuery({
    queryKey: productKeys.page(params),
    queryFn: () => api.fetchProductsPage(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id ?? ''),
    queryFn: () => api.fetchProduct(id as string),
    enabled: !!id,
  });
}

export function useStockMovements(productId: string | undefined) {
  return useQuery({
    queryKey: productKeys.movements(productId ?? ''),
    queryFn: () => api.fetchStockMovements(productId as string),
    enabled: !!productId,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: api.ProductInput }) => api.updateProduct(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useRestockProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      quantity,
      reason,
      warehouseId,
    }: {
      id: string;
      quantity: number;
      reason?: string;
      warehouseId?: string;
    }) => api.restockProduct(id, quantity, reason, warehouseId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.movements(variables.id) });
    },
  });
}

export function useCategories() {
  return useQuery({ queryKey: categoryKeys.all, queryFn: api.fetchCategories });
}

export function useCategoriesPage(params: api.FetchCategoriesPageParams) {
  return useQuery({
    queryKey: categoryKeys.page(params),
    queryFn: () => api.fetchCategoriesPage(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: api.CategoryInput }) => api.updateCategory(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}
