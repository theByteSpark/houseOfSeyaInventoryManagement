import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, FilePlus2, Pencil, Plus, XCircle } from 'lucide-react';
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
import { saleKeys, useCancelSale, useCompleteSale, useSalesPage } from './hooks';
import { SaleStatusBadge } from './statusBadge';
import { importSalesCsv } from '@/features/import-export/api';
import { useWarehouseContext } from '@/features/warehouses/WarehouseContext';
import { useWarehouses } from '@/features/warehouses/hooks';
import type { Sale, SaleStatus } from '@/types';

export function SalesListPage() {
  const query = useTableQuery({ defaultSortBy: 'createdAt' });
  const [statusFilter, setStatusFilter] = useState<SaleStatus | 'ALL'>('ALL');
  const { selectedWarehouseId } = useWarehouseContext();
  const { data: warehouses } = useWarehouses();
  const selectedWarehouseName = warehouses?.find((w) => w.id === selectedWarehouseId)?.name;
  const { data, isLoading, isPlaceholderData } = useSalesPage({
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
  const cancelSale = useCancelSale();
  const completeSale = useCompleteSale();
  const [importOpen, setImportOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Sale | null>(null);
  const [completeTarget, setCompleteTarget] = useState<Sale | null>(null);

  const sales = data?.data ?? [];

  const handleStatusFilterChange = (value: SaleStatus | 'ALL') => {
    setStatusFilter(value);
    query.setPage(1);
  };

  const columns: Column<Sale>[] = [
    {
      key: 'number',
      header: 'Sale',
      sortField: 'saleNumber',
      render: (sale) => <span className="font-medium text-graphite-900">{sale.saleNumber}</span>,
    },
    { key: 'customer', header: 'Customer', sortField: 'customer', render: (sale) => sale.customerName },
    {
      key: 'items',
      header: 'Items',
      render: (sale) => (
        <InvoiceItemsCell
          items={sale.items.map((item) => ({
            id: item.id,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          }))}
        />
      ),
    },
    { key: 'status', header: 'Status', sortField: 'status', render: (sale) => <SaleStatusBadge status={sale.status} /> },
    { key: 'total', header: 'Total', align: 'right', sortField: 'total', render: (sale) => formatCurrency(sale.total) },
    {
      key: 'daysLeft',
      header: 'Days Left',
      render: (sale) => {
        const daysLeft = getDaysLeft(sale.completionDate, sale.status === 'DONE');
        return <Badge tone={getDaysLeftTone(daysLeft)}>{formatDaysLeft(daysLeft)}</Badge>;
      },
    },
    {
      key: 'date',
      header: 'Created',
      sortField: 'createdAt',
      render: (sale) => new Date(sale.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (sale) =>
        sale.status === 'OUTWARD_TRANSIT' ? (
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
                setActionError(null);
                setCompleteTarget(sale);
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
                setActionError(null);
                setCancelTarget(sale);
              }}
            >
              <XCircle className="h-4 w-4" strokeWidth={2} />
            </IconButton>
          </div>
        ) : null,
    },
  ];

  if (isLoading) return <FullPageSpinner />;

  return (
    <div>
      <PageHeader
        title="Sales"
        description="Record sales and track their status for customers."
        action={
          <SplitAddButton
            label="Add sale"
            icon={<Plus className="h-4 w-4" strokeWidth={2} />}
            onClick={() => navigate('/sales/new')}
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
            placeholder="Search by sale #, customer or product"
            value={query.searchInput}
            onChange={(e) => query.setSearchInput(e.target.value)}
            onKeyDown={query.handleSearchKeyDown}
          />
        </div>
        <Select
          className="w-full sm:w-auto sm:max-w-[160px]"
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value as SaleStatus | 'ALL')}
        >
          <option value="ALL">All statuses</option>
          <option value="OUTWARD_TRANSIT">Outward Transit</option>
          <option value="DONE">Done</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </div>

      <Card className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
        {sales.length === 0 ? (
          <EmptyState
            title="No sales found"
            description="Add your first sale to bill a customer."
            action={<Button onClick={() => navigate('/sales/new')} icon={<Plus className="h-4 w-4" strokeWidth={2} />}>Add sale</Button>}
          />
        ) : (
          <>
            <Table
              columns={columns}
              rows={sales}
              getRowKey={(sale) => sale.id}
              onRowClick={(sale) => navigate(`/sales/${sale.id}`)}
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
        title="Import sales from CSV"
        templateUrl="/import/sales/template"
        templateFilename="sales-import-template.csv"
        onUpload={importSalesCsv}
        requiresWarehouse
        selectedWarehouseId={selectedWarehouseId}
        selectedWarehouseName={selectedWarehouseName}
        onImported={() => queryClient.invalidateQueries({ queryKey: saleKeys.all })}
        rowLabel={(row) => (typeof row.saleNumber === 'string' ? row.saleNumber : '')}
      />

      <ConfirmModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          if (!cancelTarget) return;
          cancelSale.mutate(cancelTarget.id, {
            onSuccess: () => setCancelTarget(null),
            onError: (err) => setActionError(extractErrorMessage(err, 'Could not cancel sale.')),
          });
        }}
        title="Cancel sale"
        description={
          <>
            Are you sure you want to cancel <strong>{cancelTarget?.saleNumber}</strong>? This cannot be undone.
          </>
        }
        confirmLabel="Cancel sale"
        isLoading={cancelSale.isPending}
      />

      <ConfirmModal
        isOpen={!!completeTarget}
        onClose={() => setCompleteTarget(null)}
        onConfirm={() => {
          if (!completeTarget) return;
          completeSale.mutate(completeTarget.id, {
            onSuccess: () => setCompleteTarget(null),
            onError: (err) => setActionError(extractErrorMessage(err, 'Could not mark sale as done.')),
          });
        }}
        title="Mark as done"
        description={
          <>
            Mark <strong>{completeTarget?.saleNumber}</strong> as done?
          </>
        }
        confirmLabel="Mark as Done"
        tone="primary"
        isLoading={completeSale.isPending}
      />
    </div>
  );
}
