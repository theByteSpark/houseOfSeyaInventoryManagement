import { Badge } from '@/components/ui';
import type { PurchaseStatus } from '@/types';

const toneByStatus: Record<PurchaseStatus, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  ORDERED: 'info',
  RECEIVED: 'success',
  CANCELLED: 'danger',
};

const labelByStatus: Record<PurchaseStatus, string> = {
  ORDERED: 'Ordered',
  RECEIVED: 'Received',
  CANCELLED: 'Cancelled',
};

export function PurchaseStatusBadge({ status }: { status: PurchaseStatus }) {
  return <Badge tone={toneByStatus[status]}>{labelByStatus[status]}</Badge>;
}
