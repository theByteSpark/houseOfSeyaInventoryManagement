import { Badge } from '@/components/ui';
import type { SaleStatus } from '@/types';

const toneByStatus: Record<SaleStatus, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  SOLD: 'info',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  CANCELLED: 'danger',
};

const labelByStatus: Record<SaleStatus, string> = {
  SOLD: 'SOLD',
  PARTIALLY_PAID: 'PARTIALLY PAID',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
};

export function SaleStatusBadge({ status }: { status: SaleStatus }) {
  return <Badge tone={toneByStatus[status]}>{labelByStatus[status]}</Badge>;
}
