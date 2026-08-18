import { useState } from 'react';
import { Button, Card, EmptyState, FullPageSpinner, PageHeader, Table, type Column } from '@/components/ui';
import { useTransfers } from './hooks';
import { StockTransferFormModal } from './StockTransferFormModal';
import type { StockTransfer } from '@/types';

export function StockTransfersPage() {
  const { data: transfers, isLoading } = useTransfers();
  const [modalOpen, setModalOpen] = useState(false);

  const columns: Column<StockTransfer>[] = [
    { key: 'productName', header: 'Product Name', render: (r) => <span className="font-medium text-graphite-900">{r.productName}</span> },
    {
      key: 'route',
      header: 'From → To',
      render: (r) => `${r.fromWarehouseName} → ${r.toWarehouseName}`,
    },
    { key: 'quantity', header: 'Quantity (kgs)', align: 'right', render: (r) => r.quantity },
    { key: 'date', header: 'Date', render: (r) => new Date(r.createdAt).toLocaleDateString() },
  ];

  if (isLoading) return <FullPageSpinner />;

  return (
    <div>
      <PageHeader
        title="Warehouse Transfer"
        description="Move inventory between warehouses."
        action={<Button onClick={() => setModalOpen(true)}>New Transfer</Button>}
      />

      <Card>
        {(transfers ?? []).length === 0 ? (
          <EmptyState
            title="No transfers found"
            description="Move stock between warehouses to see transfers here."
            action={<Button onClick={() => setModalOpen(true)}>New Transfer</Button>}
          />
        ) : (
          <Table columns={columns} rows={transfers ?? []} getRowKey={(r) => r.id} />
        )}
      </Card>

      <StockTransferFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
