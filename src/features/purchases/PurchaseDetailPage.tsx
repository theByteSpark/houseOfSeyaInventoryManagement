import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { PackageCheck, Pencil, XCircle } from 'lucide-react';
import { extractErrorMessage } from '@/lib/apiClient';
import { formatCurrency } from '@/lib/format';
import { Badge, Button, Card, CardBody, CardHeader, FullPageSpinner, PageHeader, Table, type Column } from '@/components/ui';
import { useCancelPurchase, useReceivePurchase, usePurchase } from './hooks';
import { PurchaseStatusBadge } from './statusBadge';
import { useAuth } from '@/features/auth/useAuth';
import type { PurchaseItem } from '@/types';

export function PurchaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: purchase, isLoading } = usePurchase(id);
  const receivePurchase = useReceivePurchase();
  const cancelPurchase = useCancelPurchase();
  const [actionError, setActionError] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  if (isLoading) return <FullPageSpinner />;
  if (!purchase) {
    return (
      <div className="py-16 text-center text-sm text-graphite-400">
        Purchase not found. <Link to="/purchases" className="text-brand-600 hover:underline">Back to purchases</Link>
      </div>
    );
  }

  const columns: Column<PurchaseItem>[] = [
    {
      key: 'product',
      header: 'Product',
      render: (item) => (
        <div>
          <p className="font-medium text-graphite-900">{item.productName}</p>
          <p className="text-xs text-graphite-400">{item.designNumber}</p>
        </div>
      ),
    },
    { key: 'cost', header: 'Cost', align: 'right', render: (item) => formatCurrency(item.unitCost) },
    {
      key: 'received',
      header: 'Received',
      align: 'right',
      render: (item) => (
        <Badge tone={item.receivedQuantity >= item.quantity ? 'success' : 'neutral'}>
          {item.receivedQuantity >= item.quantity ? 'Received' : 'Pending'}
        </Badge>
      ),
    },
  ];

  const runAction = async (action: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await action();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Action failed.'));
    }
  };

  const canCancel = isAdmin && purchase.status === 'ORDERED';

  return (
    <div>
      <PageHeader
        title={purchase.purchaseNumber}
        description={`Ordered from ${purchase.vendorName}`}
        action={
          <div className="flex items-center gap-3">
            <PurchaseStatusBadge status={purchase.status} />
            <Button variant="secondary" size="sm" onClick={() => navigate('/purchases')}>
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
            <Table columns={columns} rows={purchase.items} getRowKey={(item) => item.id} />
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Summary" />
            <CardBody>
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-graphite-500">Vendor invoice #</dt>
                  <dd className="font-medium text-graphite-800">{purchase.vendorInvoiceNumber ?? '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-graphite-500">Vendor invoice date</dt>
                  <dd className="font-medium text-graphite-800">
                    {purchase.vendorInvoiceDate ? new Date(purchase.vendorInvoiceDate).toLocaleDateString() : '—'}
                  </dd>
                </div>
                <div className="mt-1 flex justify-between border-t border-graphite-100 pt-2 text-base">
                  <dt className="font-semibold text-graphite-900">Total cost</dt>
                  <dd className="font-semibold text-graphite-900">{formatCurrency(purchase.total)}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-graphite-400">
                Created {new Date(purchase.createdAt).toLocaleString()}
                {purchase.orderedAt && <> · Ordered {new Date(purchase.orderedAt).toLocaleString()}</>}
                {purchase.receivedAt && <> · Received {new Date(purchase.receivedAt).toLocaleString()}</>}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Actions" />
            <CardBody className="flex flex-col gap-2">
              {purchase.status === 'ORDERED' && (
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/purchases/${purchase.id}/edit`)}
                  icon={<Pencil className="h-4 w-4" strokeWidth={2} />}
                >
                  Edit purchase
                </Button>
              )}
              {purchase.status === 'ORDERED' && (
                <Button
                  isLoading={receivePurchase.isPending}
                  onClick={() => runAction(() => receivePurchase.mutateAsync(purchase.id))}
                  icon={<PackageCheck className="h-4 w-4" strokeWidth={2} />}
                >
                  Mark as received
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="danger"
                  isLoading={cancelPurchase.isPending}
                  onClick={() => runAction(() => cancelPurchase.mutateAsync(purchase.id))}
                  icon={<XCircle className="h-4 w-4" strokeWidth={2} />}
                >
                  Cancel purchase
                </Button>
              )}
              {purchase.status === 'RECEIVED' && (
                <p className="text-sm text-graphite-400">All items received. No further actions available.</p>
              )}
              {purchase.status === 'CANCELLED' && (
                <p className="text-sm text-graphite-400">This purchase has been cancelled.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
