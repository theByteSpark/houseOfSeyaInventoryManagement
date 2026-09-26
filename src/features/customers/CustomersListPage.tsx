import { useState } from 'react';
import { FilePlus2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
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
  PageHeader,
  Pagination,
  SplitAddButton,
  Table,
  type Column,
} from '@/components/ui';
import { useTableQuery } from '@/lib/useTableQuery';
import { extractErrorMessage } from '@/lib/apiClient';
import { importCustomersCsv } from '@/features/import-export/api';
import { customerKeys, useCustomersPage, useDeleteCustomer } from './hooks';
import { CustomerFormModal } from './CustomerFormModal';
import type { Customer } from '@/types';

export function CustomersListPage() {
  const query = useTableQuery({ defaultSortBy: 'createdAt' });
  const { data, isLoading, isPlaceholderData } = useCustomersPage({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
  });
  const queryClient = useQueryClient();
  const deleteCustomer = useDeleteCustomer();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const customers = data?.data ?? [];

  const openCreate = () => {
    setEditingCustomer(null);
    setFormOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormOpen(true);
  };

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Name',
      sortField: 'name',
      render: (c) => <span className="font-medium text-graphite-900">{c.name}</span>,
    },
    { key: 'email', header: 'Email', sortField: 'email', render: (c) => c.email ?? <span className="text-graphite-300">—</span> },
    { key: 'phone', header: 'Phone', sortField: 'phone', render: (c) => c.phone ?? <span className="text-graphite-300">—</span> },
    {
      key: 'sales',
      header: 'Sales',
      align: 'right',
      sortField: 'totalSales',
      render: (c) => <Badge tone={c.totalSales > 0 ? 'info' : 'neutral'}>{c.totalSales}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (c) => (
        <div className="flex justify-end gap-1">
          <IconButton
            label="Edit customer"
            tone="brand"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(c);
            }}
          >
            <Pencil className="h-4 w-4" strokeWidth={2} />
          </IconButton>
          <IconButton
            label="Delete customer"
            tone="danger"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteError(null);
              setDeleteTarget(c);
            }}
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
          </IconButton>
        </div>
      ),
    },
  ];

  if (isLoading) return <FullPageSpinner />;

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage the companies and contacts you sell to."
        action={
          <SplitAddButton
            label="Add customer"
            icon={<Plus className="h-4 w-4" strokeWidth={2} />}
            onClick={openCreate}
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

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="w-full max-w-xs flex-1 sm:w-auto">
          <Input
            placeholder="Search by name, email or phone"
            value={query.searchInput}
            onChange={(e) => query.setSearchInput(e.target.value)}
            onKeyDown={query.handleSearchKeyDown}
          />
        </div>
      </div>

      <Card className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
        {customers.length === 0 ? (
          <EmptyState
            title="No customers yet"
            description="Add your first customer to start recording sales for them."
            action={<Button onClick={openCreate} icon={<Plus className="h-4 w-4" strokeWidth={2} />}>Add customer</Button>}
          />
        ) : (
          <>
            <Table
              columns={columns}
              rows={customers}
              getRowKey={(c) => c.id}
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

      <CustomerFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} customer={editingCustomer} />

      <CsvImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import customers from CSV"
        templateUrl="/import/customers/template"
        templateFilename="customers-import-template.csv"
        onUpload={importCustomersCsv}
        onImported={() => queryClient.invalidateQueries({ queryKey: customerKeys.all })}
        rowLabel={(row) => (typeof row.name === 'string' ? row.name : '')}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          setDeleteError(null);
          deleteCustomer.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
            onError: (err) => setDeleteError(extractErrorMessage(err, 'Could not delete customer.')),
          });
        }}
        title="Delete customer"
        description={
          <>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        isLoading={deleteCustomer.isPending}
        error={deleteError}
      />
    </div>
  );
}
