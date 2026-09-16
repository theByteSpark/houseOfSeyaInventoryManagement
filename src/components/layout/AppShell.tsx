import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Tags,
  ShoppingCart,
  Truck,
  ClipboardList,
  BarChart3,
  UserCog,
  Warehouse as WarehouseIcon,
  LogOut,
  ChevronDown,
  MoreHorizontal,
  HelpCircle,
  ArrowLeftRight,
  Repeat,
  Check,
} from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { cn } from '@/lib/cn';
import { ConfirmModal } from '@/components/ui';
import { NotificationBell } from './NotificationBell';
import { useIsCompanyLevel } from '@/features/warehouses/WarehouseFilter';
import { useWarehouses } from '@/features/warehouses/hooks';
import { useWarehouseContext } from '@/features/warehouses/WarehouseContext';
import paragonLogo from '@/assets/paragon-logo.jpg';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

interface NavGroup {
  key: string;
  label: string | null;
  items: NavItem[];
}

const baseNavGroups: NavGroup[] = [
  {
    key: 'insights',
    label: 'Insights',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    key: 'sales',
    label: 'Sales Management',
    items: [
      { to: '/sales', label: 'Sales', icon: ShoppingCart },
      { to: '/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    key: 'purchases',
    label: 'Purchase Management',
    items: [
      { to: '/purchases', label: 'Purchases', icon: ClipboardList },
      { to: '/vendors', label: 'Vendors', icon: Truck },
    ],
  },
  {
    key: 'products',
    label: 'Inventory',
    items: [
      { to: '/inventory/products', label: 'Inventory', icon: Package },
      { to: '/inventory/categories', label: 'Categories', icon: Tags },
      { to: '/stock-conversions', label: 'Stock Journal', icon: Repeat },
    ],
  },
];

const adminNavGroup: NavGroup = {
  key: 'admin',
  label: 'Admin',
  items: [{ to: '/users', label: 'Users', icon: UserCog }],
};

const companyNavGroup: NavGroup = {
  key: 'company',
  label: 'Company',
  items: [
    { to: '/warehouses', label: 'Warehouses', icon: WarehouseIcon },
    { to: '/enquiries', label: 'Enquiries', icon: HelpCircle },
    { to: '/stock-transfers', label: 'Warehouse Transfer', icon: ArrowLeftRight },
  ],
};

const mobilePrimaryPaths = ['/sales', '/purchases', '/', '/inventory/products'];

const COLLAPSE_STORAGE_KEY = 'hos-nav-collapsed-groups';

function loadCollapsedGroups(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(COLLAPSE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function DesktopWarehouseBadge() {
  const isCompanyLevel = useIsCompanyLevel();
  const { data: warehouses } = useWarehouses();
  const { selectedWarehouseId, setSelectedWarehouseId } = useWarehouseContext();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!selectedWarehouseId && warehouses && warehouses.length > 0) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [selectedWarehouseId, warehouses, setSelectedWarehouseId]);

  if (!isCompanyLevel) return null;

  const selectedWarehouse = warehouses?.find((w) => w.id === selectedWarehouseId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Select warehouse"
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-graphite-50"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <WarehouseIcon className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="text-[13px] font-medium text-graphite-800">
          {selectedWarehouse?.name ?? 'Select warehouse'}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-graphite-200 bg-white p-1.5 shadow-lg">
            {warehouses?.map((w) => {
              const isSelected = w.id === selectedWarehouseId;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    setSelectedWarehouseId(w.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[13px] font-medium',
                    isSelected ? 'bg-brand-50 text-brand-700' : 'text-graphite-600 hover:bg-graphite-50',
                  )}
                >
                  {w.name}
                  {isSelected && <Check className="h-4 w-4 shrink-0" strokeWidth={2} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function MobileWarehouseBadge() {
  const isCompanyLevel = useIsCompanyLevel();
  const { data: warehouses } = useWarehouses();
  const { selectedWarehouseId, setSelectedWarehouseId } = useWarehouseContext();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!selectedWarehouseId && warehouses && warehouses.length > 0) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [selectedWarehouseId, warehouses, setSelectedWarehouseId]);

  if (!isCompanyLevel) return null;

  const selectedWarehouse = warehouses?.find((w) => w.id === selectedWarehouseId);
  const initials = selectedWarehouse?.name.slice(0, 2).toUpperCase();

  return (
    <>
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-label="Select warehouse"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700"
      >
        {initials ?? <WarehouseIcon className="h-4 w-4" strokeWidth={2} />}
      </button>

      {sheetOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end bg-black/30 lg:hidden"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="mb-16 w-full rounded-t-xl bg-white p-3 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-graphite-200" />
            <p className="mb-2 px-2 text-[13px] font-semibold text-graphite-900">Select warehouse</p>
            <div className="flex flex-col gap-0.5">
              {warehouses?.map((w) => {
                const isSelected = w.id === selectedWarehouseId;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setSelectedWarehouseId(w.id);
                      setSheetOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-[13px] font-medium',
                      isSelected ? 'bg-brand-50 text-brand-700' : 'text-graphite-600 hover:bg-graphite-50',
                    )}
                  >
                    {w.name}
                    {isSelected && <Check className="h-4 w-4 shrink-0" strokeWidth={2} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const isWarehouseAdmin = user?.role === 'ADMIN';
  const isCompanyLevel = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';
  const navGroups = [
    ...baseNavGroups,
    ...(isWarehouseAdmin || isCompanyLevel ? [adminNavGroup] : []),
    ...(isCompanyLevel ? [companyNavGroup] : []),
  ];
  const allItems = navGroups.flatMap((g) => g.items);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(loadCollapsedGroups);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      setLogoutConfirmOpen(false);
    }
  };

  function toggleGroup(key: string) {
    setCollapsed((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  const mobilePrimaryItems = mobilePrimaryPaths
    .map((path) => allItems.find((item) => item.to === path))
    .filter((item): item is (typeof allItems)[number] => item !== undefined);
  const mobileMoreItems = allItems.filter((item) => !mobilePrimaryPaths.includes(item.to));

  return (
    <div className="flex min-h-screen flex-col bg-graphite-50 lg:h-screen lg:flex-row lg:overflow-hidden">
      {/* Desktop sidebar (lg+) */}
      <aside className="hidden w-60 shrink-0 flex-col bg-brand-600 lg:flex lg:h-screen">
        <div className="flex items-center px-5 py-6">
          <img src={paragonLogo} alt="Paragon Resin" className="h-10 w-auto max-w-[150px] rounded object-contain" />
        </div>

        <nav className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-2">
          {navGroups.map((group) => {
            const isCollapsed = collapsed[group.key];
            return (
              <div key={group.key}>
                {group.label && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/50 hover:text-white/80"
                  >
                    {group.label}
                    <ChevronDown
                      className={cn('h-3.5 w-3.5 transition-transform', isCollapsed && '-rotate-90')}
                      strokeWidth={2.5}
                    />
                  </button>
                )}
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors',
                              isActive
                                ? 'bg-white/15 text-white'
                                : 'text-white/70 hover:bg-white/5 hover:text-white',
                            )
                          }
                        >
                          <Icon className="h-[17px] w-[17px] shrink-0" fill="currentColor" strokeWidth={1.5} />
                          {item.label}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-3 py-3">
          <div className="mb-1 flex items-center gap-2.5 rounded-md px-3 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold text-white">
              {user?.name?.charAt(0) ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-white">{user?.name}</p>
              <p className="truncate text-[11px] uppercase tracking-wide text-white/70">
                {user?.role}
                {user?.warehouse && ` · ${user.warehouse.name}`}
              </p>
            </div>
            <NotificationBell variant="dark" />
          </div>
          <button
            onClick={() => setLogoutConfirmOpen(true)}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] font-medium text-white hover:bg-white/5 hover:text-white/80"
          >
            <LogOut className="h-[17px] w-[17px]" strokeWidth={2} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar (< lg) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-graphite-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2.5">
          <img src={paragonLogo} alt="Paragon Resin" className="h-10 w-10 shrink-0 rounded-md object-cover" />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold leading-tight text-graphite-900">Paragon Resin</p>
            <p className="truncate text-[11px] leading-tight text-graphite-400">{user?.name} · {user?.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <MobileWarehouseBadge />
          <NotificationBell />
          <button
            onClick={() => setLogoutConfirmOpen(true)}
            aria-label="Sign out"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-graphite-500 hover:bg-graphite-100 hover:text-graphite-800"
          >
            <LogOut className="h-[17px] w-[17px]" strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col lg:h-screen">
        {/* Desktop top bar (lg+): consistent top-right location for the warehouse selector */}
        <div className="hidden shrink-0 items-center justify-between border-b border-graphite-200 bg-white px-4 py-2 lg:flex lg:px-8">
          <div className="flex items-center gap-3">
            <img src={paragonLogo} alt="Paragon Resin" className="h-14 w-14 rounded-md object-cover" />
            <p className="text-base font-semibold leading-tight text-graphite-900">Paragon Resin</p>
          </div>
          <DesktopWarehouseBadge />
        </div>
        <div className="min-h-0 flex-1 lg:overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-20 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile "more" sheet (< lg) */}
      {mobileMoreOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end bg-black/30 lg:hidden"
          onClick={() => setMobileMoreOpen(false)}
        >
          <div
            className="mb-16 w-full rounded-t-xl bg-white p-3 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-graphite-200" />
            <div className="grid grid-cols-3 gap-1">
              {mobileMoreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileMoreOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex flex-col items-center justify-center gap-1 rounded-md px-2 py-3 text-[11px] font-medium',
                        isActive ? 'text-brand-700' : 'text-graphite-600',
                      )
                    }
                  >
                    <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
                    <span className="max-w-full truncate text-center">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom tab bar (< lg) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-graphite-200 bg-white lg:hidden">
        {mobilePrimaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex min-w-0 flex-1 flex-col items-center justify-center gap-0 px-0.5 py-1.5 text-[10px] font-medium transition-colors',
                  isActive ? 'text-brand-700' : 'text-graphite-500 hover:text-graphite-800',
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
              <span className="max-w-full truncate">{item.label}</span>
            </NavLink>
          );
        })}
        <button
          onClick={() => setMobileMoreOpen(true)}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0 px-0.5 py-1.5 text-[10px] font-medium text-graphite-500 hover:text-graphite-800"
        >
          <MoreHorizontal className="h-5 w-5 shrink-0" strokeWidth={2} />
          <span className="max-w-full truncate">More</span>
        </button>
      </nav>

      <ConfirmModal
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Sign out"
        description="Are you sure you want to sign out?"
        confirmLabel="Sign out"
        tone="danger"
        isLoading={isLoggingOut}
      />
    </div>
  );
}
