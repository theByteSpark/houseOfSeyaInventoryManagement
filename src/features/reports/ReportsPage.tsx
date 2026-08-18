import { useState } from 'react';
import { BarChart3, Package, ShoppingCart, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  FullPageSpinner,
  Input,
  PageHeader,
  Select,
  StatTile,
  Table,
  type Column,
} from '@/components/ui';
import { SaleStatusBadge } from '@/features/sales/statusBadge';
import { PurchaseStatusBadge } from '@/features/purchases/statusBadge';
import { useWarehouseContext } from '@/features/warehouses/WarehouseContext';
import { useSalesReport, usePurchasesReport, useInventoryReport } from './hooks';
import type { SaleStatus, PurchaseStatus } from '@/types';

type Tab = 'sales' | 'purchases' | 'inventory';

const tabs: { id: Tab; label: string; icon: typeof ShoppingCart }[] = [
  { id: 'sales', label: 'Sales', icon: ShoppingCart },
  { id: 'purchases', label: 'Purchases', icon: ClipboardList },
  { id: 'inventory', label: 'Inventory', icon: Package },
];

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('sales');

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Analyze your sales, purchases, and inventory performance."
      />

      <div className="mb-6 flex gap-1 border-b border-graphite-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-graphite-500 hover:text-graphite-800',
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'sales' && <SalesReportTab />}
      {activeTab === 'purchases' && <PurchasesReportTab />}
      {activeTab === 'inventory' && <InventoryReportTab />}
    </div>
  );
}

function DateRangeFilter({
  from,
  to,
  setFrom,
  setTo,
  status,
  setStatus,
  statusOptions,
}: {
  from: string;
  to: string;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  statusOptions: { value: string; label: string }[];
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="sm:max-w-[160px]" />
      <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="sm:max-w-[160px]" />
      <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-auto sm:max-w-[160px]">
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </Select>
    </div>
  );
}

