import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightCircle, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { useDeletePurchaseEnquiry, usePurchaseEnquiriesPage } from './hooks';
import { PurchaseEnquiryFormModal } from './PurchaseEnquiryFormModal';
import type { PurchaseEnquiry } from '@/types';

export function PurchaseEnquiriesListPage() {
  const navigate = useNavigate();
  const query = useTableQuery({ defaultSortBy: 'createdAt' });
  const { data, isLoading, isPlaceholderData } = usePurchaseEnquiriesPage({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
  });
  const deletePurchaseEnquiry = useDeletePurchaseEnquiry();
  const [formOpen, setFormOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState<PurchaseEnquiry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseEnquiry | null>(null);

  const enquiries = data?.data ?? [];

  const openCreate = () => {
    setEditingEnquiry(null);
    setFormOpen(true);
  };

  const openEdit = (enquiry: PurchaseEnquiry) => {
    setEditingEnquiry(enquiry);
    setFormOpen(true);
  };

  const convertToPurchase = (enquiry: PurchaseEnquiry) => {
    navigate('/purchases/new', {
      state: {
        vendorId: enquiry.vendorId,
        prefill: {
          subcategoryId: enquiry.subcategoryId ?? undefined,
          metalType: enquiry.metalType,
          grossWeight: enquiry.grossWeight,
          diamondShape: enquiry.diamondShape ?? undefined,
          diamondQuality: enquiry.diamondQuality ?? undefined,
          diamondPieces: enquiry.diamondPieces ?? undefined,
          diamondCaratWeight: enquiry.diamondCaratWeight ?? undefined,
        },
      },
    });
  };

  const columns: Column<PurchaseEnquiry>[] = [
    {
      key: 'vendor',
      header: 'Vendor',
      sortField: 'vendor',
      render: (e) => <span className="font-medium text-graphite-900">{e.vendorName}</span>,
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
      key: 'diamond',
      header: 'Diamond',
      render: (e) =>
        e.diamondShape || e.diamondQuality ? (
          `${e.diamondPieces ?? '—'}× ${e.diamondShape ?? '—'}/${e.diamondQuality ?? '—'}`
        ) : (
          <span className="text-graphite-300">—</span>
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
            label="Convert to purchase"
            tone="brand"
            onClick={(ev) => {
              ev.stopPropagation();
              convertToPurchase(e);
            }}
          >
            <ArrowRightCircle className="h-4 w-4" strokeWidth={2} />
          </IconButton>
          <IconButton
            label="Edit purchase order"
            tone="brand"
            onClick={(ev) => {
              ev.stopPropagation();
              openEdit(e);
            }}
          >
            <Pencil className="h-4 w-4" strokeWidth={2} />
          </IconButton>
          <IconButton
            label="Delete purchase order"
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
        title="Purchase Order"
        description="Record what you're asking a vendor about before you commit to an actual purchase."
        action={<Button onClick={openCreate} icon={<Plus className="h-4 w-4" strokeWidth={2} />}>Add purchase order</Button>}
      />

      <div className="mb-4 w-full max-w-xs">
        <Input
          placeholder="Search by vendor, subcategory or metal"
          value={query.searchInput}
          onChange={(e) => query.setSearchInput(e.target.value)}
          onKeyDown={query.handleSearchKeyDown}
        />
      </div>

      <Card className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
        {enquiries.length === 0 ? (
          <EmptyState
            title="No purchase orders yet"
            description="Record interest in a design from a vendor to start tracking it."
            action={<Button onClick={openCreate} icon={<Plus className="h-4 w-4" strokeWidth={2} />}>Add purchase order</Button>}
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

      <PurchaseEnquiryFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} enquiry={editingEnquiry} />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deletePurchaseEnquiry.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
        title="Delete purchase order"
        description={
          <>
            Are you sure you want to delete the purchase order for <strong>{deleteTarget?.vendorName}</strong>? This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        isLoading={deletePurchaseEnquiry.isPending}
      />
    </div>
  );
}
