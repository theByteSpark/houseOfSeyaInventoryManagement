import { useQuery } from '@tanstack/react-query';
import * as api from './api';

export const dashboardKeys = {
  inwardTransit: (warehouseId?: string) => ['dashboard', 'inward-transit', warehouseId ?? 'all'] as const,
  outwardTransit: (warehouseId?: string) => ['dashboard', 'outward-transit', warehouseId ?? 'all'] as const,
  recentSalesByProduct: (days: number, warehouseId?: string) =>
    ['dashboard', 'recent-sales-by-product', days, warehouseId ?? 'all'] as const,
};

export function useInwardTransitPurchases(warehouseId?: string) {
  return useQuery({
    queryKey: dashboardKeys.inwardTransit(warehouseId),
    queryFn: () => api.fetchInwardTransitPurchases(warehouseId),
  });
}

export function useOutwardTransitSales(warehouseId?: string) {
  return useQuery({
    queryKey: dashboardKeys.outwardTransit(warehouseId),
    queryFn: () => api.fetchOutwardTransitSales(warehouseId),
  });
}

export function useRecentSalesByProduct(days: number, warehouseId?: string) {
  return useQuery({
    queryKey: dashboardKeys.recentSalesByProduct(days, warehouseId),
    queryFn: () => api.fetchRecentSalesByProduct({ days, warehouseId }),
  });
}
