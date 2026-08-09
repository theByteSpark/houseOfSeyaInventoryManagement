import { useQuery } from '@tanstack/react-query';
import * as api from './api';

type ReportFilterParams = { from?: string; to?: string; status?: string; warehouseId?: string };

export const reportKeys = {
  sales: (params: ReportFilterParams) => ['reports', 'sales', params] as const,
  purchases: (params: ReportFilterParams) => ['reports', 'purchases', params] as const,
  inventory: (params: { warehouseId?: string }) => ['reports', 'inventory', params] as const,
};

export function useSalesReport(params: ReportFilterParams) {
  return useQuery({
    queryKey: reportKeys.sales(params),
    queryFn: () => api.fetchSalesReport(params),
  });
}

export function usePurchasesReport(params: ReportFilterParams) {
  return useQuery({
    queryKey: reportKeys.purchases(params),
    queryFn: () => api.fetchPurchasesReport(params),
  });
}

export function useInventoryReport(params: { warehouseId?: string } = {}) {
  return useQuery({
    queryKey: reportKeys.inventory(params),
    queryFn: () => api.fetchInventoryReport(params),
  });
}
