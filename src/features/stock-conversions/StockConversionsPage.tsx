import { useState } from 'react';
import { Button, Card, EmptyState, FullPageSpinner, PageHeader, Table, type Column } from '@/components/ui';
import { useConversions } from './hooks';
import { StockConversionFormModal } from './StockConversionFormModal';
import type { StockConversion } from '@/types';

export function StockConversionsPage() {
  const { data: conversions, isLoading } = useConversions();
  const [modalOpen, setModalOpen] = useState(false);

  const columns: Column<StockConversion>[] = [
    {
      key: 'route',
      header: 'From → To',
      render: (r) => `${r.fromProductName} → ${r.toProductName}`,
    },
    { key: 'warehouseName', header: 'Warehouse', render: (r) => r.warehouseName },
    { key: 'quantity', header: 'Quantity (kgs)', align: 'right', render: (r) => r.quantity },
    { key: 'date', header: 'Date', render: (r) => new Date(r.createdAt).toLocaleDateString() },
  ];

  if (isLoading) return <FullPageSpinner />;

  return (
    <div>
      <PageHeader
        title="Stock Journal"
        description="Transfer stock from one product to another within the same warehouse."
        action={<Button onClick={() => setModalOpen(true)}>New Transfer</Button>}
      />

      <Card>
        {(conversions ?? []).length === 0 ? (
          <EmptyState
            title="No transfers found"
            description="Transfer stock between equivalent products to see history here."
            action={<Button onClick={() => setModalOpen(true)}>New Transfer</Button>}
          />
        ) : (
          <Table columns={columns} rows={conversions ?? []} getRowKey={(r) => r.id} />
        )}
      </Card>

      <StockConversionFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
