import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { FileText, Pencil } from 'lucide-react';
import { extractErrorMessage } from '@/lib/apiClient';
import { formatCurrency } from '@/lib/format';
import { Button, Card, CardBody, CardHeader, FullPageSpinner, PageHeader } from '@/components/ui';
import { useCancelSale, useSale, useMarkSalePaid } from './hooks';
import { useAuth } from '@/features/auth/useAuth';
import { SaleStatusBadge } from './statusBadge';
import { InvoicePdfModal } from './InvoicePdfModal';

export function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: sale, isLoading } = useSale(id);
  const markPaid = useMarkSalePaid();
  const cancelSale = useCancelSale();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [actionError, setActionError] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  if (isLoading) return <FullPageSpinner />;
  if (!sale) {
    return (
      <div className="py-16 text-center text-sm text-graphite-400">
        Sale not found. <Link to="/sales" className="text-brand-600 hover:underline">Back to sales</Link>
      </div>
    );
  }

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
            <CardBody className="flex flex-col gap-4">
              {sale.items.map((item) => (
                <div key={item.id} className="rounded-lg border border-graphite-100 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-graphite-900">{item.productName}</p>
                      <p className="text-xs text-graphite-400">{item.designNumber}</p>
                    </div>
                    <span className="font-medium text-graphite-900">{formatCurrency(item.unitPrice)}</span>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-5">
                    <div className="flex justify-between gap-2 sm:block">
                      <dt className="text-graphite-500">Metal cost</dt>
                      <dd className="text-graphite-800">{formatCurrency(item.product.metalCost)}</dd>
                    </div>
                    <div className="flex justify-between gap-2 sm:block">
                      <dt className="text-graphite-500">Diamond cost</dt>
                      <dd className="text-graphite-800">{formatCurrency(item.product.diamondCost)}</dd>
                    </div>
                    <div className="flex justify-between gap-2 sm:block">
                      <dt className="text-graphite-500">Labour cost</dt>
                      <dd className="text-graphite-800">{formatCurrency(item.product.labourCost)}</dd>
                    </div>
                    <div className="flex justify-between gap-2 sm:block">
                      <dt className="text-graphite-500">Other cost</dt>
                      <dd className="text-graphite-800">{formatCurrency(item.product.fixedExpense)}</dd>
                    </div>
                    <div className="flex justify-between gap-2 sm:block">
                      <dt className="text-graphite-500">Selling price</dt>
                      <dd className="font-medium text-graphite-900">{formatCurrency(item.product.sellingPrice)}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </CardBody>
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
                  <dt className="text-graphite-500">Collected tax (3%, included)</dt>
                  <dd className="font-medium text-graphite-800">{formatCurrency(sale.tax)}</dd>
                </div>
                {sale.discountValue > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-graphite-500">
                      Discount{sale.discountPercent !== null ? ` (${sale.discountPercent}%)` : ''}
                    </dt>
                    <dd className="font-medium text-graphite-800">-{formatCurrency(sale.discountValue)}</dd>
                  </div>
                )}
                <div className="mt-1 flex justify-between border-t border-graphite-100 pt-2 text-base">
                  <dt className="font-semibold text-graphite-900">Total</dt>
                  <dd className="font-semibold text-graphite-900">{formatCurrency(sale.total)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-graphite-500">Received</dt>
                  <dd className="font-medium text-graphite-800">{formatCurrency(sale.receivedAmount)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-graphite-500">Balance due</dt>
                  <dd className="font-medium text-graphite-800">{formatCurrency(Math.max(sale.balanceDue, 0))}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-graphite-400">
                Created {new Date(sale.createdAt).toLocaleString()}
                {sale.soldAt && <> · Sold {new Date(sale.soldAt).toLocaleString()}</>}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Actions" />
            <CardBody className="flex flex-col gap-2">
              {(sale.status === 'SOLD' || sale.status === 'PAID') && (
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/sales/${sale.id}/edit`)}
                  icon={<Pencil className="h-4 w-4" strokeWidth={2} />}
                >
                  Edit sale
                </Button>
              )}
              {sale.status === 'SOLD' && (
                <Button
                  isLoading={markPaid.isPending}
                  onClick={() => runAction(() => markPaid.mutateAsync(sale.id))}
                >
                  Mark as paid
                </Button>
              )}
              {isAdmin && (sale.status === 'SOLD' || sale.status === 'PAID') && (
                <Button
                  variant="danger"
                  isLoading={cancelSale.isPending}
                  onClick={() => runAction(() => cancelSale.mutateAsync(sale.id))}
                >
                  Cancel sale
                </Button>
              )}
              {sale.status === 'CANCELLED' && (
                <p className="text-sm text-graphite-400">No further actions available.</p>
              )}
              {(sale.status === 'SOLD' || sale.status === 'PAID') && (
                <Button
                  variant="secondary"
                  onClick={() => setPdfOpen(true)}
                  icon={<FileText className="h-4 w-4" strokeWidth={2} />}
                >
                  View / download invoice
                </Button>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {pdfOpen && (
        <InvoicePdfModal saleId={sale.id} saleNumber={sale.saleNumber} onClose={() => setPdfOpen(false)} />
      )}
    </div>
  );
}
