import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { PackageCheck, Pencil, XCircle } from 'lucide-react';
import { extractErrorMessage } from '@/lib/apiClient';
import { formatCurrency } from '@/lib/format';
import { Button, Card, CardBody, CardHeader, FullPageSpinner, PageHeader, Table, toast, type Column } from '@/components/ui';
import { useCancelPurchase, useOrderPurchase, usePurchase } from './hooks';
import { PurchaseStatusBadge } from './statusBadge';
import { ReceiveItemsModal } from './ReceiveItemsModal';
import type { PurchaseItem } from '@/types';

export function PurchaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: purchase, isLoading } = usePurchase(id);
  const orderPurchase = useOrderPurchase();
  const cancelPurchase = useCancelPurchase();
  const [actionError, setActionError] = useState<string | null>(null);
  const [receiveOpen, setReceiveOpen] = useState(false);

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
          <p className="text-xs text-graphite-400">{item.sku}</p>
        </div>
      ),
    },
    { key: 'qty', header: 'Ordered', align: 'right', render: (item) => item.quantity },
    {
      key: 'received',
      header: 'Received',
      align: 'right',
      render: (item) => (
        <span className={item.receivedQuantity >= item.quantity ? 'font-medium text-emerald-600' : 'font-medium text-graphite-700'}>
          {item.receivedQuantity}
        </span>
      ),
    },
    { key: 'unitCost', header: 'Unit cost', align: 'right', render: (item) => formatCurrency(item.unitCost) },
    { key: 'lineTotal', header: 'Line total', align: 'right', render: (item) => formatCurrency(item.lineTotal) },
  ];

  const runAction = async (action: () => Promise<unknown>, successMsg?: string) => {
    setActionError(null);
    try {
      await action();
      if (successMsg) toast.success(successMsg);
    } catch (err) {
      const msg = extractErrorMessage(err, 'Action failed.');
      setActionError(msg);
      toast.error(msg);
    }
  };

  const canReceive = purchase.status === 'ORDERED' || purchase.status === 'PARTIALLY_RECEIVED';
  const canCancel = purchase.status === 'DRAFT' || purchase.status === 'ORDERED' || purchase.status === 'PARTIALLY_RECEIVED';

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
              {purchase.status === 'DRAFT' && (
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/purchases/${purchase.id}/edit`)}
                  icon={<Pencil className="h-4 w-4" strokeWidth={2} />}
                >
                  Edit purchase
                </Button>
              )}
              {purchase.status === 'DRAFT' && (
                <Button
                  isLoading={orderPurchase.isPending}
                  onClick={() => runAction(() => orderPurchase.mutateAsync(purchase.id), 'Purchase marked as ordered')}
                >
                  Mark as ordered
                </Button>
              )}
              {canReceive && (
                <Button
                  onClick={() => setReceiveOpen(true)}
                  icon={<PackageCheck className="h-4 w-4" strokeWidth={2} />}
                >
                  Receive items
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="danger"
                  isLoading={cancelPurchase.isPending}
                  onClick={() => runAction(() => cancelPurchase.mutateAsync(purchase.id), 'Purchase cancelled')}
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

      {receiveOpen && (
        <ReceiveItemsModal
          isOpen={receiveOpen}
          onClose={() => setReceiveOpen(false)}
          purchase={purchase}
        />
      )}
    </div>
  );
}
