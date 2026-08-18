import { apiClient } from '@/lib/apiClient';
import { fetchPurchasesPage } from '@/features/purchases/api';
import { fetchSalesPage } from '@/features/sales/api';
import type { Purchase, RecentSaleByProduct, Sale } from '@/types';

const DASHBOARD_LIST_PAGE_SIZE = 50;

export async function fetchInwardTransitPurchases(warehouseId?: string): Promise<Purchase[]> {
  const { data } = await fetchPurchasesPage({
    page: 1,
    pageSize: DASHBOARD_LIST_PAGE_SIZE,
    sortBy: 'createdAt',
    sortDir: 'desc',
    status: 'INWARD_TRANSIT',
    warehouseId,
  });
  return data;
}

export async function fetchOutwardTransitSales(warehouseId?: string): Promise<Sale[]> {
  const { data } = await fetchSalesPage({
    page: 1,
    pageSize: DASHBOARD_LIST_PAGE_SIZE,
    sortBy: 'createdAt',
    sortDir: 'desc',
    status: 'OUTWARD_TRANSIT',
    warehouseId,
  });
  return data;
}

export async function fetchRecentSalesByProduct(params: {
  days: number;
  warehouseId?: string;
}): Promise<RecentSaleByProduct[]> {
  const { data } = await apiClient.get<RecentSaleByProduct[]>('/reports/recent-sales-by-product', {
    params: { days: params.days, warehouseId: params.warehouseId },
  });
  return data;
}
