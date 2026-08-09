import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, CheckCheck, PackageX, ShoppingCart, ClipboardCheck, Info } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '@/features/notifications/hooks';
import type { AppNotification, NotificationType } from '@/types';

const typeIcon: Record<NotificationType, typeof Bell> = {
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

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function NotificationRow({ notification, onRead }: { notification: AppNotification; onRead: (id: string) => void }) {
  const Icon = typeIcon[notification.type];
  return (
    <button
      type="button"
      onClick={() => !notification.isRead && onRead(notification.id)}
      className={cn(
        'flex w-full cursor-pointer items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-graphite-50',
        !notification.isRead && 'bg-brand-50/40',
      )}
    >
      <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md', typeTone[notification.type])}>
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[13px] font-medium text-graphite-900">{notification.title}</p>
          {!notification.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />}
        </div>
        <p className="mt-0.5 line-clamp-2 text-[12px] text-graphite-500">{notification.message}</p>
        <p className="mt-1 text-[11px] text-graphite-400">
          {notification.warehouseName ?? 'Company-wide'} · {timeAgo(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}

const PANEL_WIDTH = 384; // sm:w-96
const PANEL_MARGIN = 16;
const PANEL_MAX_HEIGHT = 420; // header + list, roughly

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const panelWidth = Math.min(PANEL_WIDTH, window.innerWidth - PANEL_MARGIN * 2);
      // Anchor horizontally to the button, but keep the panel fully on-screen.
      let left = rect.right - panelWidth;
      left = Math.min(Math.max(left, PANEL_MARGIN), window.innerWidth - panelWidth - PANEL_MARGIN);

      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // Prefer opening below; flip above if there isn't enough room below but there is above.
      if (spaceBelow < PANEL_MAX_HEIGHT && spaceAbove > spaceBelow) {
        setPanelPos({ bottom: window.innerHeight - rect.top + 8, left });
      } else {
        setPanelPos({ top: rect.bottom + 8, left });
      }
    };
    updatePosition();

    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-graphite-500 hover:bg-graphite-100 hover:text-graphite-800"
      >
        <Bell className="h-[17px] w-[17px]" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open &&
        panelPos &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              top: panelPos.top,
              bottom: panelPos.bottom,
              left: panelPos.left,
              width: `min(${PANEL_WIDTH}px, calc(100vw - ${PANEL_MARGIN * 2}px))`,
            }}
            className="fixed z-50 rounded-md border border-graphite-200 bg-white shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-graphite-100 px-3 py-2.5">
              <p className="text-[13px] font-semibold text-graphite-900">Notifications</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="flex cursor-pointer items-center gap-1 text-[12px] font-medium text-brand-600 hover:underline disabled:opacity-50"
                >
                  <CheckCheck className="h-3.5 w-3.5" strokeWidth={2} />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <p className="px-3 py-6 text-center text-sm text-graphite-400">Loading…</p>
              ) : notifications.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-graphite-400">No notifications yet.</p>
              ) : (
                <div className="divide-y divide-graphite-100">
                  {notifications.map((n) => (
                    <NotificationRow key={n.id} notification={n} onRead={(id) => markRead.mutate(id)} />
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
