import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FullPageSpinner,
  PageHeader,
  Select,
  Table,
  type Column,
} from '@/components/ui';
import { useEnquiries } from './hooks';
import { EnquiryFormModal } from './EnquiryFormModal';
import { ConfirmEnquiryModal } from './ConfirmEnquiryModal';
import type { Enquiry, EnquiryStatus } from '@/types';

export function EnquiriesPage() {
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | 'ALL'>('ALL');
  const { data: enquiries, isLoading } = useEnquiries({ status: statusFilter });

  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Enquiry | null>(null);

  const columns: Column<Enquiry>[] = [
    { key: 'productName', header: 'Product Name', render: (r) => <span className="font-medium text-graphite-900">{r.productName}</span> },
    { key: 'quantity', header: 'Quantity (kgs)', align: 'right', render: (r) => r.quantity },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge tone={r.status === 'OPEN' ? 'info' : 'success'}>{r.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) =>
        r.status === 'OPEN' ? (
          <Button size="sm" variant="secondary" onClick={() => setConfirmTarget(r)}>
            Confirm
          </Button>
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

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Select
          className="w-full sm:w-auto sm:max-w-[160px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as EnquiryStatus | 'ALL')}
        >
          <option value="ALL">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="FULFILLED">Fulfilled</option>
        </Select>
      </div>

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
      <ConfirmEnquiryModal isOpen={!!confirmTarget} enquiry={confirmTarget} onClose={() => setConfirmTarget(null)} />
    </div>
  );
}
