import { useState } from 'react';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  ConfirmModal,
  EmptyState,
  FullPageSpinner,
  IconButton,
  Input,
  PageHeader,
  Pagination,
  StatTile,
  Table,
  toast,
  type Column,
} from '@/components/ui';
import { useTableQuery } from '@/lib/useTableQuery';
import { useCustomersPage, useDeleteCustomer } from './hooks';
import { CustomerFormModal } from './CustomerFormModal';
import { WarehouseFilter } from '@/features/warehouses/WarehouseFilter';
import type { Customer } from '@/types';

export function CustomersListPage() {
  const query = useTableQuery({ defaultSortBy: 'createdAt' });
  const [warehouseId, setWarehouseId] = useState('');
  const { data, isLoading, isPlaceholderData } = useCustomersPage({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
    warehouseId: warehouseId || undefined,
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
        action={<Button onClick={openCreate} icon={<Plus className="h-4 w-4" strokeWidth={2} />}>Add customer</Button>}
      />

      {/* <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label="Total customers"
          value={data?.total ?? 0}
          icon={<Users className="h-4 w-4" strokeWidth={2} />}
        />
      </div> */}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="w-full max-w-xs flex-1 sm:w-auto">
          <Input
            placeholder="Search by name, email or phone"
            value={query.searchInput}
            onChange={(e) => query.setSearchInput(e.target.value)}
            onKeyDown={query.handleSearchKeyDown}
          />
        </div>
        <WarehouseFilter
          warehouseId={warehouseId}
          setWarehouseId={(v) => {
            setWarehouseId(v);
            query.setPage(1);
          }}
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

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteCustomer.mutate(deleteTarget.id, { onSuccess: () => {
            toast.success('Customer deleted');
            setDeleteTarget(null);
          } });
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
