import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, IndianRupee, Package, Users, Truck, ClipboardList, ClipboardCheck, Plus } from 'lucide-react';
import {
  Button,
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
import { EnquiryFormModal } from '@/features/enquiries/EnquiryFormModal';
import type { Sale, Product, Purchase } from '@/types';

export function DashboardPage() {
  const { data, isLoading } = useDashboardSummary();
  const navigate = useNavigate();
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);

  if (isLoading || !data) return <FullPageSpinner />;

  const saleColumns: Column<Sale>[] = [
    { key: 'number', header: 'Sale', render: (sale) => <span className="font-medium text-graphite-900">{sale.saleNumber}</span> },
    { key: 'customer', header: 'Customer', render: (sale) => sale.customerName },
    { key: 'status', header: 'Status', render: (sale) => <SaleStatusBadge status={sale.status} /> },
    { key: 'total', header: 'Total', align: 'right', render: (sale) => formatCurrency(sale.total) },
  ];

  const purchaseColumns: Column<Purchase>[] = [
    { key: 'number', header: 'PO #', render: (p) => <span className="font-medium text-graphite-900">{p.purchaseNumber}</span> },
    { key: 'vendor', header: 'Vendor', render: (p) => p.vendorName },
    { key: 'status', header: 'Status', render: (p) => <PurchaseStatusBadge status={p.status} /> },
    { key: 'total', header: 'Total', align: 'right', render: (p) => formatCurrency(p.total) },
  ];

  const lowStockColumns: Column<Product>[] = [
    { key: 'name', header: 'Product', render: (p) => <span className="font-medium text-graphite-900">{p.name}</span> },
    { key: 'designNumber', header: 'Design #', render: (p) => p.designNumber },
    { key: 'stock', header: 'Stock', align: 'right', render: (p) => <span className="font-medium text-amber-600">{p.quantityInStock}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your inventory, sales, and purchases."
        action={
          <Button onClick={() => setEnquiryModalOpen(true)} icon={<Plus className="h-4 w-4" strokeWidth={2} />}>
            Add enquiry
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total products" value={data.totalProducts} icon={<Package className="h-4 w-4" strokeWidth={2} />} />
        <StatTile label="Low stock items" value={data.lowStockCount} icon={<AlertTriangle className="h-4 w-4" strokeWidth={2} />} tone={data.lowStockCount > 0 ? 'warning' : 'neutral'} />
        <StatTile label="Total customers" value={data.totalCustomers} icon={<Users className="h-4 w-4" strokeWidth={2} />} />
        <StatTile label="Total vendors" value={data.totalVendors} icon={<Truck className="h-4 w-4" strokeWidth={2} />} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Sales this month" value={data.salesThisMonth} icon={<IndianRupee className="h-4 w-4" strokeWidth={2} />} />
        <StatTile label="Revenue this month" value={formatCurrency(data.revenueThisMonth)} icon={<IndianRupee className="h-4 w-4" strokeWidth={2} />} />
        <StatTile label="Purchases this month" value={data.purchasesThisMonth} icon={<ClipboardList className="h-4 w-4" strokeWidth={2} />} />
        <StatTile label="Pending POs" value={data.pendingPOs} icon={<ClipboardCheck className="h-4 w-4" strokeWidth={2} />} tone={data.pendingPOs > 0 ? 'warning' : 'neutral'} />
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

      <Card className="mt-6">
        <CardHeader
          title="Low stock alerts"
          action={<button onClick={() => navigate('/inventory/products')} className="text-sm font-medium text-brand-600 hover:underline">View all</button>}
        />
        {data.lowStockProducts.length === 0 ? (
          <CardBody><EmptyState title="All stocked up" description="No products are below their reorder level." /></CardBody>
        ) : (
          <Table columns={lowStockColumns} rows={data.lowStockProducts} getRowKey={(p) => p.id} />
        )}
      </Card>

      <EnquiryFormModal isOpen={enquiryModalOpen} onClose={() => setEnquiryModalOpen(false)} />
    </div>
  );
}
