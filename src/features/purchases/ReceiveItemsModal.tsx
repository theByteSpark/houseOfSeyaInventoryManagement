import { useState } from 'react';
import { Button, Input, Modal, toast } from '@/components/ui';
import { extractErrorMessage } from '@/lib/apiClient';
import { useReceivePurchaseItems } from './hooks';
import type { Purchase } from '@/types';

interface ReceiveLine {
  productId: string;
  productName: string;
  sku: string;
  orderedQty: number;
  receivedQty: number;
  receivingNow: number;
}

export function ReceiveItemsModal({
  isOpen,
  onClose,
  purchase,
}: {
  isOpen: boolean;
  onClose: () => void;
  purchase: Purchase;
}) {
  const receiveMutation = useReceivePurchaseItems();
  const [error, setError] = useState<string | null>(null);

  const [lines, setLines] = useState<ReceiveLine[]>(
    purchase.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      orderedQty: item.quantity,
      receivedQty: item.receivedQuantity,
      receivingNow: 0,
    })),
  );

  const remaining = (line: ReceiveLine) => line.orderedQty - line.receivedQty;

  const getLineError = (line: ReceiveLine): string | null => {
    if (line.receivingNow < 0) return 'Cannot be negative.';
    if (line.receivingNow > remaining(line)) return `Only ${remaining(line)} remaining.`;
    return null;
  };

  const hasValidInput = lines.some((l) => l.receivingNow > 0) && lines.every((l) => getLineError(l) === null);

  const handleSubmit = async () => {
    setError(null);
    if (!hasValidInput) {
      setError('Enter at least one quantity to receive.');
      return;
    }

    const items = lines
      .filter((l) => l.receivingNow > 0)
      .map((l) => ({ productId: l.productId, receivedQty: l.receivingNow }));

    try {
      await receiveMutation.mutateAsync({ id: purchase.id, input: { items } });
      toast.success('Items received successfully');
      onClose();
    } catch (err) {
      const msg = extractErrorMessage(err, 'Could not receive items.');
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Receive items — ${purchase.purchaseNumber}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={receiveMutation.isPending} disabled={!hasValidInput}>
            Receive items
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {lines.map((line, index) => {
          const rem = remaining(line);
          const isFullyReceived = rem === 0;
          return (
            <div
              key={line.productId}
              className={`grid grid-cols-1 items-end gap-3 rounded-lg border p-3 sm:grid-cols-12 ${
                isFullyReceived ? 'border-emerald-100 bg-emerald-50/50' : 'border-graphite-100'
              }`}
            >
              <div className="sm:col-span-5">
                <p className="font-medium text-graphite-900">{line.productName}</p>
                <p className="text-xs text-graphite-400">{line.sku}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-graphite-400">Ordered</p>
                <p className="text-sm font-medium text-graphite-700">{line.orderedQty}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-graphite-400">Received</p>
                <p className="text-sm font-medium text-graphite-700">{line.receivedQty}</p>
              </div>
              <div className="sm:col-span-3">
                {isFullyReceived ? (
                  <p className="text-sm font-medium text-emerald-600">Fully received</p>
                ) : (
                  <Input
                    label={`Receiving now (max ${rem})`}
                    type="number"
                    min="0"
                    max={rem}
                    value={line.receivingNow || ''}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((l, i) => (i === index ? { ...l, receivingNow: Number(e.target.value) } : l)),
                      )
                    }
                    error={getLineError(line) ?? undefined}
                  />
                )}
              </div>
            </div>
          );
        })}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
