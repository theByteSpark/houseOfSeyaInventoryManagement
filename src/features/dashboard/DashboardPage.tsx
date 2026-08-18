import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardHeader, EmptyState, Input, Table, type Column } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { fuzzyFilter } from '@/lib/fuzzySearch';
import { useWarehouseContext } from '@/features/warehouses/WarehouseContext';
import { useEnquiries } from '@/features/enquiries/hooks';
import { EnquiryFormModal } from '@/features/enquiries/EnquiryFormModal';
import { ConfirmEnquiryModal } from '@/features/enquiries/ConfirmEnquiryModal';
import { useProducts } from '@/features/inventory/hooks';
import { useInwardTransitPurchases, useOutwardTransitSales, useRecentSalesByProduct } from './hooks';
import type { Enquiry, Product, RecentSaleByProduct } from '@/types';

interface ProductStockRow {
  id: string;
  name: string;
  sku: string;
  quantity: number;
}

interface TransitProductRow {
  rowKey: string;
  parentId: string;
  productName: string;
  quantity: number;
  price: number;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { selectedWarehouseId } = useWarehouseContext();
  const warehouseId = selectedWarehouseId ?? undefined;

  const { data: inwardTransitPurchases, isLoading: isLoadingInward } = useInwardTransitPurchases(warehouseId);
  const { data: outwardTransitSales, isLoading: isLoadingOutward } = useOutwardTransitSales(warehouseId);
  const { data: recentSalesByProduct, isLoading: isLoadingRecent } = useRecentSalesByProduct(3, warehouseId);
  const { data: enquiries, isLoading: isLoadingEnquiries } = useEnquiries();
  const { data: allProducts, isLoading: isLoadingProducts } = useProducts();

  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Enquiry | null>(null);
  const [productSearch, setProductSearch] = useState('');

  const sortedRecentSales = useMemo(
    () => [...(recentSalesByProduct ?? [])].sort((a, b) => b.date.localeCompare(a.date)),
    [recentSalesByProduct],
  );

  const inwardTransitRows: TransitProductRow[] = useMemo(
    () =>
      (inwardTransitPurchases ?? []).flatMap((p) =>
        p.items.map((item) => ({
          rowKey: item.id,
          parentId: p.id,
          productName: item.productName,
          quantity: item.quantity,
          price: item.unitCost,
        })),
      ),
    [inwardTransitPurchases],
  );

  const outwardTransitRows: TransitProductRow[] = useMemo(
    () =>
      (outwardTransitSales ?? []).flatMap((s) =>
        s.items.map((item) => ({
          rowKey: item.id,
          parentId: s.id,
          productName: item.productName,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
      ),
    [outwardTransitSales],
  );

  const transitColumns: Column<TransitProductRow>[] = [
    { key: 'productName', header: 'Product Name', render: (r) => <span className="font-medium text-graphite-900">{r.productName}</span> },
    { key: 'quantity', header: 'Quantity (kgs)', align: 'right', render: (r) => r.quantity },
    { key: 'price', header: 'Price per kg', align: 'right', render: (r) => formatCurrency(r.price) },
  ];

  const recentSalesColumns: Column<RecentSaleByProduct & { rowKey: string }>[] = [
    { key: 'productName', header: 'Product Name', render: (r) => <span className="font-medium text-graphite-900">{r.productName}</span> },
    { key: 'quantity', header: 'Quantity (kgs)', align: 'right', render: (r) => r.quantity },
    { key: 'unitPrice', header: 'Price per kg', align: 'right', render: (r) => formatCurrency(r.unitPrice) },
  ];

  const recentSalesRows = sortedRecentSales.map((r, i) => ({ ...r, rowKey: `${r.productId}-${r.date}-${i}` }));

  const enquiryColumns: Column<Enquiry>[] = [
    { key: 'productName', header: 'Product Name', render: (r) => <span className="font-medium text-graphite-900">{r.productName}</span> },
    { key: 'quantity', header: 'Quantity (kgs)', align: 'right', render: (r) => r.quantity },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <Button size="sm" variant="secondary" onClick={() => setConfirmTarget(r)}>
          Confirm
        </Button>
      ),
    },
  ];

  const productStockRows: ProductStockRow[] = useMemo(() => {
    function quantityForSelectedWarehouse(product: Product): number {
      if (!selectedWarehouseId) return product.quantityInStock;
      return product.stockByWarehouse.find((s) => s.warehouseId === selectedWarehouseId)?.quantity ?? 0;
    }
    const rows = [...(allProducts ?? [])]
      .map((p) => ({ id: p.id, name: p.name, sku: p.sku, quantity: quantityForSelectedWarehouse(p) }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return fuzzyFilter(rows, productSearch, (r) => `${r.name} ${r.sku}`);
  }, [allProducts, selectedWarehouseId, productSearch]);

  const productStockColumns: Column<ProductStockRow>[] = [
    { key: 'name', header: 'Product Name', render: (r) => <span className="font-medium text-graphite-900">{r.name}</span> },
    { key: 'quantity', header: 'Quantity (kgs)', align: 'right', render: (r) => r.quantity },
  ];

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100vh-theme(spacing.16))] lg:min-h-0 lg:flex-row">
      <div className="flex min-h-0 w-full flex-col gap-4 lg:w-1/2">
        <Card className="flex h-64 flex-col overflow-hidden lg:h-[33vh]">
          <CardHeader
            title="Inward Transit"
            action={<button onClick={() => navigate('/purchases?status=INWARD_TRANSIT')} className="text-sm font-medium text-brand-600 hover:underline">View all</button>}
          />
          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoadingInward ? (
              <div className="p-6 text-sm text-graphite-400">Loading…</div>
            ) : inwardTransitRows.length === 0 ? (
              <EmptyState title="No purchases in transit" description="Purchases marked inward transit will appear here." />
            ) : (
              <Table
                columns={transitColumns}
                rows={inwardTransitRows}
                getRowKey={(r) => r.rowKey}
                onRowClick={(r) => navigate(`/purchases/${r.parentId}`)}
              />
            )}
          </div>
        </Card>

