import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, FilePlus2, Pencil, Plus, Truck, XCircle } from 'lucide-react';
import { extractErrorMessage } from '@/lib/apiClient';
import { formatCurrency } from '@/lib/format';
import { formatDaysLeft, getDaysLeft, getDaysLeftTone } from '@/lib/date';
import {
  Badge,
  Button,
  Card,
  ConfirmModal,
  CsvImportModal,
  EmptyState,
  FullPageSpinner,
  IconButton,
  Input,
  InvoiceItemsCell,
  PageHeader,
  Pagination,
  Select,
  SplitAddButton,
  Table,
  type Column,
} from '@/components/ui';
import { useTableQuery } from '@/lib/useTableQuery';
import {
  purchaseKeys,
  useCancelPurchase,
  useMarkPurchaseInStock,
  useMarkPurchaseInwardTransit,
  usePurchasesPage,
} from './hooks';
import { PurchaseStatusBadge } from './statusBadge';
import { importPurchasesCsv } from '@/features/import-export/api';
import { useWarehouseContext } from '@/features/warehouses/WarehouseContext';
import { useWarehouses } from '@/features/warehouses/hooks';
import type { Purchase, PurchaseStatus } from '@/types';

const VALID_STATUSES: (PurchaseStatus | 'ALL')[] = [
  'ALL',
  'ORDERED',
  'INWARD_TRANSIT',
  'IN_STOCK',
  'CANCELLED',
];

