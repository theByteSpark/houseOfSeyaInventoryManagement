import { fetchCustomers } from '@/features/customers/api';
import { fetchProducts } from '@/features/inventory/api';
import { fetchSales } from '@/features/sales/api';
import { fetchVendors } from '@/features/vendors/api';
import { fetchPurchases } from '@/features/purchases/api';
import type { DashboardSummary } from '@/types';

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const [customers, products, sales, vendors, purchases] = await Promise.all([
    fetchCustomers(),
    fetchProducts(),
    fetchSales(),
    fetchVendors(),
    fetchPurchases(),
  ]);

  const now = new Date();
  const salesThisMonth = sales.filter((sale) => {
    const created = new Date(sale.createdAt);
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  });

  const revenueThisMonth = salesThisMonth
    .filter((sale) => sale.status === 'PAID' || sale.status === 'ISSUED')
    .reduce((sum, sale) => sum + sale.total, 0);

  const purchasesThisMonth = purchases.filter((purchase) => {
    const created = new Date(purchase.createdAt);
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  });

  const pendingPOs = purchases.filter(
    (p) => p.status === 'ORDERED' || p.status === 'PARTIALLY_RECEIVED',
  ).length;

  const pendingSales = sales.filter(
    (s) => s.status === 'DRAFT' || s.status === 'ISSUED',
  ).length;

  const lowStockProducts = products
    .filter((p) => p.quantityInStock <= p.reorderLevel)
    .sort((a, b) => a.quantityInStock - b.quantityInStock);

  const recentSales = [...sales]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const recentPurchases = [...purchases]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const summary: DashboardSummary = {
    totalProducts: products.length,
    lowStockCount: lowStockProducts.length,
    totalCustomers: customers.length,
    totalVendors: vendors.length,
    salesThisMonth: salesThisMonth.length,
    revenueThisMonth,
    purchasesThisMonth: purchasesThisMonth.length,
    pendingPOs,
    pendingSales,
    recentSales,
    recentPurchases,
    lowStockProducts: lowStockProducts.slice(0, 5),
  };

  return summary;
}
