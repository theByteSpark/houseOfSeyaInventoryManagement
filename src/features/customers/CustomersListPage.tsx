import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, Upload } from 'lucide-react';
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
  Table,
  type Column,
} from '@/components/ui';
import { useTableQuery } from '@/lib/useTableQuery';
import { importCustomersCsv } from '@/features/import-export/api';
import { customerKeys, useCustomersPage, useDeleteCustomer } from './hooks';
import { CustomerFormModal } from './CustomerFormModal';
import type { Customer } from '@/types';

export function CustomersListPage() {
  const queryClient = useQueryClient();
  const query = useTableQuery({ defaultSortBy: 'createdAt' });
  const [importOpen, setImportOpen] = useState(false);
  const { data, isLoading, isPlaceholderData } = useCustomersPage({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
  });
  const deleteCustomer = useDeleteCustomer();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

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
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setImportOpen(true)} icon={<Upload className="h-4 w-4" strokeWidth={2} />}>
              Import
            </Button>
            <Button onClick={openCreate} icon={<Plus className="h-4 w-4" strokeWidth={2} />}>Add customer</Button>
          </div>
        }
      />

      <div className="mb-4 w-full max-w-xs">
        <Input
          placeholder="Search by name, email or phone"
          value={query.searchInput}
          onChange={(e) => query.setSearchInput(e.target.value)}
          onKeyDown={query.handleSearchKeyDown}
        />
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
        title="Import customers"
        templateUrl="/import/customers/template"
        templateFilename="customers-import-template.csv"
        onUpload={importCustomersCsv}
        onImported={() => queryClient.invalidateQueries({ queryKey: customerKeys.all })}
        rowLabel={(r) => String(r.name ?? r.email ?? r.row)}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteCustomer.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
        title="Delete customer"
        description={
          <>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        isLoading={deleteCustomer.isPending}
      />
    </div>
  );
}
