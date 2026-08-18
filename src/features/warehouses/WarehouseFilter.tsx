import { useAuth } from '@/features/auth/useAuth';

export function useIsCompanyLevel() {
  const { user } = useAuth();
  return user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';
}
