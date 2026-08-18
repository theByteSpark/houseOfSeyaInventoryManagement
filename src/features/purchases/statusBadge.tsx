import { Badge } from '@/components/ui';
import type { PurchaseStatus } from '@/types';

const toneByStatus: Record<PurchaseStatus, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  ORDERED: 'neutral',
  INWARD_TRANSIT: 'info',
  IN_STOCK: 'success',
  CANCELLED: 'danger',
};

const labelByStatus: Record<PurchaseStatus, string> = {
  ORDERED: 'Ordered',
  INWARD_TRANSIT: 'Inward Transit',
  IN_STOCK: 'In Stock',
  CANCELLED: 'Cancelled',
};

export function PurchaseStatusBadge({ status }: { status: PurchaseStatus }) {
  return <Badge tone={toneByStatus[status]}>{labelByStatus[status]}</Badge>;
}
