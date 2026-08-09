import { useState } from 'react';
import { BarChart3, Download, Package, ShoppingCart, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import { generateReportPdf } from '@/lib/reportPdf';
import {
  Badge,
  Button,
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
  toast,
  type Column,
} from '@/components/ui';
import { SaleStatusBadge } from '@/features/sales/statusBadge';
import { PurchaseStatusBadge } from '@/features/purchases/statusBadge';
import { WarehouseFilter } from '@/features/warehouses/WarehouseFilter';
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
  warehouseId,
  setWarehouseId,
}: {
  from: string;
  to: string;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  statusOptions: { value: string; label: string }[];
  warehouseId: string;
  setWarehouseId: (v: string) => void;
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
      <WarehouseFilter warehouseId={warehouseId} setWarehouseId={setWarehouseId} />
    </div>
  );
}

function SalesReportTab() {
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [status, setStatus] = useState('ALL');
  const [warehouseId, setWarehouseId] = useState('');

  const { data, isLoading } = useSalesReport({ from, to, status, warehouseId: warehouseId || undefined });

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
    { key: 'qty', header: 'Qty sold', align: 'right', render: (p) => p.quantity },
    { key: 'revenue', header: 'Revenue', align: 'right', render: (p) => formatCurrency(p.revenue) },
  ];

  return (
    <div>
      <DateRangeFilter
        from={from} to={to} setFrom={setFrom} setTo={setTo}
        status={status} setStatus={setStatus}
        statusOptions={[
          { value: 'ALL', label: 'All statuses' },
          { value: 'DRAFT', label: 'Draft' },
          { value: 'ISSUED', label: 'Issued' },
          { value: 'PAID', label: 'Paid' },
          { value: 'CANCELLED', label: 'Cancelled' },
        ]}
        warehouseId={warehouseId} setWarehouseId={setWarehouseId}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Total sales" value={data.totalCount} icon={<ShoppingCart className="h-4 w-4" strokeWidth={2} />} />
        <StatTile label="Total revenue" value={formatCurrency(data.totalRevenue)} icon={<BarChart3 className="h-4 w-4" strokeWidth={2} />} />
        <StatTile label="Total tax" value={formatCurrency(data.totalTax)} icon={<BarChart3 className="h-4 w-4" strokeWidth={2} />} />
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {data.statusBreakdown.map((s) => (
            <Badge key={s.status} tone="neutral">{s.status}: {s.count}</Badge>
          ))}
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<Download className="h-4 w-4" strokeWidth={2} />}
          onClick={() => {
            try {
              generateReportPdf(
                'Sales Report',
                `From: ${from}, To: ${to}, Status: ${status}${warehouseId ? ', Warehouse: ' + warehouseId : ''}`,
                [
                  { label: 'Total sales', value: String(data.totalCount) },
                  { label: 'Total revenue', value: formatCurrency(data.totalRevenue) },
                  { label: 'Total tax', value: formatCurrency(data.totalTax) },
                ],
                [
                  {
                    title: 'Top selling products',
                    head: ['Product', 'SKU', 'Qty sold', 'Revenue'],
                    body: data.topProducts.map((p) => [p.product, p.sku, p.quantity, formatCurrency(p.revenue)]),
                  },
                  {
                    title: 'Sales in period',
                    head: ['Sale #', 'Customer', 'Status', 'Total', 'Date'],
                    body: data.sales.map((s) => [s.saleNumber, s.customerName, s.status, formatCurrency(s.total), new Date(s.createdAt).toLocaleDateString()]),
                  },
                ],
              );
              toast.success('Sales report downloaded');
            } catch {
              toast.error('Failed to generate PDF');
            }
          }}
        >
          Download PDF
        </Button>
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
  const [warehouseId, setWarehouseId] = useState('');

  const { data, isLoading } = usePurchasesReport({ from, to, status, warehouseId: warehouseId || undefined });

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
    { key: 'qty', header: 'Qty ordered', align: 'right', render: (p) => p.quantity },
    { key: 'cost', header: 'Cost', align: 'right', render: (p) => formatCurrency(p.cost) },
  ];

  return (
    <div>
      <DateRangeFilter
        from={from} to={to} setFrom={setFrom} setTo={setTo}
        status={status} setStatus={setStatus}
        statusOptions={[
          { value: 'ALL', label: 'All statuses' },
          { value: 'DRAFT', label: 'Draft' },
          { value: 'ORDERED', label: 'Ordered' },
          { value: 'PARTIALLY_RECEIVED', label: 'Partially received' },
          { value: 'RECEIVED', label: 'Received' },
          { value: 'CANCELLED', label: 'Cancelled' },
        ]}
        warehouseId={warehouseId} setWarehouseId={setWarehouseId}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatTile label="Total purchases" value={data.totalCount} icon={<ClipboardList className="h-4 w-4" strokeWidth={2} />} />
        <StatTile label="Total cost" value={formatCurrency(data.totalCost)} icon={<BarChart3 className="h-4 w-4" strokeWidth={2} />} />
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {data.statusBreakdown.map((s) => (
            <Badge key={s.status} tone="neutral">{s.status}: {s.count}</Badge>
          ))}
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<Download className="h-4 w-4" strokeWidth={2} />}
          onClick={() => {
            try {
              generateReportPdf(
                'Purchases Report',
                `From: ${from}, To: ${to}, Status: ${status}${warehouseId ? ', Warehouse: ' + warehouseId : ''}`,
                [
                  { label: 'Total purchases', value: String(data.totalCount) },
                  { label: 'Total cost', value: formatCurrency(data.totalCost) },
                ],
                [
                  {
                    title: 'Top ordered products',
                    head: ['Product', 'SKU', 'Qty ordered', 'Cost'],
                    body: data.topProducts.map((p) => [p.product, p.sku, p.quantity, formatCurrency(p.cost)]),
                  },
                  {
                    title: 'Purchases in period',
                    head: ['PO #', 'Vendor', 'Status', 'Total', 'Date'],
                    body: data.purchases.map((p) => [p.purchaseNumber, p.vendorName, p.status, formatCurrency(p.total), new Date(p.createdAt).toLocaleDateString()]),
                  },
                ],
              );
              toast.success('Purchases report downloaded');
            } catch {
              toast.error('Failed to generate PDF');
            }
          }}
        >
          Download PDF
        </Button>
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
  const [warehouseId, setWarehouseId] = useState('');
  const { data, isLoading } = useInventoryReport({ warehouseId: warehouseId || undefined });

  if (isLoading || !data) return <FullPageSpinner />;

  const lowStockColumns: Column<typeof data.lowStockProducts[number]>[] = [
    { key: 'name', header: 'Product', render: (p) => <span className="font-medium text-graphite-900">{p.name}</span> },
    { key: 'sku', header: 'SKU', render: (p) => p.sku },
    { key: 'stock', header: 'Stock', align: 'right', render: (p) => <span className="font-medium text-amber-600">{p.quantityInStock}</span> },
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
    { key: 'qty', header: 'Qty', align: 'right', render: (m) => m.quantity },
    { key: 'reason', header: 'Reason', render: (m) => m.reason ?? <span className="text-graphite-300">—</span> },
    { key: 'date', header: 'Date', render: (m) => new Date(m.createdAt).toLocaleString() },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap sm:items-end">
        <WarehouseFilter warehouseId={warehouseId} setWarehouseId={setWarehouseId} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Total products" value={data.totalProducts} icon={<Package className="h-4 w-4" strokeWidth={2} />} />
        <StatTile label="Total stock value" value={formatCurrency(data.totalStockValue)} icon={<BarChart3 className="h-4 w-4" strokeWidth={2} />} />
        <StatTile label="Low stock items" value={data.lowStockCount} icon={<Package className="h-4 w-4" strokeWidth={2} />} tone={data.lowStockCount > 0 ? 'warning' : 'neutral'} />
      </div>

      <div className="mb-6 flex items-center justify-end">
        <Button
          variant="secondary"
          size="sm"
          icon={<Download className="h-4 w-4" strokeWidth={2} />}
          onClick={() => {
            try {
              generateReportPdf(
                'Inventory Report',
                `${warehouseId ? 'Warehouse: ' + warehouseId : 'All warehouses'}`,
                [
                  { label: 'Total products', value: String(data.totalProducts) },
                  { label: 'Total stock value', value: formatCurrency(data.totalStockValue) },
                  { label: 'Low stock items', value: String(data.lowStockCount) },
                ],
                [
                  {
                    title: 'Low stock products',
                    head: ['Product', 'SKU', 'Stock', 'Reorder at'],
                    body: data.lowStockProducts.map((p) => [p.name, p.sku, p.quantityInStock, p.reorderLevel]),
                  },
                  {
                    title: 'Category-wise breakdown',
                    head: ['Category', 'Products', 'Stock value'],
                    body: data.categoryBreakdown.map((c) => [c.category, c.productCount, formatCurrency(c.stockValue)]),
                  },
                  {
                    title: 'Recent stock movements',
                    head: ['Product', 'Type', 'Qty', 'Reason', 'Date'],
                    body: data.recentMovements.map((m) => [m.productName, m.type, m.quantity, m.reason ?? '—', new Date(m.createdAt).toLocaleString()]),
                  },
                ],
              );
              toast.success('Inventory report downloaded');
            } catch {
              toast.error('Failed to generate PDF');
            }
          }}
        >
          Download PDF
        </Button>
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
