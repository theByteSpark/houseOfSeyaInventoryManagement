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
  type Column,
} from '@/components/ui';
import { useTableQuery } from '@/lib/useTableQuery';
import { extractErrorMessage } from '@/lib/apiClient';
import { useVendorsPage, useDeleteVendor } from './hooks';
import { VendorFormModal } from './VendorFormModal';
import type { Vendor } from '@/types';

export function VendorsListPage() {
  const query = useTableQuery({ defaultSortBy: 'createdAt' });
  const { data, isLoading, isPlaceholderData } = useVendorsPage({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
  });
  const deleteVendor = useDeleteVendor();
  const [formOpen, setFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const vendors = data?.data ?? [];

  const openCreate = () => {
    setEditingVendor(null);
    setFormOpen(true);
  };

  const openEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormOpen(true);
  };

  const columns: Column<Vendor>[] = [
    {
      key: 'companyName',
      header: 'Company',
      sortField: 'companyName',
      render: (v) => (
        <div>
          <p className="font-medium text-graphite-900">{v.companyName}</p>
          {v.contactPerson && <p className="text-xs text-graphite-400">{v.contactPerson}</p>}
        </div>
      ),
    },
    { key: 'email', header: 'Email', sortField: 'email', render: (v) => v.email ?? <span className="text-graphite-300">—</span> },
    { key: 'phone', header: 'Phone', sortField: 'phone', render: (v) => v.phone ?? <span className="text-graphite-300">—</span> },
    {
      key: 'lastOrder',
      header: 'Last order',
      render: (v) =>
        v.lastOrderedDate ? (
          <div>
            <p className="text-sm text-graphite-700">{new Date(v.lastOrderedDate).toLocaleDateString()}</p>
            {v.lastOrderedProduct && (
              <p className="text-xs text-graphite-400">
                {v.lastOrderedProduct} ({v.lastOrderedQty})
              </p>
            )}
          </div>
        ) : (
          <span className="text-graphite-300">—</span>
        ),
    },
    {
      key: 'orders',
      header: 'Orders',
      align: 'right',
      sortField: 'totalOrders',
      render: (v) => <Badge tone={v.totalOrders > 0 ? 'info' : 'neutral'}>{v.totalOrders}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (v) => (
        <div className="flex justify-end gap-1">
          <IconButton
            label="Edit vendor"
            tone="brand"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(v);
            }}
          >
            <Pencil className="h-4 w-4" strokeWidth={2} />
          </IconButton>
          <IconButton
            label="Delete vendor"
            tone="danger"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteError(null);
              setDeleteTarget(v);
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
        title="Vendors"
        description="Manage the suppliers you purchase from."
        action={<Button onClick={openCreate} icon={<Plus className="h-4 w-4" strokeWidth={2} />}>Add vendor</Button>}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="w-full max-w-xs flex-1 sm:w-auto">
          <Input
            placeholder="Search by company, contact, email or phone"
            value={query.searchInput}
            onChange={(e) => query.setSearchInput(e.target.value)}
            onKeyDown={query.handleSearchKeyDown}
          />
        </div>
      </div>

      <Card className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
        {vendors.length === 0 ? (
          <EmptyState
            title="No vendors yet"
            description="Add your first vendor to start recording purchases."
            action={<Button onClick={openCreate} icon={<Plus className="h-4 w-4" strokeWidth={2} />}>Add vendor</Button>}
          />
        ) : (
          <>
            <Table
              columns={columns}
              rows={vendors}
              getRowKey={(v) => v.id}
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

      <VendorFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} vendor={editingVendor} />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          setDeleteError(null);
          deleteVendor.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
            onError: (err) => setDeleteError(extractErrorMessage(err, 'Could not delete vendor.')),
          });
        }}
        title="Delete vendor"
        description={
          <>
            Are you sure you want to delete <strong>{deleteTarget?.companyName}</strong>? This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        isLoading={deleteVendor.isPending}
        error={deleteError}
      />
    </div>
  );
}
