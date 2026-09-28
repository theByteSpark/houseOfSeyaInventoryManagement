import { useState, type ComponentType } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  ShoppingCart,
  Users,
  ClipboardList,
  Truck,
  Package,
  Tags,
  Repeat,
  UserCog,
  Warehouse as WarehouseIcon,
  HelpCircle,
  ArrowLeftRight,
  ChevronDown,
} from 'lucide-react';
import { Badge, Card, PageHeader } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useAuth } from '@/features/auth/useAuth';
import { ROLE_LABELS } from '@/features/users/roleBadge';

interface GuideSection {
  id: string;
  title: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  // Mirrors AppShell.tsx's own isWarehouseAdmin / isCompanyLevel split, so a
  // section's visibility always matches whether its nav item is actually
  // visible to that role — same underlying rule, can't drift apart.
  warehouseAdminOnly?: boolean;
  companyOnly?: boolean;
  summary: string;
  points: string[];
}

const SECTIONS: GuideSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    summary: 'Your home screen — a snapshot of what needs attention right now.',
    points: [
      'Stat tiles across the top summarize stock, sales, and purchase activity.',
      '"Inward Transit" and "Outward Transit" — purchases and sales currently in transit, click a row to open it.',
      '"Last 3 Days Sales" — a quick recent-activity feed.',
      '"Enquiries" — open enquiries, with an inline "Add enquiry" to log a new one without leaving the dashboard.',
      'A searchable list of all products at the bottom for a fast lookup.',
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: BarChart3,
    summary: 'Sales, Purchases, and Inventory performance, filterable by date range and status.',
    points: [
      'Sales tab — totals, a status breakdown, top-selling products, and the filtered sales list.',
      'Purchases tab — totals, a status breakdown, top-ordered products, and the filtered purchases list.',
      'Inventory tab — stock value and low-stock breakdowns.',
    ],
  },
  {
    id: 'sales',
    title: 'Sales',
    icon: ShoppingCart,
    summary: 'Track a sale from creation through to done.',
    points: [
      '"Add sale" — pick a customer (or add one inline), a completion date, and one or more product lines with quantity and price per kg.',
      'A sale starts Outward Transit and moves to Done once fulfilled; it can be Cancelled before then.',
      '"Import" bulk-creates sales from a CSV file — one row creates one complete sale (one product line each), matching the same fields as the Add Sale form.',
    ],
  },
  {
    id: 'customers',
    title: 'Customers',
    icon: Users,
    summary: 'Everyone you sell to.',
    points: [
      'Add or edit a customer’s name, phone, email, and address.',
      '"Import" bulk adds or updates customers from a CSV file.',
    ],
  },
  {
    id: 'purchases',
    title: 'Purchases',
    icon: ClipboardList,
    summary: 'Order stock from a vendor and bring it into a warehouse.',
    points: [
      '"Add purchase" — pick a vendor (or add one inline), a completion date, and one or more product lines with quantity and price per kg.',
      'A purchase moves Ordered → Inward Transit → In Stock via "Mark in stock"; it can be Cancelled before it’s received.',
      '"Import" bulk-creates purchases from a CSV file — one row creates one complete purchase, and now lands directly in Inward Transit, matching what the Add Purchase form produces by default.',
    ],
  },
  {
    id: 'vendors',
    title: 'Vendors',
    icon: Truck,
    summary: 'Everyone you buy from.',
    points: [
      'Add or edit a vendor’s company name, contact person, phone, email, and address.',
      '"Import" bulk adds or updates vendors from a CSV file.',
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory',
    icon: Package,
    summary: 'The product catalog and its stock levels at the currently-selected warehouse.',
    points: [
      '"Add inventory item" — name, category, description, starting stock quantity, and reorder level. A SKU is generated automatically from the name.',
      'Stock quantity is only set once, at creation. To add more afterward, use "Restock" on that row — never edited directly.',
      'A "Low" badge flags anything at or below its reorder level; the stock filter toggle shows only those.',
      '"Blocked" quantity — reserve a portion of a product’s stock against something without removing it from stock yet. Lock a quantity, edit it, confirm it (which finalizes the reservation), or delete it, all from that row’s actions.',
      '"Import" bulk adds or updates products from a CSV file, matched by product name.',
    ],
  },
  {
    id: 'categories',
    title: 'Categories',
    icon: Tags,
    summary: 'A simple, single-level way to group products.',
    points: ['Add, edit, or delete categories from the Categories page.'],
  },
  {
    id: 'stock-journal',
    title: 'Stock Journal',
    icon: Repeat,
    summary: 'Convert stock from one product into a different, equivalent product within the same warehouse.',
    points: [
      '"New Transfer" — pick a "from" product and a "to" product plus a quantity; the source product’s stock decreases and the destination product’s stock increases at that warehouse.',
      'Every conversion is logged and shown in the history table.',
    ],
  },
  {
    id: 'users',
    title: 'Users',
    icon: UserCog,
    warehouseAdminOnly: true,
    summary: 'Manage who can sign in to Paragon Resin and what role they have.',
    points: [
      'Add, edit, or delete accounts.',
      'Warehouse Manager and Warehouse Admin roles must be assigned to a specific warehouse; Admin and Super Admin are not tied to one.',
    ],
  },
  {
    id: 'warehouses',
    title: 'Warehouses',
    icon: WarehouseIcon,
    companyOnly: true,
    summary: 'Manage the warehouse locations stock is tracked against.',
    points: ['Add, edit, or delete a warehouse’s name, code, and address.'],
  },
  {
    id: 'enquiries',
    title: 'Enquiries',
    icon: HelpCircle,
    companyOnly: true,
    summary: 'Record interest in a product before it becomes a real purchase or sale.',
    points: [
      '"Add enquiry" — pick a product and a quantity.',
      '"Confirm enquiry" turns it directly into either a Purchase (pick a vendor, quantity, and price) or a Sale (pick a customer, quantity, and price) at a chosen warehouse.',
      'Edit or delete any enquiry from the list.',
    ],
  },
  {
    id: 'warehouse-transfer',
    title: 'Warehouse Transfer',
    icon: ArrowLeftRight,
    companyOnly: true,
    summary: 'Move a product’s stock from one warehouse to another.',
    points: [
      '"New Transfer" — pick a product, a source warehouse, a destination warehouse, and a quantity.',
      'Every transfer is logged and shown in the history table.',
    ],
  },
];