export function PurchasesListPage() {
  const query = useTableQuery({ defaultSortBy: 'createdAt' });
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') as PurchaseStatus | 'ALL' | null;
  const [statusFilter, setStatusFilter] = useState<PurchaseStatus | 'ALL'>(
    initialStatus && VALID_STATUSES.includes(initialStatus) ? initialStatus : 'ALL',
  );
  const { selectedWarehouseId } = useWarehouseContext();
  const { data: warehouses } = useWarehouses();
  const selectedWarehouseName = warehouses?.find((w) => w.id === selectedWarehouseId)?.name;
  const { data, isLoading, isPlaceholderData } = usePurchasesPage({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
    status: statusFilter,
    warehouseId: selectedWarehouseId ?? undefined,
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const cancelPurchase = useCancelPurchase();
  const markInwardTransit = useMarkPurchaseInwardTransit();
  const markInStock = useMarkPurchaseInStock();
  const [actionError, setActionError] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Purchase | null>(null);
  const [advanceTarget, setAdvanceTarget] = useState<Purchase | null>(null);

  const purchases = data?.data ?? [];

  const handleStatusFilterChange = (value: PurchaseStatus | 'ALL') => {
    setStatusFilter(value);
    query.setPage(1);
  };

  const columns: Column<Purchase>[] = [
    {
      key: 'number',
      header: 'PO #',
      sortField: 'purchaseNumber',
      render: (p) => <span className="font-medium text-graphite-900">{p.purchaseNumber}</span>,
    },
    { key: 'vendor', header: 'Vendor', sortField: 'vendor', render: (p) => p.vendorName },
    {
      key: 'items',
      header: 'Items',
      render: (p) => (
        <InvoiceItemsCell
          items={p.items.map((item) => ({
            id: item.id,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitCost,
          }))}
        />
      ),
    },
    { key: 'status', header: 'Status', sortField: 'status', render: (p) => <PurchaseStatusBadge status={p.status} /> },
    { key: 'total', header: 'Total', align: 'right', render: (p) => formatCurrency(p.total) },
    {
      key: 'daysLeft',
      header: 'Days Left',
      render: (p) => {
        const daysLeft = getDaysLeft(p.completionDate, p.status === 'IN_STOCK');
        return <Badge tone={getDaysLeftTone(daysLeft)}>{formatDaysLeft(daysLeft)}</Badge>;
      },
    },
    {
      key: 'date',
      header: 'Created',
      sortField: 'createdAt',
      render: (p) => new Date(p.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <div className="flex justify-end gap-1">
          {(p.status === 'ORDERED' || p.status === 'INWARD_TRANSIT') && (
            <IconButton
              label="Edit purchase"
              tone="brand"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/purchases/${p.id}/edit`);
              }}
            >
              <Pencil className="h-4 w-4" strokeWidth={2} />
            </IconButton>
          )}
          {p.status === 'ORDERED' && (
            <IconButton
              label="Mark inward transit"
              tone="brand"
              disabled={markInwardTransit.isPending}
              onClick={(e) => {
                e.stopPropagation();
                setActionError(null);
                setAdvanceTarget(p);
              }}
            >
              <Truck className="h-4 w-4" strokeWidth={2} />
            </IconButton>
          )}
          {p.status === 'INWARD_TRANSIT' && (
            <IconButton
              label="Mark in stock"
              tone="brand"
              disabled={markInStock.isPending}
              onClick={(e) => {
                e.stopPropagation();
                setActionError(null);
                setAdvanceTarget(p);
              }}
            >
              <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
            </IconButton>
          )}
          {(p.status === 'ORDERED' || p.status === 'INWARD_TRANSIT') && (
            <IconButton
              label="Cancel purchase"
              tone="danger"
              disabled={cancelPurchase.isPending}
              onClick={(e) => {
                e.stopPropagation();
                setActionError(null);
                setCancelTarget(p);
              }}
            >
              <XCircle className="h-4 w-4" strokeWidth={2} />
            </IconButton>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) return <FullPageSpinner />;

  return (
    <div>
      <PageHeader
        title="Purchases"
        description="Record purchase orders and track deliveries from vendors."
        action={
          <SplitAddButton
            label="Add purchase"
            icon={<Plus className="h-4 w-4" strokeWidth={2} />}
            onClick={() => navigate('/purchases/new')}
            options={[
              {
                key: 'import',
                label: 'Import from CSV',
                icon: <FilePlus2 className="h-4 w-4" strokeWidth={2} />,
                onClick: () => setImportOpen(true),
              },
            ]}
          />
        }
      />

      {actionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="w-full max-w-xs flex-1 sm:w-auto">
          <Input
            placeholder="Search by PO #, vendor or product"
            value={query.searchInput}
            onChange={(e) => query.setSearchInput(e.target.value)}
            onKeyDown={query.handleSearchKeyDown}
          />
        </div>
        <Select
          className="w-full sm:w-auto sm:max-w-[180px]"
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value as PurchaseStatus | 'ALL')}
        >
          <option value="ALL">All statuses</option>
          <option value="ORDERED">Ordered</option>
          <option value="INWARD_TRANSIT">Inward Transit</option>
          <option value="IN_STOCK">In Stock</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </div>

      <Card className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
        {purchases.length === 0 ? (
          <EmptyState
            title="No purchases found"
            description="Add your first purchase order to start tracking vendor deliveries."
            action={<Button onClick={() => navigate('/purchases/new')} icon={<Plus className="h-4 w-4" strokeWidth={2} />}>Add purchase</Button>}
          />
        ) : (
          <>
            <Table
              columns={columns}
              rows={purchases}
              getRowKey={(p) => p.id}
              onRowClick={(p) => navigate(`/purchases/${p.id}`)}
              sortBy={query.sortBy}
              sortDir={query.sortDir}
              onSortChange={query.toggleSort}
            />
            <Pagination
              page={data?.page ?? query.page}
              pageSize={data?.pageSize ?? query.pageSize}
              total={data?.total ?? 0}
              onPageChange={query.setPage}
              onPageSizeChange={query.setPageSize}
            />
          </>
        )}
      </Card>

      <CsvImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import purchases from CSV"
        templateUrl="/import/purchases/template"
        templateFilename="purchases-import-template.csv"
        onUpload={importPurchasesCsv}
        requiresWarehouse
        selectedWarehouseId={selectedWarehouseId}
        selectedWarehouseName={selectedWarehouseName}
        onImported={() => queryClient.invalidateQueries({ queryKey: purchaseKeys.all })}
        rowLabel={(row) => (typeof row.purchaseNumber === 'string' ? row.purchaseNumber : '')}
      />

      <ConfirmModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          if (!cancelTarget) return;
          cancelPurchase.mutate(cancelTarget.id, {
            onSuccess: () => setCancelTarget(null),
            onError: (err) => setActionError(extractErrorMessage(err, 'Could not cancel purchase.')),
          });
        }}
        title="Cancel purchase"
        description={
          <>
            Are you sure you want to cancel <strong>{cancelTarget?.purchaseNumber}</strong>? This cannot be undone.
          </>
        }
        confirmLabel="Cancel purchase"
        isLoading={cancelPurchase.isPending}
      />

      <ConfirmModal
        isOpen={!!advanceTarget}
        onClose={() => setAdvanceTarget(null)}
        onConfirm={() => {
          if (!advanceTarget) return;
          const isOrdered = advanceTarget.status === 'ORDERED';
          const mutation = isOrdered ? markInwardTransit : markInStock;
          mutation.mutate(advanceTarget.id, {
            onSuccess: () => setAdvanceTarget(null),
            onError: (err) =>
              setActionError(extractErrorMessage(err, isOrdered ? 'Could not mark inward transit.' : 'Could not mark in stock.')),
          });
        }}
        title={advanceTarget?.status === 'ORDERED' ? 'Mark inward transit' : 'Mark in stock'}
        description={
          advanceTarget?.status === 'ORDERED' ? (
            <>
              Mark <strong>{advanceTarget?.purchaseNumber}</strong> as inward transit?
            </>
          ) : (
            <>
              Mark <strong>{advanceTarget?.purchaseNumber}</strong> as in stock? This will add the ordered quantities
              to inventory.
            </>
          )
        }
        confirmLabel={advanceTarget?.status === 'ORDERED' ? 'Mark Inward Transit' : 'Mark In Stock'}
        tone="primary"
        isLoading={markInwardTransit.isPending || markInStock.isPending}
      />
    </div>
  );
}
