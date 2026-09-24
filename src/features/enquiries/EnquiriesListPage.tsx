import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
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
import { useDeleteEnquiry, useEnquiriesPage } from './hooks';
import { EnquiryFormModal } from './EnquiryFormModal';
import type { Enquiry } from '@/types';

export function EnquiriesListPage() {
  const query = useTableQuery({ defaultSortBy: 'createdAt' });
  const { data, isLoading, isPlaceholderData } = useEnquiriesPage({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
  });
  const deleteEnquiry = useDeleteEnquiry();
  const [formOpen, setFormOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Enquiry | null>(null);

  const enquiries = data?.data ?? [];

  const openCreate = () => {
    setEditingEnquiry(null);
    setFormOpen(true);
  };

  const openEdit = (enquiry: Enquiry) => {
    setEditingEnquiry(enquiry);
    setFormOpen(true);
  };

  const columns: Column<Enquiry>[] = [
    {
      key: 'customer',
      header: 'Customer',
      sortField: 'customer',
      render: (e) => <span className="font-medium text-graphite-900">{e.customerName}</span>,
    },
    {
      key: 'subcategory',
      header: 'Subcategory',
      sortField: 'subcategory',
      render: (e) =>
        e.subcategoryName ? (
          <div>
            <div>{e.subcategoryName}</div>
            {e.categoryName && <div className="text-xs text-graphite-400">{e.categoryName}</div>}
          </div>
        ) : (
          <span className="text-graphite-300">—</span>
        ),
    },
    { key: 'metal', header: 'Metal', sortField: 'metalType', render: (e) => e.metalType },
    { key: 'weight', header: 'Gr.Wt', sortField: 'grossWeight', align: 'right', render: (e) => e.grossWeight },
    {
      key: 'diamonds',
      header: 'Diamonds',
      render: (e) =>
        e.diamonds.length === 0 ? (
          <span className="text-graphite-300">—</span>
        ) : (
          e.diamonds.map((d) => `${d.pieces}× ${d.shape}/${d.quality}`).join(', ')
        ),
    },
    {
      key: 'createdAt',
      header: 'Recorded',
      sortField: 'createdAt',
      render: (e) => new Date(e.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (e) => (
        <div className="flex justify-end gap-1">
          <IconButton
            label="Edit enquiry"
            tone="brand"
            onClick={(ev) => {
              ev.stopPropagation();
              openEdit(e);
            }}
          >
            <Pencil className="h-4 w-4" strokeWidth={2} />
          </IconButton>
          <IconButton
            label="Delete enquiry"
            tone="danger"
            onClick={(ev) => {
              ev.stopPropagation();
              setDeleteTarget(e);
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
        title="Enquiries"
        description="Record what a customer is asking about before it becomes a costed product or sale."
        action={<Button onClick={openCreate} icon={<Plus className="h-4 w-4" strokeWidth={2} />}>Add enquiry</Button>}
      />

      <div className="mb-4 w-full max-w-xs">
        <Input
          placeholder="Search by customer, subcategory or metal"
          value={query.searchInput}
          onChange={(e) => query.setSearchInput(e.target.value)}
          onKeyDown={query.handleSearchKeyDown}
        />
      </div>

      <Card className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
        {enquiries.length === 0 ? (
          <EmptyState
            title="No enquiries yet"
            description="Record a customer's interest to start tracking it."
            action={<Button onClick={openCreate} icon={<Plus className="h-4 w-4" strokeWidth={2} />}>Add enquiry</Button>}
          />
        ) : (
          <>
            <Table
              columns={columns}
              rows={enquiries}
              getRowKey={(e) => e.id}
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

      <EnquiryFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} enquiry={editingEnquiry} />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteEnquiry.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
        title="Delete enquiry"
        description={
          <>
            Are you sure you want to delete the enquiry from <strong>{deleteTarget?.customerName}</strong>? This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        isLoading={deleteEnquiry.isPending}
      />
    </div>
  );
}