        <Card className="flex h-64 flex-col overflow-hidden lg:h-[33vh]">
          <CardHeader
            title="Outward Transit"
            action={<button onClick={() => navigate('/sales?status=OUTWARD_TRANSIT')} className="text-sm font-medium text-brand-600 hover:underline">View all</button>}
          />
          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoadingOutward ? (
              <div className="p-6 text-sm text-graphite-400">Loading…</div>
            ) : outwardTransitRows.length === 0 ? (
              <EmptyState title="No sales in transit" description="Sales that are outward transit will appear here." />
            ) : (
              <Table
                columns={transitColumns}
                rows={outwardTransitRows}
                getRowKey={(r) => r.rowKey}
                onRowClick={(r) => navigate(`/sales/${r.parentId}`)}
              />
            )}
          </div>
        </Card>

        <Card className="flex h-72 flex-col overflow-hidden lg:h-[22rem]">
          <CardHeader title="Last 3 Days Sales" />
          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoadingRecent ? (
              <div className="p-6 text-sm text-graphite-400">Loading…</div>
            ) : recentSalesRows.length === 0 ? (
              <EmptyState title="No recent sales" description="Sales from the last 3 days will appear here." />
            ) : (
              <Table columns={recentSalesColumns} rows={recentSalesRows} getRowKey={(r) => r.rowKey} />
            )}
          </div>
        </Card>
      </div>

      <div className="flex min-h-0 w-full flex-col gap-4 lg:w-1/2">
        <Card className="flex h-64 flex-col overflow-hidden lg:h-[17rem]">
          <CardHeader
            title="Enquiries"
            action={
              <Button size="sm" onClick={() => setEnquiryModalOpen(true)}>
                Add Enquiry
              </Button>
            }
          />
          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoadingEnquiries ? (
              <div className="p-6 text-sm text-graphite-400">Loading…</div>
            ) : (enquiries ?? []).length === 0 ? (
              <EmptyState title="No open enquiries" description="Add an enquiry to track a product request." />
            ) : (
              <Table columns={enquiryColumns} rows={enquiries ?? []} getRowKey={(r) => r.id} />
            )}
          </div>
        </Card>

        <Card className="flex h-[26rem] flex-col overflow-hidden lg:h-auto lg:min-h-0 lg:flex-1">
          <CardHeader
            title="All Products"
            action={
              <Input
                placeholder="Search products…"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-40 sm:w-56"
              />
            }
          />
          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoadingProducts ? (
              <div className="p-6 text-sm text-graphite-400">Loading…</div>
            ) : productStockRows.length === 0 ? (
              <EmptyState
                title={productSearch ? 'No matching products' : 'No products'}
                description={
                  productSearch
                    ? 'Try a different search term.'
                    : 'Products will appear here once added to inventory.'
                }
              />
            ) : (
              <Table columns={productStockColumns} rows={productStockRows} getRowKey={(r) => r.id} />
            )}
          </div>
        </Card>
      </div>

      <EnquiryFormModal isOpen={enquiryModalOpen} onClose={() => setEnquiryModalOpen(false)} />
      <ConfirmEnquiryModal isOpen={!!confirmTarget} enquiry={confirmTarget} onClose={() => setConfirmTarget(null)} />
    </div>
  );
}
