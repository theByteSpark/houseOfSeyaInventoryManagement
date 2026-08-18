import { Badge } from '@/components/ui';
import type { SaleStatus } from '@/types';

const toneByStatus: Record<SaleStatus, 'neutral' | 'info' | 'success' | 'danger'> = {
  OUTWARD_TRANSIT: 'info',
  CANCELLED: 'danger',
};

const labelByStatus: Record<SaleStatus, string> = {
  OUTWARD_TRANSIT: 'Outward Transit',
  CANCELLED: 'Cancelled',
};

export function SaleStatusBadge({ status }: { status: SaleStatus }) {
  return <Badge tone={toneByStatus[status]}>{labelByStatus[status]}</Badge>;
}
