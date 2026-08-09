import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, FilePlus2, Pencil, Plus, XCircle } from 'lucide-react';
import { extractErrorMessage } from '@/lib/apiClient';
import { formatCurrency } from '@/lib/format';
import {
  Button,
  Card,
  CsvImportModal,
  EmptyState,
  FullPageSpinner,
  IconButton,
  Input,
  PageHeader,
  Pagination,
  Select,
  SplitAddButton,
  Table,
  type Column,
} from '@/components/ui';
import { useTableQuery } from '@/lib/useTableQuery';
import { purchaseKeys, useCancelPurchase, useOrderPurchase, usePurchasesPage } from './hooks';
import { PurchaseStatusBadge } from './statusBadge';
import { importPurchasesCsv } from '@/features/import-export/api';
import { WarehouseFilter } from '@/features/warehouses/WarehouseFilter';
import type { Purchase, PurchaseStatus } from '@/types';

const VALID_STATUSES: (PurchaseStatus | 'ALL')[] = [
  'ALL',
  'DRAFT',
  'ORDERED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CANCELLED',
];

export function PurchasesListPage() {
  const query = useTableQuery({ defaultSortBy: 'createdAt' });
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') as PurchaseStatus | 'ALL' | null;
  const [statusFilter, setStatusFilter] = useState<PurchaseStatus | 'ALL'>(
    initialStatus && VALID_STATUSES.includes(initialStatus) ? initialStatus : 'ALL',
  );
  const [warehouseId, setWarehouseId] = useState('');
  const { data, isLoading, isPlaceholderData } = usePurchasesPage({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
    status: statusFilter,
    warehouseId: warehouseId || undefined,
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const orderPurchase = useOrderPurchase();
  const cancelPurchase = useCancelPurchase();
  const [actionError, setActionError] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const purchases = data?.data ?? [];

  const handleStatusFilterChange = (value: PurchaseStatus | 'ALL') => {
    setStatusFilter(value);
    query.setPage(1);
  };

  const handleWarehouseFilterChange = (value: string) => {
    setWarehouseId(value);
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
    { key: 'status', header: 'Status', sortField: 'status', render: (p) => <PurchaseStatusBadge status={p.status} /> },
    { key: 'total', header: 'Total', align: 'right', render: (p) => formatCurrency(p.total) },
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
          {p.status === 'DRAFT' && (
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
          {p.status === 'DRAFT' && (
            <IconButton
              label="Mark as ordered"
              tone="brand"
              disabled={orderPurchase.isPending}
              onClick={(e) => {
                e.stopPropagation();
                setActionError(null);
                orderPurchase.mutate(p.id, {
                  onError: (err) => setActionError(extractErrorMessage(err, 'Could not order purchase.')),
                });
              }}
            >
              <ClipboardCheck className="h-4 w-4" strokeWidth={2} />
            </IconButton>
          )}
          {(p.status === 'DRAFT' || p.status === 'ORDERED' || p.status === 'PARTIALLY_RECEIVED') && (
            <IconButton
              label="Cancel purchase"
              tone="danger"
              disabled={cancelPurchase.isPending}
              onClick={(e) => {
                e.stopPropagation();
                setActionError(null);
                cancelPurchase.mutate(p.id, {
                  onError: (err) => setActionError(extractErrorMessage(err, 'Could not cancel purchase.')),
                });
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
          <option value="DRAFT">Draft</option>
          <option value="ORDERED">Ordered</option>
          <option value="PARTIALLY_RECEIVED">Partially received</option>
          <option value="RECEIVED">Received</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
        <WarehouseFilter warehouseId={warehouseId} setWarehouseId={handleWarehouseFilterChange} />
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
        onImported={() => queryClient.invalidateQueries({ queryKey: purchaseKeys.all })}
        rowLabel={(row) => (typeof row.purchaseNumber === 'string' ? row.purchaseNumber : '')}
      />
    </div>
  );
}
