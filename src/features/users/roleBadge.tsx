import { Badge } from '@/components/ui';
import type { Role } from '@/types';

export const ROLE_LABELS: Record<Role, string> = {
  USER: 'Warehouse Manager',
  ADMIN: 'Warehouse Admin',
  COMPANY_ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
};

const toneByRole: Record<Role, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  USER: 'neutral',
  ADMIN: 'warning',
  COMPANY_ADMIN: 'info',
  SUPER_ADMIN: 'info',
};

export function RoleBadge({ role }: { role: Role }) {
  return <Badge tone={toneByRole[role]}>{ROLE_LABELS[role]}</Badge>;
}