function SalesReportTab() {
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [status, setStatus] = useState('ALL');
  const { selectedWarehouseId } = useWarehouseContext();

  const { data, isLoading } = useSalesReport({ from, to, status, warehouseId: selectedWarehouseId ?? undefined });

  if (isLoading || !data) return <FullPageSpinner />;

  const saleColumns: Column<typeof data.sales[number]>[] = [
    { key: 'saleNumber', header: 'Sale #', render: (s) => <span className="font-medium text-graphite-900">{s.saleNumber}</span> },
    { key: 'customer', header: 'Customer', render: (s) => s.customerName },
    { key: 'status', header: 'Status', render: (s) => <SaleStatusBadge status={s.status as SaleStatus} /> },
    { key: 'total', header: 'Total', render: (s) => formatCurrency(s.total) },
    { key: 'date', header: 'Date', render: (s) => new Date(s.createdAt).toLocaleDateString() },
  ];

  const topProductColumns: Column<typeof data.topProducts[number]>[] = [
    { key: 'product', header: 'Product', render: (p) => <span className="font-medium text-graphite-900">{p.product}</span> },
    { key: 'sku', header: 'SKU', render: (p) => p.sku },
    { key: 'qty', header: 'Qty sold (kgs)', align: 'right', render: (p) => p.quantity },
    { key: 'revenue', header: 'Revenue', align: 'right', render: (p) => formatCurrency(p.revenue) },
  ];

  return (
    <div>
      <DateRangeFilter
        from={from} to={to} setFrom={setFrom} setTo={setTo}
        status={status} setStatus={setStatus}
        statusOptions={[
          { value: 'ALL', label: 'All statuses' },
          { value: 'OUTWARD_TRANSIT', label: 'Outward Transit' },
          { value: 'CANCELLED', label: 'Cancelled' },
        ]}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Total sales" value={data.totalCount} icon={<ShoppingCart className="h-4 w-4" strokeWidth={2} />} />
        <StatTile label="Total revenue" value={formatCurrency(data.totalRevenue)} icon={<BarChart3 className="h-4 w-4" strokeWidth={2} />} />
        <StatTile label="Total tax" value={formatCurrency(data.totalTax)} icon={<BarChart3 className="h-4 w-4" strokeWidth={2} />} />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {data.statusBreakdown.map((s) => (
          <Badge key={s.status} tone="neutral">{s.status}: {s.count}</Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Top selling products" />
          {data.topProducts.length === 0 ? (
            <CardBody><EmptyState title="No data" description="No sales in this period." /></CardBody>
          ) : (
            <Table columns={topProductColumns} rows={data.topProducts} getRowKey={(p) => p.sku} />
          )}
        </Card>

        <Card>
          <CardHeader title="Sales in period" />
          {data.sales.length === 0 ? (
            <CardBody><EmptyState title="No sales" description="No sales found for the selected filters." /></CardBody>
          ) : (
            <Table columns={saleColumns} rows={data.sales} getRowKey={(s) => s.id} />
          )}
        </Card>
      </div>
    </div>
  );
}

function PurchasesReportTab() {
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [status, setStatus] = useState('ALL');
  const { selectedWarehouseId } = useWarehouseContext();

  const { data, isLoading } = usePurchasesReport({ from, to, status, warehouseId: selectedWarehouseId ?? undefined });

  if (isLoading || !data) return <FullPageSpinner />;

  const purchaseColumns: Column<typeof data.purchases[number]>[] = [
    { key: 'purchaseNumber', header: 'PO #', render: (p) => <span className="font-medium text-graphite-900">{p.purchaseNumber}</span> },
    { key: 'vendor', header: 'Vendor', render: (p) => p.vendorName },
    { key: 'status', header: 'Status', render: (p) => <PurchaseStatusBadge status={p.status as PurchaseStatus} /> },
    { key: 'total', header: 'Total', align: 'right', render: (p) => formatCurrency(p.total) },
    { key: 'date', header: 'Date', render: (p) => new Date(p.createdAt).toLocaleDateString() },
  ];

  const topProductColumns: Column<typeof data.topProducts[number]>[] = [
    { key: 'product', header: 'Product', render: (p) => <span className="font-medium text-graphite-900">{p.product}</span> },
    { key: 'sku', header: 'SKU', render: (p) => p.sku },
    { key: 'qty', header: 'Qty ordered (kgs)', align: 'right', render: (p) => p.quantity },
    { key: 'cost', header: 'Cost', align: 'right', render: (p) => formatCurrency(p.cost) },
  ];

  return (
    <div>
      <DateRangeFilter
        from={from} to={to} setFrom={setFrom} setTo={setTo}
        status={status} setStatus={setStatus}
        statusOptions={[
          { value: 'ALL', label: 'All statuses' },
          { value: 'ORDERED', label: 'Ordered' },
          { value: 'INWARD_TRANSIT', label: 'Inward Transit' },
          { value: 'IN_STOCK', label: 'In Stock' },
          { value: 'CANCELLED', label: 'Cancelled' },
        ]}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatTile label="Total purchases" value={data.totalCount} icon={<ClipboardList className="h-4 w-4" strokeWidth={2} />} />
        <StatTile label="Total cost" value={formatCurrency(data.totalCost)} icon={<BarChart3 className="h-4 w-4" strokeWidth={2} />} />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {data.statusBreakdown.map((s) => (
          <Badge key={s.status} tone="neutral">{s.status}: {s.count}</Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Top ordered products" />
          {data.topProducts.length === 0 ? (
            <CardBody><EmptyState title="No data" description="No purchases in this period." /></CardBody>
          ) : (
            <Table columns={topProductColumns} rows={data.topProducts} getRowKey={(p) => p.sku} />
          )}
        </Card>

        <Card>
          <CardHeader title="Purchases in period" />
          {data.purchases.length === 0 ? (
            <CardBody><EmptyState title="No purchases" description="No purchases found for the selected filters." /></CardBody>
          ) : (
            <Table columns={purchaseColumns} rows={data.purchases} getRowKey={(p) => p.id} />
          )}
        </Card>
      </div>
    </div>
  );
}

function InventoryReportTab() {
  const { selectedWarehouseId } = useWarehouseContext();
  const { data, isLoading } = useInventoryReport({ warehouseId: selectedWarehouseId ?? undefined });

  if (isLoading || !data) return <FullPageSpinner />;

  const lowStockColumns: Column<typeof data.lowStockProducts[number]>[] = [
    { key: 'name', header: 'Product', render: (p) => <span className="font-medium text-graphite-900">{p.name}</span> },
    { key: 'sku', header: 'SKU', render: (p) => p.sku },
    { key: 'stock', header: 'Stock (kgs)', align: 'right', render: (p) => <span className="font-medium text-amber-600">{p.quantityInStock}</span> },
    { key: 'reorder', header: 'Reorder at', align: 'right', render: (p) => p.reorderLevel },
  ];

  const categoryColumns: Column<typeof data.categoryBreakdown[number]>[] = [
    { key: 'category', header: 'Category', render: (c) => <span className="font-medium text-graphite-900">{c.category}</span> },
    { key: 'products', header: 'Products', align: 'right', render: (c) => c.productCount },
    { key: 'value', header: 'Stock value', align: 'right', render: (c) => formatCurrency(c.stockValue) },
  ];

  const movementColumns: Column<typeof data.recentMovements[number]>[] = [
    { key: 'product', header: 'Product', render: (m) => <span className="font-medium text-graphite-900">{m.productName}</span> },
    { key: 'type', header: 'Type', render: (m) => <Badge tone={m.type === 'RESTOCK' ? 'success' : m.type === 'SALE' ? 'info' : 'warning'}>{m.type}</Badge> },
    { key: 'qty', header: 'Qty (kgs)', align: 'right', render: (m) => m.quantity },
    { key: 'reason', header: 'Reason', render: (m) => m.reason ?? <span className="text-graphite-300">—</span> },
    { key: 'date', header: 'Date', render: (m) => new Date(m.createdAt).toLocaleString() },
  ];

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Total products" value={data.totalProducts} icon={<Package className="h-4 w-4" strokeWidth={2} />} />
        <StatTile label="Total stock value" value={formatCurrency(data.totalStockValue)} icon={<BarChart3 className="h-4 w-4" strokeWidth={2} />} />
        <StatTile label="Low stock items" value={data.lowStockCount} icon={<Package className="h-4 w-4" strokeWidth={2} />} tone={data.lowStockCount > 0 ? 'warning' : 'neutral'} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Low stock products" />
          {data.lowStockProducts.length === 0 ? (
            <CardBody><EmptyState title="All stocked up" description="No products are below their reorder level." /></CardBody>
          ) : (
            <Table columns={lowStockColumns} rows={data.lowStockProducts} getRowKey={(p) => p.id} />
          )}
        </Card>

        <Card>
          <CardHeader title="Category-wise breakdown" />
          {data.categoryBreakdown.length === 0 ? (
            <CardBody><EmptyState title="No categories" description="No category data available." /></CardBody>
          ) : (
            <Table columns={categoryColumns} rows={data.categoryBreakdown} getRowKey={(c) => c.category} />
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Recent stock movements" />
        {data.recentMovements.length === 0 ? (
          <CardBody><EmptyState title="No movements" description="No stock movements recorded yet." /></CardBody>
        ) : (
          <Table columns={movementColumns} rows={data.recentMovements} getRowKey={(m) => m.id} />
        )}
      </Card>
    </div>
  );
}
