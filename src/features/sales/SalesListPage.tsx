import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Banknote, FilePlus2, Pencil, Plus, Send } from 'lucide-react';
import { extractErrorMessage } from '@/lib/apiClient';
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
  toast,
  type Column,
} from '@/components/ui';
import { useTableQuery } from '@/lib/useTableQuery';
import { formatCurrency } from '@/lib/format';
import { saleKeys, useIssueSale, useMarkSalePaid, useSalesPage } from './hooks';
import { SaleStatusBadge } from './statusBadge';
import { importSalesCsv } from '@/features/import-export/api';
import { WarehouseFilter } from '@/features/warehouses/WarehouseFilter';
import type { Sale, SaleStatus } from '@/types';

export function SalesListPage() {
  const query = useTableQuery({ defaultSortBy: 'createdAt' });
  const [statusFilter, setStatusFilter] = useState<SaleStatus | 'ALL'>('ALL');
  const [warehouseId, setWarehouseId] = useState('');
  const { data, isLoading, isPlaceholderData } = useSalesPage({
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
  const issueSale = useIssueSale();
  const markSalePaid = useMarkSalePaid();
  const [actionError, setActionError] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const sales = data?.data ?? [];

  const handleStatusFilterChange = (value: SaleStatus | 'ALL') => {
    setStatusFilter(value);
    query.setPage(1);
  };

  const handleWarehouseFilterChange = (value: string) => {
    setWarehouseId(value);
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
    { key: 'status', header: 'Status', sortField: 'status', render: (sale) => <SaleStatusBadge status={sale.status} /> },
    { key: 'total', header: 'Total', align: 'right', sortField: 'total', render: (sale) => formatCurrency(sale.total) },
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
      render: (sale) => (
        <div className="flex justify-end gap-1">
          {sale.status === 'DRAFT' && (
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
          )}
          {sale.status === 'DRAFT' && (
            <IconButton
              label="Confirm sale"
              tone="brand"
              disabled={issueSale.isPending}
              onClick={(e) => {
                e.stopPropagation();
                setActionError(null);
                issueSale.mutate(sale.id, {
                  onSuccess: () => toast.success('Sale confirmed'),
                  onError: (err) => {
                    const msg = extractErrorMessage(err, 'Could not confirm sale.');
                    setActionError(msg);
                    toast.error(msg);
                  },
                });
              }}
            >
              <Send className="h-4 w-4" strokeWidth={2} />
            </IconButton>
          )}
          {sale.status === 'ISSUED' && (
            <IconButton
              label="Mark as paid"
              tone="brand"
              disabled={markSalePaid.isPending}
              onClick={(e) => {
                e.stopPropagation();
                setActionError(null);
                markSalePaid.mutate(sale.id, {
                  onSuccess: () => toast.success('Sale marked as paid'),
                  onError: (err) => {
                    const msg = extractErrorMessage(err, 'Could not mark sale as paid.');
                    setActionError(msg);
                    toast.error(msg);
                  },
                });
              }}
            >
              <Banknote className="h-4 w-4" strokeWidth={2} />
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
                label: 'Import from CSV or Excel',
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
          <option value="DRAFT">Draft</option>
          <option value="ISSUED">Issued</option>
          <option value="PAID">Paid</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
        <WarehouseFilter warehouseId={warehouseId} setWarehouseId={handleWarehouseFilterChange} />
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
        title="Import sales from CSV or Excel"
        templateUrl="/import/sales/template"
        templateFilename="sales-import-template.csv"
        onUpload={importSalesCsv}
        requiresWarehouse
        onImported={() => queryClient.invalidateQueries({ queryKey: saleKeys.all })}
        rowLabel={(row) => (typeof row.saleNumber === 'string' ? row.saleNumber : '')}
      />
    </div>
  );
}
