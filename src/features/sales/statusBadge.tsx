import { Badge } from '@/components/ui';
import type { SaleStatus } from '@/types';

const toneByStatus: Record<SaleStatus, 'neutral' | 'info' | 'success' | 'danger'> = {
  SOLD: 'info',
  PAID: 'success',
  CANCELLED: 'danger',
};

export function SaleStatusBadge({ status }: { status: SaleStatus }) {
  return <Badge tone={toneByStatus[status]}>{status}</Badge>;
}
