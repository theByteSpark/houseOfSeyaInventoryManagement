import { createContext, useContext, type ReactNode } from 'react';
import { Toaster, toast } from 'sonner';
import type { NotificationType } from '@/types';

export interface ToastInput {
  type: NotificationType;
  title: string;
  message: string;
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const notificationToastType: Record<NotificationType, 'success' | 'warning' | 'info' | 'error'> = {
  LOW_STOCK: 'warning',
  PURCHASE_RECEIVED: 'success',
  SALE_ISSUED: 'info',
  SYSTEM: 'info',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const showToast = (t: ToastInput) => {
    const kind = notificationToastType[t.type] ?? 'info';
    toast[kind](t.title, { description: t.message });
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          duration: 6000,
          style: {
            fontSize: '13px',
          },
        }}
      />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export { toast };
