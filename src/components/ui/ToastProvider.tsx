import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PackageX, ShoppingCart, ClipboardCheck, Info, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { NotificationType } from '@/types';

export interface ToastInput {
  type: NotificationType;
  title: string;
  message: string;
}

interface Toast extends ToastInput {
  id: number;
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const typeIcon: Record<NotificationType, typeof Info> = {
  LOW_STOCK: PackageX,
  PURCHASE_RECEIVED: ClipboardCheck,
  SALE_ISSUED: ShoppingCart,
  SYSTEM: Info,
};

const typeTone: Record<NotificationType, string> = {
  LOW_STOCK: 'text-amber-600 bg-amber-50',
  PURCHASE_RECEIVED: 'text-emerald-600 bg-emerald-50',
  SALE_ISSUED: 'text-brand-600 bg-brand-50',
  SYSTEM: 'text-graphite-500 bg-graphite-100',
};

const TOAST_DURATION_MS = 6000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: ToastInput) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
    },
    [dismissToast],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div className="fixed right-4 top-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
          {toasts.map((toast) => {
            const Icon = typeIcon[toast.type];
            return (
              <div
                key={toast.id}
                role="status"
                className="animate-toast-in flex items-start gap-2.5 rounded-md border border-graphite-200 bg-white p-3 shadow-lg"
              >
                <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md', typeTone[toast.type])}>
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-graphite-900">{toast.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-[12px] text-graphite-500">{toast.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  aria-label="Dismiss"
                  className="shrink-0 cursor-pointer rounded p-0.5 text-graphite-400 hover:bg-graphite-100 hover:text-graphite-600"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
