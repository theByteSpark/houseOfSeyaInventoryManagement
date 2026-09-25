import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Banknote, FileText, Pencil, Plus, Send, Upload } from 'lucide-react';
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
  Table,
  type Column,
} from '@/components/ui';
import { useTableQuery } from '@/lib/useTableQuery';
import { formatCurrency } from '@/lib/format';
import { importSalesCsv } from '@/features/import-export/api';
import { saleKeys, useIssueSale, useMarkSalePaid, useSalesPage } from './hooks';
import { SaleStatusBadge } from './statusBadge';
import { InvoicePdfModal } from './InvoicePdfModal';
import type { Sale, SaleStatus } from '@/types';

export function SalesListPage() {
  const queryClient = useQueryClient();
  const query = useTableQuery({ defaultSortBy: 'createdAt' });
  const [statusFilter, setStatusFilter] = useState<SaleStatus | 'ALL'>('ALL');
  const [importOpen, setImportOpen] = useState(false);
  const { data, isLoading, isPlaceholderData } = useSalesPage({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
    status: statusFilter,
  });
  const navigate = useNavigate();
  const issueSale = useIssueSale();
  const markSalePaid = useMarkSalePaid();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pdfSale, setPdfSale] = useState<Sale | null>(null);

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
              label="Issue invoice"
              tone="brand"
              disabled={issueSale.isPending}
              onClick={(e) => {
                e.stopPropagation();
                setActionError(null);
                issueSale.mutate(sale.id, {
                  onError: (err) => setActionError(extractErrorMessage(err, 'Could not issue sale.')),
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
                  onError: (err) => setActionError(extractErrorMessage(err, 'Could not mark sale as paid.')),
                });
              }}
            >
              <Banknote className="h-4 w-4" strokeWidth={2} />
            </IconButton>
          )}
          {sale.status !== 'DRAFT' && (
            <IconButton
              label="View / download invoice"
              tone="neutral"
              onClick={(e) => {
                e.stopPropagation();
                setPdfSale(sale);
              }}
            >
              <FileText className="h-4 w-4" strokeWidth={2} />
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
        description="Record sales and generate invoices for customers."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setImportOpen(true)} icon={<Upload className="h-4 w-4" strokeWidth={2} />}>
              Import
            </Button>
            <Button onClick={() => navigate('/sales/new')} icon={<Plus className="h-4 w-4" strokeWidth={2} />}>Add sale</Button>
          </div>
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

      {pdfSale && (
        <InvoicePdfModal saleId={pdfSale.id} saleNumber={pdfSale.saleNumber} onClose={() => setPdfSale(null)} />
      )}

      <CsvImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import sales"
        templateUrl="/import/sales/template"
        templateFilename="sales-import-template.csv"
        onUpload={importSalesCsv}
        onImported={() => queryClient.invalidateQueries({ queryKey: saleKeys.all })}
        rowLabel={(r) => String(r.saleNumber ?? r.row)}
      />
    </div>
  );
}
