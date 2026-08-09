import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
  Table,
  toast,
  type Column,
} from '@/components/ui';
import { useTableQuery } from '@/lib/useTableQuery';
import { extractErrorMessage } from '@/lib/apiClient';
import { useWarehousesPage, useDeleteWarehouse } from './hooks';
import { WarehouseFormModal } from './WarehouseFormModal';
import type { Warehouse } from '@/types';

export function WarehousesListPage() {
  const query = useTableQuery({ defaultSortBy: 'name', defaultSortDir: 'asc' });
  const { data, isLoading, isPlaceholderData } = useWarehousesPage({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
  });
  const deleteWarehouse = useDeleteWarehouse();
  const [formOpen, setFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const warehouses = data?.data ?? [];

  const openCreate = () => {
    setEditingWarehouse(null);
    setFormOpen(true);
  };

  const openEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteWarehouse.mutateAsync(deleteTarget.id);
      toast.success('Warehouse deleted');
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(extractErrorMessage(err, 'Could not delete warehouse.'));
    }
  };

  const columns: Column<Warehouse>[] = [
    {
      key: 'name',
      header: 'Warehouse',
      sortField: 'name',
      render: (w) => (
        <div>
          <p className="font-medium text-graphite-900">{w.name}</p>
          {w.code && <p className="text-xs text-graphite-400">{w.code}</p>}
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      render: (w) => w.address ?? <span className="text-graphite-300">—</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortField: 'isActive',
      render: (w) => <Badge tone={w.isActive ? 'success' : 'neutral'}>{w.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (w) => (
        <div className="flex justify-end gap-1">
          <IconButton
            label="Edit warehouse"
            tone="brand"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(w);
            }}
          >
            <Pencil className="h-4 w-4" strokeWidth={2} />
          </IconButton>
          <IconButton
            label="Delete warehouse"
            tone="danger"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteError(null);
              setDeleteTarget(w);
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
        title="Warehouses"
        description="Manage warehouse locations and their assigned staff."
        action={<Button onClick={openCreate} icon={<Plus className="h-4 w-4" strokeWidth={2} />}>Add warehouse</Button>}
      />

      <div className="mb-4 w-full max-w-xs">
        <Input
          placeholder="Search warehouses"
          value={query.searchInput}
          onChange={(e) => query.setSearchInput(e.target.value)}
          onKeyDown={query.handleSearchKeyDown}
        />
      </div>

      <Card className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
        {warehouses.length === 0 ? (
          <EmptyState
            title="No warehouses yet"
            description="Add your first warehouse to start tracking location-based stock."
            action={<Button onClick={openCreate} icon={<Plus className="h-4 w-4" strokeWidth={2} />}>Add warehouse</Button>}
          />
        ) : (
          <>
            <Table
              columns={columns}
              rows={warehouses}
              getRowKey={(w) => w.id}
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

      <WarehouseFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} warehouse={editingWarehouse} />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete warehouse"
        description={
          <>
            {deleteError ? (
              <span className="text-red-600">{deleteError}</span>
            ) : (
              <>
                Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
              </>
            )}
          </>
        }
        confirmLabel="Delete"
        isLoading={deleteWarehouse.isPending}
      />
    </div>
  );
}
