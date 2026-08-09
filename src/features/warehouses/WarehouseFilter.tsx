import { Select } from '@/components/ui';
import { useAuth } from '@/features/auth/useAuth';
import { useWarehouses } from './hooks';

export function useIsCompanyLevel() {
  const { user } = useAuth();
  return user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';
}

export function WarehouseFilter({
  warehouseId,
  setWarehouseId,
  className,
}: {
  warehouseId: string;
  setWarehouseId: (v: string) => void;
  className?: string;
}) {
  const isCompanyLevel = useIsCompanyLevel();
  const { data: warehouses } = useWarehouses();

  if (!isCompanyLevel) return null;

  return (
    <Select
      // label="Warehouse"
      value={warehouseId}
      onChange={(e) => setWarehouseId(e.target.value)}
      className={className ?? 'w-full sm:w-auto sm:max-w-[180px]'}
    >
      <option value="">All warehouses</option>
      {warehouses?.map((w) => (
        <option key={w.id} value={w.id}>
          {w.name}
        </option>
      ))}
    </Select>
  );
}
