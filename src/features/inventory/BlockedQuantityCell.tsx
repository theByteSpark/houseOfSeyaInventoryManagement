import { useState } from 'react';
import { CheckCircle2, Lock, Pencil, Trash2 } from 'lucide-react';
import { ConfirmModal, IconButton } from '@/components/ui';
import { extractErrorMessage } from '@/lib/apiClient';
import { useWarehouseContext } from '@/features/warehouses/WarehouseContext';
import { useBlockedQuantities, useDeleteBlockedQuantity } from '@/features/blocked-quantity/hooks';
import { BlockQuantityFormModal } from '@/features/blocked-quantity/BlockQuantityFormModal';
import { EditBlockQuantityModal } from '@/features/blocked-quantity/EditBlockQuantityModal';
import { ConfirmBlockQuantityModal } from '@/features/blocked-quantity/ConfirmBlockQuantityModal';
import type { Product } from '@/types';

export function BlockedQuantityCell({ product }: { product: Product }) {
  const { selectedWarehouseId } = useWarehouseContext();
  const { data: openBlocks } = useBlockedQuantities({
    status: 'OPEN',
    productId: product.id,
    warehouseId: selectedWarehouseId ?? undefined,
  });
  const openBlock = openBlocks?.[0] ?? null;

  const deleteBlockedQuantity = useDeleteBlockedQuantity();
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <div className="flex items-center justify-end gap-1.5">
      <span className="text-graphite-700">{product.blockedQuantity}</span>
      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
        {openBlock ? (
          <>
            <IconButton label="Add to blocked quantity" tone="brand" onClick={() => setEditModalOpen(true)}>
              <Pencil className="h-4 w-4" strokeWidth={2} />
            </IconButton>
            <IconButton label="Confirm blocked quantity" tone="brand" onClick={() => setConfirmModalOpen(true)}>
              <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
            </IconButton>
            <IconButton
              label="Delete blocked quantity"
              tone="danger"
              onClick={() => {
                setDeleteError(null);
                setDeleteConfirmOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} />
            </IconButton>
          </>
        ) : (
          <IconButton label="Block quantity" tone="brand" onClick={() => setBlockModalOpen(true)}>
            <Lock className="h-4 w-4" strokeWidth={2} />
          </IconButton>
        )}
      </div>

      <BlockQuantityFormModal isOpen={blockModalOpen} onClose={() => setBlockModalOpen(false)} product={product} />
      <EditBlockQuantityModal isOpen={editModalOpen} blockedQuantity={openBlock} onClose={() => setEditModalOpen(false)} />
      <ConfirmBlockQuantityModal
        isOpen={confirmModalOpen}
        blockedQuantity={openBlock}
        onClose={() => setConfirmModalOpen(false)}
      />
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          if (!openBlock) return;
          deleteBlockedQuantity.mutate(openBlock.id, {
            onSuccess: () => setDeleteConfirmOpen(false),
            onError: (err) => setDeleteError(extractErrorMessage(err, 'Could not delete blocked quantity.')),
          });
        }}
        title="Delete blocked quantity"
        description={
          <>
            Are you sure you want to remove the block on <strong>{product.name}</strong>? This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        isLoading={deleteBlockedQuantity.isPending}
        error={deleteError}
      />
    </div>
  );
}
