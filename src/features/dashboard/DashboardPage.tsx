import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightCircle, ClipboardCheck, Pencil, Plus, Trash2, XCircle } from 'lucide-react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmModal,
  EmptyState,
  FullPageSpinner,
  IconButton,
  PageHeader,
} from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { useAuth } from '@/features/auth/useAuth';
import { useEnquiries, useDeleteEnquiry } from '@/features/enquiries/hooks';
import { EnquiryFormModal } from '@/features/enquiries/EnquiryFormModal';
import { useSales, useCancelSale } from '@/features/sales/hooks';
import { usePurchaseEnquiries, useDeletePurchaseEnquiry } from '@/features/purchase-enquiries/hooks';
import { PurchaseEnquiryFormModal } from '@/features/purchase-enquiries/PurchaseEnquiryFormModal';
import { usePurchases, useCancelPurchase, useReceivePurchase } from '@/features/purchases/hooks';
import type { Enquiry, PurchaseEnquiry } from '@/types';

const LIST_HEIGHT = 'h-[420px] overflow-y-auto';
const RECENT_LIMIT = 10;

function byRecent<T extends { createdAt: string }>(items: T[] | undefined): T[] {
  return [...(items ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, RECENT_LIMIT);
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const { data: enquiriesData, isLoading: enquiriesLoading } = useEnquiries();
  const deleteEnquiry = useDeleteEnquiry();
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);
  const [enquiryDeleteTarget, setEnquiryDeleteTarget] = useState<Enquiry | null>(null);

  const { data: salesData, isLoading: salesLoading } = useSales();
  const cancelSale = useCancelSale();

  const { data: purchaseEnquiriesData, isLoading: poLoading } = usePurchaseEnquiries();
  const deletePurchaseEnquiry = useDeletePurchaseEnquiry();
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [editingPo, setEditingPo] = useState<PurchaseEnquiry | null>(null);
  const [poDeleteTarget, setPoDeleteTarget] = useState<PurchaseEnquiry | null>(null);

  const { data: purchasesData, isLoading: purchasesLoading } = usePurchases();
  const cancelPurchase = useCancelPurchase();
  const receivePurchase = useReceivePurchase();

  if (enquiriesLoading || salesLoading || poLoading || purchasesLoading) return <FullPageSpinner />;

  const recentEnquiries = byRecent(enquiriesData);
  const recentSales = byRecent(salesData);
  const recentPurchaseEnquiries = byRecent(purchaseEnquiriesData);
  const recentPurchases = byRecent(purchasesData);

  const openCreateEnquiry = () => {
    setEditingEnquiry(null);
    setEnquiryModalOpen(true);
  };

  const openEditEnquiry = (enquiry: Enquiry) => {
    setEditingEnquiry(enquiry);
    setEnquiryModalOpen(true);
  };

  const openCreatePo = () => {
    setEditingPo(null);
    setPoModalOpen(true);
  };

  const openEditPo = (enquiry: PurchaseEnquiry) => {
    setEditingPo(enquiry);
    setPoModalOpen(true);
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

  const sectionAction = (viewAllPath: string, onAdd: () => void, addLabel: string) => (
    <div className="flex items-center gap-3">
      <button
        onClick={() => navigate(viewAllPath)}
        className="text-sm font-medium text-brand-600 hover:underline"
      >
        View all
      </button>
      <Button size="sm" onClick={onAdd} icon={<Plus className="h-4 w-4" strokeWidth={2} />}>
        {addLabel}
      </Button>
    </div>
  );

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your inventory, sales, and purchases." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Enquiries" action={sectionAction('/enquiries', openCreateEnquiry, 'Add enquiry')} />
          {recentEnquiries.length === 0 ? (
            <CardBody><EmptyState title="No enquiries yet" description="Record a customer's interest to start tracking it." /></CardBody>
          ) : (
            <div className={LIST_HEIGHT}>
              <div className="divide-y divide-graphite-100">
                {recentEnquiries.map((e) => (
                  <div key={e.id} className="grid grid-cols-[1.2fr_1fr_auto_auto] items-center gap-3 px-4 py-2 text-xs sm:px-5">
                    <span className="truncate font-medium text-graphite-900">{e.customerName}</span>
                    <span className="truncate text-graphite-600">{e.subcategoryName ?? '—'}</span>
                    <span className="text-right font-medium text-graphite-800">
                      {e.sellingAmount !== null ? formatCurrency(e.sellingAmount) : '—'}
                    </span>
                    <div className="flex justify-end gap-1">
                      <IconButton label="Edit enquiry" tone="brand" onClick={() => openEditEnquiry(e)}>
                        <Pencil className="h-4 w-4" strokeWidth={2} />
                      </IconButton>
                      {isAdmin && (
                        <IconButton label="Delete enquiry" tone="danger" onClick={() => setEnquiryDeleteTarget(e)}>
                          <Trash2 className="h-4 w-4" strokeWidth={2} />
                        </IconButton>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Purchase orders" action={sectionAction('/purchase-enquiries', openCreatePo, 'Add purchase order')} />
          {recentPurchaseEnquiries.length === 0 ? (
            <CardBody><EmptyState title="No purchase orders yet" description="Record interest in a design from a vendor to start tracking it." /></CardBody>
          ) : (
            <div className={LIST_HEIGHT}>
              <div className="divide-y divide-graphite-100">
                {recentPurchaseEnquiries.map((e) => (
                  <div key={e.id} className="grid grid-cols-[1.2fr_1fr_auto] items-center gap-3 px-4 py-2 text-xs sm:px-5">
                    <span className="truncate font-medium text-graphite-900">{e.vendorName}</span>
                    <span className="truncate text-graphite-600">{e.subcategoryName ?? '—'}</span>
                    <div className="flex justify-end gap-1">
                      <IconButton label="Convert to purchase" tone="brand" onClick={() => convertToPurchase(e)}>
                        <ArrowRightCircle className="h-4 w-4" strokeWidth={2} />
                      </IconButton>
                      <IconButton label="Edit purchase order" tone="brand" onClick={() => openEditPo(e)}>
                        <Pencil className="h-4 w-4" strokeWidth={2} />
                      </IconButton>
                      {isAdmin && (
                        <IconButton label="Delete purchase order" tone="danger" onClick={() => setPoDeleteTarget(e)}>
                          <Trash2 className="h-4 w-4" strokeWidth={2} />
                        </IconButton>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Sales" action={sectionAction('/sales', () => navigate('/sales/new'), 'Add sale')} />
          {recentSales.length === 0 ? (
            <CardBody><EmptyState title="No sales yet" description="Sales will appear here once created." /></CardBody>
          ) : (
            <div className={LIST_HEIGHT}>
              <div className="divide-y divide-graphite-100">
                {recentSales.map((s) => (
                  <div
                    key={s.id}
                    className="grid cursor-pointer grid-cols-[1.5fr_auto_auto] items-center gap-3 px-4 py-2 text-xs hover:bg-graphite-50 sm:px-5"
                    onClick={() => navigate(`/sales/${s.id}`)}
                  >
                    <span className="truncate font-medium text-graphite-900">{s.customerName}</span>
                    <span className="text-right font-medium text-graphite-800">{formatCurrency(s.total)}</span>
                    <div className="flex justify-end gap-1">
                      {(s.status === 'SOLD' || s.status === 'PAID') && (
                        <IconButton
                          label="Edit sale"
                          tone="brand"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            navigate(`/sales/${s.id}/edit`);
                          }}
                        >
                          <Pencil className="h-4 w-4" strokeWidth={2} />
                        </IconButton>
                      )}
                      {isAdmin && (s.status === 'SOLD' || s.status === 'PAID') && (
                        <IconButton
                          label="Cancel sale"
                          tone="danger"
                          disabled={cancelSale.isPending}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            cancelSale.mutate(s.id);
                          }}
                        >
                          <XCircle className="h-4 w-4" strokeWidth={2} />
                        </IconButton>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Purchases" action={sectionAction('/purchases', () => navigate('/purchases/new'), 'Add purchase')} />
          {recentPurchases.length === 0 ? (
            <CardBody><EmptyState title="No purchases yet" description="Purchases will appear here once created." /></CardBody>
          ) : (
            <div className={LIST_HEIGHT}>
              <div className="divide-y divide-graphite-100">
                {recentPurchases.map((p) => (
                  <div
                    key={p.id}
                    className="grid cursor-pointer grid-cols-[1.5fr_auto_auto] items-center gap-3 px-4 py-2 text-xs hover:bg-graphite-50 sm:px-5"
                    onClick={() => navigate(`/purchases/${p.id}`)}
                  >
                    <span className="truncate font-medium text-graphite-900">{p.vendorName}</span>
                    <span className="text-right font-medium text-graphite-800">{formatCurrency(p.total)}</span>
                    <div className="flex justify-end gap-1">
                      {p.status === 'ORDERED' && (
                        <IconButton
                          label="Edit purchase"
                          tone="brand"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            navigate(`/purchases/${p.id}/edit`);
                          }}
                        >
                          <Pencil className="h-4 w-4" strokeWidth={2} />
                        </IconButton>
                      )}
                      {p.status === 'ORDERED' && (
                        <IconButton
                          label="Mark as received"
                          tone="brand"
                          disabled={receivePurchase.isPending}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            receivePurchase.mutate(p.id);
                          }}
                        >
                          <ClipboardCheck className="h-4 w-4" strokeWidth={2} />
                        </IconButton>
                      )}
                      {isAdmin && p.status === 'ORDERED' && (
                        <IconButton
                          label="Cancel purchase"
                          tone="danger"
                          disabled={cancelPurchase.isPending}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            cancelPurchase.mutate(p.id);
                          }}
                        >
                          <XCircle className="h-4 w-4" strokeWidth={2} />
                        </IconButton>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <EnquiryFormModal isOpen={enquiryModalOpen} onClose={() => setEnquiryModalOpen(false)} enquiry={editingEnquiry} />
      <ConfirmModal
        isOpen={!!enquiryDeleteTarget}
        onClose={() => setEnquiryDeleteTarget(null)}
        onConfirm={() => {
          if (!enquiryDeleteTarget) return;
          deleteEnquiry.mutate(enquiryDeleteTarget.id, { onSuccess: () => setEnquiryDeleteTarget(null) });
        }}
        title="Delete enquiry"
        description={
          <>
            Are you sure you want to delete the enquiry from <strong>{enquiryDeleteTarget?.customerName}</strong>? This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        isLoading={deleteEnquiry.isPending}
      />

      <PurchaseEnquiryFormModal isOpen={poModalOpen} onClose={() => setPoModalOpen(false)} enquiry={editingPo} />
      <ConfirmModal
        isOpen={!!poDeleteTarget}
        onClose={() => setPoDeleteTarget(null)}
        onConfirm={() => {
          if (!poDeleteTarget) return;
          deletePurchaseEnquiry.mutate(poDeleteTarget.id, { onSuccess: () => setPoDeleteTarget(null) });
        }}
        title="Delete purchase order"
        description={
          <>
            Are you sure you want to delete the purchase order for <strong>{poDeleteTarget?.vendorName}</strong>? This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        isLoading={deletePurchaseEnquiry.isPending}
      />
    </div>
  );
}
