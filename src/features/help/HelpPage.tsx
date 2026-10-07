import { useState, type ComponentType } from 'react';
import {
  LayoutDashboard,
  MessageCircleQuestion,
  Package,
  Tags,
  ShoppingCart,
  Users,
  ClipboardList,
  Truck,
  BarChart3,
  UserCog,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { Badge, Card, PageHeader } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useAuth } from '@/features/auth/useAuth';

interface GuideSection {
  id: string;
  title: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  adminOnly?: boolean;
  summary: string;
  points: string[];
}

const SECTIONS: GuideSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    summary: 'A quick snapshot of the business when you log in.',
    points: [
      'Four sections: Enquiries and Sales on the left, Purchase Order and Purchases on the right.',
      'Each section shows up to the last 10 records with an Add button and a View all link — click any Sale or Purchase row to open it.',
    ],
  },
  {
    id: 'enquiries',
    title: 'Enquiries',
    icon: MessageCircleQuestion,
    summary: 'Note down what a customer is asking about, before it becomes a real product or sale.',
    points: [
      'Add an enquiry against an existing or new customer.',
      'Optionally describe the metal, subcategory, and a single diamond (shape/quality/pcs/carat weight).',
      'Edit or delete any enquiry from the list.',
      'Nothing here is priced or automatic — someone builds the real product later if it goes ahead.',
    ],
  },
  {
    id: 'products',
    title: 'Inventory',
    icon: Package,
    summary: 'Your full catalog — every design\'s cost sheet and status.',
    points: [
      'Add a product with its metal, diamond, and charge details — cost and price update live as you type.',
      'Every product has a status: Ordered (added to a purchase that hasn\'t been received yet), Active (in stock, sellable), or Sold. Status updates automatically as purchases are received and sales are recorded.',
      'Filter the list by subcategory or status.',
      'Import products in bulk from a spreadsheet using the template.',
    ],
  },
  {
    id: 'categories',
    title: 'Categories & Subcategories',
    icon: Tags,
    summary: 'The two-level grouping a product can optionally belong to.',
    points: [
      'Add, rename, or remove categories and subcategories.',
      'A category or subcategory can\'t be removed while something still uses it.',
    ],
  },
  {
    id: 'sales',
    title: 'Sales',
    icon: ShoppingCart,
    summary: 'A sale is recorded straight to Sold, and stays editable from there.',
    points: [
      'Add a sale for a customer with one or more products — it\'s recorded as Sold immediately, and stock is deducted right away.',
      'Status follows the money received: Sold (nothing yet), Partially paid (some received, balance due) and Paid (settled in full). Edit a sale any time to record a payment, or use Mark as paid to settle the balance.',
      'Admins can cancel a Sold or Paid sale if the deal falls through — the item returns to stock.',
      'Download the invoice as a PDF any time after it\'s sold.',
    ],
  },
  {
    id: 'customers',
    title: 'Customers',
    icon: Users,
    summary: 'Everyone you\'ve sold to or received an enquiry from.',
    points: ['Add or edit contact details.', 'See each customer\'s sales history at a glance.'],
  },
  {
    id: 'purchases',
    title: 'Purchases',
    icon: ClipboardList,
    summary: 'Order new designs from a vendor — this is how a new design enters your catalog.',
    points: [
      'Add a purchase and define the new product\'s cost sheet right there — it\'s placed straight on Received and stock updates immediately, since the item has already arrived by the time it\'s entered.',
      'Edit a Received purchase any time to fix a mistaken entry — removing a line deletes that product from Inventory (blocked if it\'s already been sold), adding one receives it right away too.',
      'Admins can cancel a Received purchase. Cancelling deletes every product it created from Inventory entirely — blocked if any of them has already been sold.',
    ],
  },
  {
    id: 'vendors',
    title: 'Vendors',
    icon: Truck,
    summary: 'Everyone you buy from.',
    points: ['Add or edit vendor details.', 'See each vendor\'s order history at a glance.'],
  },
  {
    id: 'purchase-enquiries',
    title: 'Purchase Order',
    icon: MessageCircleQuestion,
    summary: 'Note down what you\'re asking a vendor about, before you commit to an actual purchase.',
    points: [
      'Add a purchase order against an existing or new vendor.',
      'Optionally describe the metal, subcategory, and a single diamond (shape/quality/pcs/carat weight).',
      'Edit or delete any purchase order from the list.',
      '"Convert to purchase" jumps straight to Add Purchase with the vendor and cost-sheet detail already filled in — you only fill in what wasn\'t captured here (design number, name, rates, making charge, other cost, selling price).',
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: BarChart3,
    summary: 'Sales, purchases, and inventory performance, filtered by date and status.',
    points: [
      'Sales & Purchases tabs — totals, status breakdown, top products.',
      'Inventory tab — stock value, low-stock items, and recent movements.',
    ],
  },
  {
    id: 'users',
    title: 'Users',
    icon: UserCog,
    adminOnly: true,
    summary: 'Manage staff accounts and access.',
    points: ['Add, edit, or remove accounts.', 'Only Admins can reach this page.'],
  },
  {
    id: 'attribute-options',
    title: 'Attribute Options',
    icon: Settings,
    adminOnly: true,
    summary: 'The dropdown lists used for metal type and diamond details.',
    points: [
      'Add, rename, or remove options.',
      'Renaming an option updates its name on every existing product, enquiry, and purchase order that already uses it.',
      'Removing one only affects new entries, not past records.',
    ],
  },
];

export function HelpPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const visibleSections = SECTIONS.filter((s) => !s.adminOnly || isAdmin);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div>
      <PageHeader title="Help & Guide" description="A quick tour of what each page does." />

      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-graphite-200 bg-white px-4 py-3">
        <span className="text-sm text-graphite-500">Logged in as</span>
        <Badge tone={isAdmin ? 'info' : 'neutral'}>{user?.role ?? 'STAFF'}</Badge>
        <span className="text-sm text-graphite-500">
          {isAdmin ? 'You can see every section below.' : 'Admin-only sections are hidden for your role.'}
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
                    {section.adminOnly && <Badge tone="info">Admin only</Badge>}
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
