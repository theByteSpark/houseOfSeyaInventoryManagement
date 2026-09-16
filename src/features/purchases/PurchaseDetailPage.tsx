import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { PackageCheck, Pencil, Truck, XCircle } from 'lucide-react';
import { extractErrorMessage } from '@/lib/apiClient';
import { formatCurrency } from '@/lib/format';
import { Button, Card, CardBody, CardHeader, ConfirmModal, FullPageSpinner, PageHeader, Table, type Column } from '@/components/ui';
import { useCancelPurchase, useMarkPurchaseInStock, useMarkPurchaseInwardTransit, usePurchase } from './hooks';
import { PurchaseStatusBadge } from './statusBadge';
import type { PurchaseItem } from '@/types';

export function PurchaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: purchase, isLoading } = usePurchase(id);
  const cancelPurchase = useCancelPurchase();
  const markInwardTransit = useMarkPurchaseInwardTransit();
  const markInStock = useMarkPurchaseInStock();
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'inwardTransit' | 'inStock' | 'cancel' | null>(null);

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
    { key: 'qty', header: 'Ordered (kgs)', align: 'right', render: (item) => item.quantity },
    { key: 'unitCost', header: 'Price (per kg)', align: 'right', render: (item) => formatCurrency(item.unitCost) },
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

  const canCancel = purchase.status === 'ORDERED' || purchase.status === 'INWARD_TRANSIT';

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
                  onClick={() => setConfirmAction('inwardTransit')}
                  icon={<Truck className="h-4 w-4" strokeWidth={2} />}
                >
                  Mark Inward Transit
                </Button>
              )}
              {purchase.status === 'INWARD_TRANSIT' && (
                <Button
                  onClick={() => setConfirmAction('inStock')}
                  icon={<PackageCheck className="h-4 w-4" strokeWidth={2} />}
                >
                  Mark In Stock
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="danger"
                  onClick={() => setConfirmAction('cancel')}
                  icon={<XCircle className="h-4 w-4" strokeWidth={2} />}
                >
                  Cancel purchase
                </Button>
              )}
              {purchase.status === 'IN_STOCK' && (
                <p className="text-sm text-graphite-400">All items are in stock. No further actions available.</p>
              )}
              {purchase.status === 'CANCELLED' && (
                <p className="text-sm text-graphite-400">This purchase has been cancelled.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmAction === 'inwardTransit'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          setConfirmAction(null);
          runAction(() => markInwardTransit.mutateAsync(purchase.id));
        }}
        title="Mark inward transit"
        description={
          <>
            Mark <strong>{purchase.purchaseNumber}</strong> as inward transit?
          </>
        }
        confirmLabel="Mark Inward Transit"
        tone="primary"
        isLoading={markInwardTransit.isPending}
      />

      <ConfirmModal
        isOpen={confirmAction === 'inStock'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          setConfirmAction(null);
          runAction(() => markInStock.mutateAsync(purchase.id));
        }}
        title="Mark in stock"
        description={
          <>
            Mark <strong>{purchase.purchaseNumber}</strong> as in stock? This will add the ordered quantities to
            inventory.
          </>
        }
        confirmLabel="Mark In Stock"
        tone="primary"
        isLoading={markInStock.isPending}
      />

      <ConfirmModal
        isOpen={confirmAction === 'cancel'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          setConfirmAction(null);
          runAction(() => cancelPurchase.mutateAsync(purchase.id));
        }}
        title="Cancel purchase"
        description={
          <>
            Are you sure you want to cancel <strong>{purchase.purchaseNumber}</strong>? This cannot be undone.
          </>
        }
        confirmLabel="Cancel purchase"
        isLoading={cancelPurchase.isPending}
      />
    </div>
  );
}
