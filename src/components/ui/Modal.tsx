import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

type ModalSize = 'md' | 'xl';

const sizeClasses: Record<ModalSize, string> = {
  md: 'max-w-lg',
  xl: 'max-w-4xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-graphite-900/50 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        className={cn('w-full rounded-t-lg bg-white shadow-xl sm:rounded-lg', sizeClasses[size])}
      >
        <div className="flex items-center justify-between border-b border-graphite-100 px-4 py-3 sm:px-5 sm:py-4">
          <h2 className="text-[15px] font-semibold text-graphite-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1 text-graphite-400 hover:bg-graphite-100 hover:text-graphite-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-graphite-100 px-4 py-3 sm:px-5 sm:py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
