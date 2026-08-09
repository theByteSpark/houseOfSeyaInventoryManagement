import { useNavigate } from 'react-router-dom';
import { AlertTriangle, IndianRupee, ClipboardCheck, ShoppingCart } from 'lucide-react';
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  FullPageSpinner,
  PageHeader,
  StatTile,
  Table,
  type Column,
} from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { useDashboardSummary } from './hooks';
import { SaleStatusBadge } from '@/features/sales/statusBadge';
import { PurchaseStatusBadge } from '@/features/purchases/statusBadge';
import { useIsAdmin } from '@/features/warehouses/WarehouseFilter';
import type { Sale, Purchase } from '@/types';

export function DashboardPage() {
  const { data, isLoading } = useDashboardSummary();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();

  if (isLoading || !data) return <FullPageSpinner />;

  const saleColumns: Column<Sale>[] = [
    { key: 'number', header: 'Sale', render: (sale) => <span className="font-medium text-graphite-900">{sale.saleNumber}</span> },
    { key: 'customer', header: 'Customer', render: (sale) => sale.customerName },
    { key: 'status', header: 'Status', render: (sale) => <SaleStatusBadge status={sale.status} /> },
    ...(isAdmin ? [{ key: 'total' as const, header: 'Total', render: (sale: Sale) => formatCurrency(sale.total) }] : []),
  ];

  const purchaseColumns: Column<Purchase>[] = [
    { key: 'number', header: 'PO #', render: (p) => <span className="font-medium text-graphite-900">{p.purchaseNumber}</span> },
    { key: 'vendor', header: 'Vendor', render: (p) => p.vendorName },
    { key: 'status', header: 'Status', render: (p) => <PurchaseStatusBadge status={p.status} /> },
    ...(isAdmin ? [{ key: 'total' as const, header: 'Total', render: (p: Purchase) => formatCurrency(p.total) }] : []),
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your inventory, sales, and purchases." />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label="Low stock items"
          value={data.lowStockCount}
          icon={<AlertTriangle className="h-4 w-4" strokeWidth={2} />}
          tone={data.lowStockCount > 0 ? 'warning' : 'neutral'}
          onClick={() => navigate('/inventory/products?stockFilter=low')}
        />
        {isAdmin && (
          <StatTile
            label="Revenue this month"
            value={formatCurrency(data.revenueThisMonth)}
            icon={<IndianRupee className="h-4 w-4" strokeWidth={2} />}
            onClick={() => navigate('/sales')}
          />
        )}
        <StatTile
          label="Pending purchase orders"
          value={data.pendingPOs}
          icon={<ClipboardCheck className="h-4 w-4" strokeWidth={2} />}
          tone={data.pendingPOs > 0 ? 'warning' : 'neutral'}
          onClick={() => navigate('/purchases?status=ORDERED')}
        />
        <StatTile
          label="Pending sales"
          value={data.pendingSales}
          icon={<ShoppingCart className="h-4 w-4" strokeWidth={2} />}
          tone={data.pendingSales > 0 ? 'warning' : 'neutral'}
          onClick={() => navigate('/sales?status=ISSUED')}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent sales"
            action={<button onClick={() => navigate('/sales')} className="text-sm font-medium text-brand-600 hover:underline">View all</button>}
          />
          {data.recentSales.length === 0 ? (
            <CardBody><EmptyState title="No sales yet" description="Sales will appear here once created." /></CardBody>
          ) : (
            <Table columns={saleColumns} rows={data.recentSales} getRowKey={(s) => s.id} onRowClick={(s) => navigate(`/sales/${s.id}`)} />
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent purchases"
            action={<button onClick={() => navigate('/purchases')} className="text-sm font-medium text-brand-600 hover:underline">View all</button>}
          />
          {data.recentPurchases.length === 0 ? (
            <CardBody><EmptyState title="No purchases yet" description="Purchases will appear here once created." /></CardBody>
          ) : (
            <Table columns={purchaseColumns} rows={data.recentPurchases} getRowKey={(p) => p.id} onRowClick={(p) => navigate(`/purchases/${p.id}`)} />
          )}
        </Card>
      </div>

    </div>
  );
}
