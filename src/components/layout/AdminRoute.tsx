import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import type { ReactNode } from 'react';
import type { Role } from '@/types';

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}