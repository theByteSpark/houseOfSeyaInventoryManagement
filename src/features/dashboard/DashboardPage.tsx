import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, CheckCircle2, Trash2, XCircle } from 'lucide-react';
import { Badge, Button, Card, CardHeader, ConfirmModal, EmptyState, IconButton, Input, Table, type Column } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { formatDaysLeft, getDaysLeft, getDaysLeftTone } from '@/lib/date';
import { fuzzyFilter } from '@/lib/fuzzySearch';
import { extractErrorMessage } from '@/lib/apiClient';
import { useWarehouseContext } from '@/features/warehouses/WarehouseContext';
import { useDeleteEnquiry, useEnquiries } from '@/features/enquiries/hooks';
import { EnquiryFormModal } from '@/features/enquiries/EnquiryFormModal';
import { EditEnquiryModal } from '@/features/enquiries/EditEnquiryModal';
import { ConfirmEnquiryModal } from '@/features/enquiries/ConfirmEnquiryModal';
import { useProducts } from '@/features/inventory/hooks';
import { BlockedQuantityCell } from '@/features/inventory/BlockedQuantityCell';
import { useCancelPurchase, useMarkPurchaseInStock } from '@/features/purchases/hooks';
import { useCancelSale, useCompleteSale } from '@/features/sales/hooks';
import { useInwardTransitPurchases, useOutwardTransitSales, useRecentSalesByProduct } from './hooks';
import type { Enquiry, Product, Purchase, PurchaseStatus, RecentSaleByProduct, Sale, SaleStatus } from '@/types';

interface ProductStockRow {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  blockedQuantity: number;
  product: Product;
}

interface TransitProductRow {
  rowKey: string;
  parentId: string;
  status: PurchaseStatus | SaleStatus;
  productName: string;
  quantity: number;
  price: number;
  completionDate: string | null;
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
  const deleteEnquiry = useDeleteEnquiry();
  const cancelPurchase = useCancelPurchase();
  const markInStock = useMarkPurchaseInStock();
  const cancelSale = useCancelSale();
  const completeSale = useCompleteSale();

  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [editEnquiryTarget, setEditEnquiryTarget] = useState<Enquiry | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Enquiry | null>(null);
  const [deleteEnquiryTarget, setDeleteEnquiryTarget] = useState<Enquiry | null>(null);
  const [deleteEnquiryError, setDeleteEnquiryError] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [transitActionError, setTransitActionError] = useState<string | null>(null);
  const [cancelPurchaseTarget, setCancelPurchaseTarget] = useState<Purchase | null>(null);
  const [advancePurchaseTarget, setAdvancePurchaseTarget] = useState<Purchase | null>(null);
  const [cancelSaleTarget, setCancelSaleTarget] = useState<Sale | null>(null);
  const [completeSaleTarget, setCompleteSaleTarget] = useState<Sale | null>(null);

  const sortedRecentSales = useMemo(
    () => [...(recentSalesByProduct ?? [])].sort((a, b) => b.date.localeCompare(a.date)),
    [recentSalesByProduct],
  );

  const purchaseById = useMemo(() => new Map((inwardTransitPurchases ?? []).map((p) => [p.id, p])), [inwardTransitPurchases]);
  const saleById = useMemo(() => new Map((outwardTransitSales ?? []).map((s) => [s.id, s])), [outwardTransitSales]);

  const inwardTransitRows: TransitProductRow[] = useMemo(
    () =>
      (inwardTransitPurchases ?? []).flatMap((p) =>
        p.items.map((item) => ({
          rowKey: item.id,
          parentId: p.id,
          status: p.status,
          productName: item.productName,
          quantity: item.quantity,
          price: item.unitCost,
          completionDate: p.completionDate,
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
          status: s.status,
          productName: item.productName,
          quantity: item.quantity,
          price: item.unitPrice,
          completionDate: s.completionDate,
        })),
      ),
    [outwardTransitSales],
  );

  const baseTransitColumns: Column<TransitProductRow>[] = [
    { key: 'productName', header: 'Product Name', render: (r) => <span className="font-medium text-graphite-900">{r.productName}</span> },
    { key: 'quantity', header: 'Quantity (kgs)', align: 'right', render: (r) => r.quantity },
    { key: 'price', header: 'Price per kg', align: 'right', render: (r) => formatCurrency(r.price) },
    {
      key: 'daysLeft',
      header: 'Days Left',
      render: (r) => {
        const daysLeft = getDaysLeft(r.completionDate);
        return <Badge tone={getDaysLeftTone(daysLeft)}>{formatDaysLeft(daysLeft)}</Badge>;
      },
    },
  ];

