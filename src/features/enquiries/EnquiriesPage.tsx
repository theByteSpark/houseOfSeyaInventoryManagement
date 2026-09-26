import { useState } from 'react';
import { Pencil, CheckCircle2, Trash2 } from 'lucide-react';
import {
  Button,
  Card,
  ConfirmModal,
  EmptyState,
  FullPageSpinner,
  IconButton,
  PageHeader,
  Table,
  type Column,
} from '@/components/ui';
import { extractErrorMessage } from '@/lib/apiClient';
import { useDeleteEnquiry, useEnquiries } from './hooks';
import { EnquiryFormModal } from './EnquiryFormModal';
import { EditEnquiryModal } from './EditEnquiryModal';
import { ConfirmEnquiryModal } from './ConfirmEnquiryModal';
import type { Enquiry } from '@/types';

export function EnquiriesPage() {
  const { data: enquiries, isLoading } = useEnquiries({ status: 'ALL' });
  const deleteEnquiry = useDeleteEnquiry();

  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Enquiry | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Enquiry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Enquiry | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const columns: Column<Enquiry>[] = [
    { key: 'productName', header: 'Product Name', render: (r) => <span className="font-medium text-graphite-900">{r.productName}</span> },
    { key: 'quantity', header: 'Quantity (kgs)', align: 'right', render: (r) => r.quantity },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) =>
        r.status === 'OPEN' ? (
          <div className="flex justify-end gap-1">
            <IconButton label="Edit enquiry" tone="brand" onClick={() => setEditTarget(r)}>
              <Pencil className="h-4 w-4" strokeWidth={2} />
            </IconButton>
            <IconButton label="Confirm enquiry" tone="brand" onClick={() => setConfirmTarget(r)}>
              <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
            </IconButton>
            <IconButton
              label="Delete enquiry"
              tone="danger"
              onClick={() => {
                setDeleteError(null);
                setDeleteTarget(r);
              }}
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} />
            </IconButton>
          </div>
        ) : null,
    },
  ];

  if (isLoading) return <FullPageSpinner />;

  return (
    <div>
      <PageHeader
        title="Enquiries"
        description="Track product requests and their fulfillment history."
        action={
          <Button onClick={() => setEnquiryModalOpen(true)}>Add Enquiry</Button>
        }
      />

      <Card>
        {(enquiries ?? []).length === 0 ? (
          <EmptyState
            title="No enquiries found"
            description="Add an enquiry to track a product request."
            action={<Button onClick={() => setEnquiryModalOpen(true)}>Add Enquiry</Button>}
          />
        ) : (
          <Table columns={columns} rows={enquiries ?? []} getRowKey={(r) => r.id} />
        )}
      </Card>

      <EnquiryFormModal isOpen={enquiryModalOpen} onClose={() => setEnquiryModalOpen(false)} />
      <EditEnquiryModal isOpen={!!editTarget} enquiry={editTarget} onClose={() => setEditTarget(null)} />
      <ConfirmEnquiryModal isOpen={!!confirmTarget} enquiry={confirmTarget} onClose={() => setConfirmTarget(null)} />
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteEnquiry.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
            onError: (err) => setDeleteError(extractErrorMessage(err, 'Could not delete enquiry.')),
          });
        }}
        title="Delete enquiry"
        description={
          <>
            Are you sure you want to delete the enquiry for <strong>{deleteTarget?.productName}</strong>? This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        isLoading={deleteEnquiry.isPending}
        error={deleteError}
      />
    </div>
  );
}