export function HelpPage() {
  const { user } = useAuth();
  const isWarehouseAdmin = user?.role === 'ADMIN';
  const isCompanyLevel = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';

  const visibleSections = SECTIONS.filter((s) => {
    if (s.companyOnly) return isCompanyLevel;
    if (s.warehouseAdminOnly) return isWarehouseAdmin || isCompanyLevel;
    return true;
  });

  const roleLabel = user?.role ? ROLE_LABELS[user.role] : 'Warehouse Manager';
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div>
      <PageHeader title="Help & Guide" description="A quick tour of what each page does." />

      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-graphite-200 bg-white px-4 py-3">
        <span className="text-sm text-graphite-500">Logged in as</span>
        <Badge tone={isCompanyLevel ? 'info' : isWarehouseAdmin ? 'warning' : 'neutral'}>{roleLabel}</Badge>
        <span className="text-sm text-graphite-500">
          {isCompanyLevel
            ? 'You can see every section below.'
            : isWarehouseAdmin
              ? 'Company-only sections are hidden for your role.'
              : 'Users and company-only sections are hidden for your role.'}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {visibleSections.map((section) => {
          const Icon = section.icon;
          const isOpen = openId === section.id;
          return (
            <Card key={section.id} className="overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : section.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left sm:px-5"
                aria-expanded={isOpen}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-graphite-50">
                  <Icon className="h-[18px] w-[18px] text-graphite-500" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-graphite-900">{section.title}</span>
                    {section.companyOnly && <Badge tone="info">Admin only</Badge>}
                    {section.warehouseAdminOnly && !section.companyOnly && <Badge tone="warning">Warehouse Admin+</Badge>}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-graphite-500 sm:whitespace-normal">
                    {section.summary}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-graphite-400 transition-transform',
                    isOpen && 'rotate-180',
                  )}
                  strokeWidth={2}
                />
              </button>

              {isOpen && (
                <div className="border-t border-graphite-100 px-4 py-3 sm:px-5">
                  <ul className="flex flex-col gap-2 text-sm text-graphite-700">
                    {section.points.map((point, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-graphite-400" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