  const inwardTransitColumns: Column<TransitProductRow>[] = [
    ...baseTransitColumns,
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => {
        const purchase = purchaseById.get(r.parentId);
        if (!purchase) return null;
        return (
          <div className="flex justify-end gap-1">
            <IconButton
              label="Edit purchase"
              tone="brand"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/purchases/${purchase.id}/edit`);
              }}
            >
              <Pencil className="h-4 w-4" strokeWidth={2} />
            </IconButton>
            <IconButton
              label="Mark in stock"
              tone="brand"
              disabled={markInStock.isPending}
              onClick={(e) => {
                e.stopPropagation();
                setTransitActionError(null);
                setAdvancePurchaseTarget(purchase);
              }}
            >
              <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
            </IconButton>
            <IconButton
              label="Cancel purchase"
              tone="danger"
              disabled={cancelPurchase.isPending}
              onClick={(e) => {
                e.stopPropagation();
                setTransitActionError(null);
                setCancelPurchaseTarget(purchase);
              }}
            >
              <XCircle className="h-4 w-4" strokeWidth={2} />
            </IconButton>
          </div>
        );
      },
    },
  ];

  const outwardTransitColumns: Column<TransitProductRow>[] = [
    ...baseTransitColumns,
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => {
        const sale = saleById.get(r.parentId);
        if (!sale) return null;
        return (
          <div className="flex justify-end gap-1">
            <IconButton
              label="Edit sale"
              tone="brand"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/sales/${sale.id}/edit`);
              }}
            >
              <Pencil className="h-4 w-4" strokeWidth={2} />
            </IconButton>
            <IconButton
              label="Mark as done"
              tone="brand"
              disabled={completeSale.isPending}
              onClick={(e) => {
                e.stopPropagation();
                setTransitActionError(null);
                setCompleteSaleTarget(sale);
              }}
            >
              <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
            </IconButton>
            <IconButton
              label="Cancel sale"
              tone="danger"
              disabled={cancelSale.isPending}
              onClick={(e) => {
                e.stopPropagation();
                setTransitActionError(null);
                setCancelSaleTarget(sale);
              }}
            >
              <XCircle className="h-4 w-4" strokeWidth={2} />
            </IconButton>
          </div>
        );
      },
    },
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
        <div className="flex justify-end gap-1">
          <IconButton label="Edit enquiry" tone="brand" onClick={() => setEditEnquiryTarget(r)}>
            <Pencil className="h-4 w-4" strokeWidth={2} />
          </IconButton>
          <IconButton label="Confirm enquiry" tone="brand" onClick={() => setConfirmTarget(r)}>
            <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
          </IconButton>
          <IconButton
            label="Delete enquiry"
            tone="danger"
            onClick={() => {
              setDeleteEnquiryError(null);
              setDeleteEnquiryTarget(r);
            }}
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
          </IconButton>
        </div>
      ),
    },
  ];

  const productStockRows: ProductStockRow[] = useMemo(() => {
    function quantityForSelectedWarehouse(product: Product): number {
      if (!selectedWarehouseId) return product.quantityInStock;
      return product.stockByWarehouse.find((s) => s.warehouseId === selectedWarehouseId)?.quantity ?? 0;
    }
    function blockedQuantityForSelectedWarehouse(product: Product): number {
      if (!selectedWarehouseId) return product.blockedQuantity;
      return product.stockByWarehouse.find((s) => s.warehouseId === selectedWarehouseId)?.blockedQuantity ?? 0;
    }
    const rows = [...(allProducts ?? [])]
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        quantity: quantityForSelectedWarehouse(p),
        blockedQuantity: blockedQuantityForSelectedWarehouse(p),
        product: p,
      }))
      .sort((a, b) => b.quantity - a.quantity);
    return fuzzyFilter(rows, productSearch, (r) => `${r.name} ${r.sku}`);
  }, [allProducts, selectedWarehouseId, productSearch]);

  const productStockColumns: Column<ProductStockRow>[] = [
    { key: 'name', header: 'Product Name', render: (r) => <span className="font-medium text-graphite-900">{r.name}</span> },
    { key: 'quantity', header: 'Quantity (kgs)', align: 'right', render: (r) => r.quantity },
    {
      key: 'blockedQuantity',
      header: 'Blocked (kgs)',
      align: 'right',
      render: (r) => <BlockedQuantityCell product={r.product} />,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {transitActionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {transitActionError}
        </div>
      )}
    <div className="flex flex-col gap-4 lg:h-[calc(100vh-theme(spacing.16))] lg:min-h-0 lg:flex-row">
      <div className="flex min-h-0 w-full flex-col gap-4 lg:w-1/2">
        <Card className="flex h-[26rem] flex-col overflow-hidden">
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
                columns={inwardTransitColumns}
                rows={inwardTransitRows}
                getRowKey={(r) => r.rowKey}
                onRowClick={(r) => navigate(`/purchases/${r.parentId}`)}
              />
            )}
          </div>
        </Card>

        <Card className="flex h-[26rem] flex-col overflow-hidden">
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
                columns={outwardTransitColumns}
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
    </div>

      <EnquiryFormModal isOpen={enquiryModalOpen} onClose={() => setEnquiryModalOpen(false)} />
      <EditEnquiryModal
        isOpen={!!editEnquiryTarget}
        enquiry={editEnquiryTarget}
        onClose={() => setEditEnquiryTarget(null)}
      />
      <ConfirmEnquiryModal isOpen={!!confirmTarget} enquiry={confirmTarget} onClose={() => setConfirmTarget(null)} />
      <ConfirmModal
        isOpen={!!deleteEnquiryTarget}
        onClose={() => setDeleteEnquiryTarget(null)}
        onConfirm={() => {
          if (!deleteEnquiryTarget) return;
          deleteEnquiry.mutate(deleteEnquiryTarget.id, {
            onSuccess: () => setDeleteEnquiryTarget(null),
            onError: (err) => setDeleteEnquiryError(extractErrorMessage(err, 'Could not delete enquiry.')),
          });
        }}
        title="Delete enquiry"
        description={
          <>
            Are you sure you want to delete the enquiry for <strong>{deleteEnquiryTarget?.productName}</strong>? This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        isLoading={deleteEnquiry.isPending}
        error={deleteEnquiryError}
      />

      <ConfirmModal
        isOpen={!!cancelPurchaseTarget}
        onClose={() => setCancelPurchaseTarget(null)}
        onConfirm={() => {
          if (!cancelPurchaseTarget) return;
          cancelPurchase.mutate(cancelPurchaseTarget.id, {
            onSuccess: () => setCancelPurchaseTarget(null),
            onError: (err) => setTransitActionError(extractErrorMessage(err, 'Could not cancel purchase.')),
          });
        }}
        title="Cancel purchase"
        description={
          <>
            Are you sure you want to cancel <strong>{cancelPurchaseTarget?.purchaseNumber}</strong>? This cannot be undone.
          </>
        }
        confirmLabel="Cancel purchase"
        isLoading={cancelPurchase.isPending}
      />

      <ConfirmModal
        isOpen={!!advancePurchaseTarget}
        onClose={() => setAdvancePurchaseTarget(null)}
        onConfirm={() => {
          if (!advancePurchaseTarget) return;
          markInStock.mutate(advancePurchaseTarget.id, {
            onSuccess: () => setAdvancePurchaseTarget(null),
            onError: (err) => setTransitActionError(extractErrorMessage(err, 'Could not mark in stock.')),
          });
        }}
        title="Mark in stock"
        description={
          <>
            Mark <strong>{advancePurchaseTarget?.purchaseNumber}</strong> as in stock? This will add the ordered
            quantities to inventory.
          </>
        }
        confirmLabel="Mark In Stock"
        tone="primary"
        isLoading={markInStock.isPending}
      />

      <ConfirmModal
        isOpen={!!cancelSaleTarget}
        onClose={() => setCancelSaleTarget(null)}
        onConfirm={() => {
          if (!cancelSaleTarget) return;
          cancelSale.mutate(cancelSaleTarget.id, {
            onSuccess: () => setCancelSaleTarget(null),
            onError: (err) => setTransitActionError(extractErrorMessage(err, 'Could not cancel sale.')),
          });
        }}
        title="Cancel sale"
        description={
          <>
            Are you sure you want to cancel <strong>{cancelSaleTarget?.saleNumber}</strong>? This cannot be undone.
          </>
        }
        confirmLabel="Cancel sale"
        isLoading={cancelSale.isPending}
      />

      <ConfirmModal
        isOpen={!!completeSaleTarget}
        onClose={() => setCompleteSaleTarget(null)}
        onConfirm={() => {
          if (!completeSaleTarget) return;
          completeSale.mutate(completeSaleTarget.id, {
            onSuccess: () => setCompleteSaleTarget(null),
            onError: (err) => setTransitActionError(extractErrorMessage(err, 'Could not mark sale as done.')),
          });
        }}
        title="Mark as done"
        description={
          <>
            Mark <strong>{completeSaleTarget?.saleNumber}</strong> as done?
          </>
        }
        confirmLabel="Mark as Done"
        tone="primary"
        isLoading={completeSale.isPending}
      />
    </div>
  );
}
