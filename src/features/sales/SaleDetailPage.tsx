import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { extractErrorMessage } from '@/lib/apiClient';
import { formatCurrency } from '@/lib/format';
import { Button, Card, CardBody, CardHeader, ConfirmModal, FullPageSpinner, PageHeader, Table, type Column } from '@/components/ui';
import { useCancelSale, useSale } from './hooks';
import { SaleStatusBadge } from './statusBadge';
import type { SaleItem } from '@/types';

export function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: sale, isLoading } = useSale(id);
  const cancelSale = useCancelSale();
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (isLoading) return <FullPageSpinner />;
  if (!sale) {
    return (
      <div className="py-16 text-center text-sm text-graphite-400">
        Sale not found. <Link to="/sales" className="text-brand-600 hover:underline">Back to sales</Link>
      </div>
    );
  }

  const columns: Column<SaleItem>[] = [
    {
      key: 'product',
      header: 'Product',
      render: (item) => (
        <div>
          <p className="font-medium text-graphite-900">{item.productName}</p>
          <p className="text-xs text-graphite-400">{item.sku}</p>
        </div>
      ),
    },
    { key: 'qty', header: 'Qty (kgs)', align: 'right', render: (item) => item.quantity },
    { key: 'unitPrice', header: 'Unit price', align: 'right', render: (item) => formatCurrency(item.unitPrice) },
    { key: 'lineTotal', header: 'Line total', align: 'right', render: (item) => formatCurrency(item.lineTotal) },
  ];

  const runAction = async (action: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await action();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Action failed.'));
    }
  };

  return (
    <div>
      <PageHeader
        title={sale.saleNumber}
        description={`Billed to ${sale.customerName}`}
        action={
          <div className="flex items-center gap-3">
            <SaleStatusBadge status={sale.status} />
            <Button variant="secondary" size="sm" onClick={() => navigate('/sales')}>
              Back
            </Button>
          </div>
        }
      />
      {actionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Line items" />
            <Table columns={columns} rows={sale.items} getRowKey={(item) => item.id} />
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Summary" />
            <CardBody>
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-graphite-500">Subtotal</dt>
                  <dd className="font-medium text-graphite-800">{formatCurrency(sale.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-graphite-500">Tax</dt>
                  <dd className="font-medium text-graphite-800">{formatCurrency(sale.tax)}</dd>
                </div>
                <div className="mt-1 flex justify-between border-t border-graphite-100 pt-2 text-base">
                  <dt className="font-semibold text-graphite-900">Total</dt>
                  <dd className="font-semibold text-graphite-900">{formatCurrency(sale.total)}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-graphite-400">
                Created {new Date(sale.createdAt).toLocaleString()}
                {sale.issuedAt && <> · Issued {new Date(sale.issuedAt).toLocaleString()}</>}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Actions" />
            <CardBody className="flex flex-col gap-2">
              {sale.status === 'OUTWARD_TRANSIT' && (
                <Button variant="danger" onClick={() => setConfirmCancel(true)}>
                  Cancel sale
                </Button>
              )}
              {sale.status === 'CANCELLED' && (
                <p className="text-sm text-graphite-400">No further actions available.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false);
          runAction(() => cancelSale.mutateAsync(sale.id));
        }}
        title="Cancel sale"
        description={
          <>
            Are you sure you want to cancel <strong>{sale.saleNumber}</strong>? This cannot be undone.
          </>
        }
        confirmLabel="Cancel sale"
        isLoading={cancelSale.isPending}
      />
    </div>
  );
}
