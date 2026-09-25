import type { ComponentType } from 'react';
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
} from 'lucide-react';
import { Badge, Card, CardBody, CardHeader, PageHeader } from '@/components/ui';
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
    summary: 'Your home screen — a quick snapshot of the business, plus a shortcut to record a new enquiry without leaving it.',
    points: [
      'Stat tiles: total products, low-stock count, total customers, total vendors, sales this month, revenue this month, purchases this month, and pending purchase orders.',
      '"Recent sales" and "Recent purchases" — click a row to jump straight to that record.',
      '"Low stock alerts" — every product at or below its reorder level, with a link to see the full product list.',
      '"Add enquiry" button (top right) opens the same enquiry form used on the Enquiries page.',
    ],
  },
  {
    id: 'enquiries',
    title: 'Enquiries',
    icon: MessageCircleQuestion,
    summary: 'Record what a customer is asking about before there’s a costed product or a sale for it. Purely descriptive — no pricing here.',
    points: [
      '"Add enquiry" — pick an existing customer or create a new one on the spot, then optionally note a subcategory, metal type, gross weight, and a list of diamonds (shape, quality, pieces, carat weight) if the customer mentioned stones. You can add more than one diamond line per enquiry.',
      'Edit or delete any enquiry from the list.',
      'Search by customer, subcategory, or metal; sort and page through the list.',
      'An enquiry never turns into a product or sale automatically — if it goes ahead, someone builds the actual costed product for it separately.',
    ],
  },
  {
    id: 'products',
    title: 'Products',
    icon: Package,
    summary: 'The full jewelry catalog — every design’s cost sheet lives here, along with its stock level.',
    points: [
      '"Add product" opens the full cost sheet: Design Number, Name, Subcategory, a Metal section (type/weight/rate), a single Diamond section if this design has one (shape/quality/pieces/carat weight/reference weight/rate), Making Charge, and Fixed Expense.',
      'As you fill it in, Metal Cost, Diamond Cost, Labour Charge, Total Cost, a flat 3% Tax, and a Final Amount update live — these are guidance figures. You still set the actual Selling Price yourself.',
      'Stock quantity is only set once, at creation. To add more stock afterward, use the "Restock" action on that product’s row (with an optional reason) — never edit the quantity directly.',
      'The stock filter toggle shows only low-stock items; a "Low" badge flags anything at or below its reorder level.',
      'Deleting a product is blocked if it’s ever been sold. If its only history is purchases or stock movements, it can still be deleted.',
      '"Import" lets you bulk add or update products from a CSV/Excel file — download the template first to see the expected columns.',
    ],
  },
  {
    id: 'categories',
    title: 'Categories & Subcategories',
    icon: Tags,
    summary: 'The two-level classification a product can optionally belong to.',
    points: [
      'Categories: add, edit, or delete — a category can’t be deleted while it still has subcategories.',
      'Subcategories: add, edit, or delete, filterable by category — a subcategory can’t be deleted while it still has products or enquiries pointing to it.',
    ],
  },
  {
    id: 'sales',
    title: 'Sales',
    icon: ShoppingCart,
    summary: 'Track a sale from a draft through to being paid, and produce the invoice.',
    points: [
      '"Add sale" — pick a customer (or add one inline) and add one or more product lines with a quantity each.',
      'A sale starts as a Draft (fully editable) and can be Issued — this is the moment stock is actually deducted — then Marked as Paid. It can be Cancelled any time before it’s paid.',
      'The detail page shows every line item, the subtotal, a flat 3% tax, the total, and a downloadable PDF invoice once the sale has been issued.',
      '"Import" bulk-creates draft sales from a file — one row creates one sale with one product line.',
    ],
  },
  {
    id: 'customers',
    title: 'Customers',
    icon: Users,
    summary: 'Everyone you’ve sold to, or who’s made an enquiry.',
    points: [
      'Add or edit a customer’s name, email, phone, and address.',
      'The list shows how many sales each customer has made.',
      '"Import" bulk adds or updates customers from a file.',
    ],
  },
  {
    id: 'purchases',
    title: 'Purchases',
    icon: ClipboardList,
    summary: 'Order new designs from a vendor — this is also how a brand-new design enters the catalog.',
    points: [
      '"Add purchase" — pick a vendor (or add one inline), optionally note the vendor’s own invoice number and date, then use "Add product."',
      '"Add product" always opens the full product cost sheet to define a brand-new design right there — there’s no picker over existing products on this screen, since a purchase is how a new design gets created in the first place.',
      'A purchase moves from Draft to Ordered, then items are received via "Receive items" — partial deliveries are supported across multiple receiving actions. It automatically becomes Received once every line is fully in. Cancel is available any time before that.',
      '"Import" bulk-creates draft purchases from a file — one row creates one purchase with one product line.',
    ],
  },
  {
    id: 'vendors',
    title: 'Vendors',
    icon: Truck,
    summary: 'Everyone you buy from.',
    points: [
      'Add or edit a vendor’s company name, contact person, email, phone, and address.',
      'The list shows each vendor’s total orders and their most recent order.',
      '"Import" bulk adds or updates vendors from a file.',
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: BarChart3,
    summary: 'Sales, Purchases, and Inventory performance, filterable by date range and status.',
    points: [
      'Sales tab — total sales, revenue, and tax collected; a status breakdown; top-selling products; the filtered sales list.',
      'Purchases tab — total purchases and cost; a status breakdown; top-ordered products; the filtered purchases list.',
      'Inventory tab — total stock value, low-stock products, a category-wise stock value breakdown, and recent stock movements.',
    ],
  },
  {
    id: 'users',
    title: 'Users',
    icon: UserCog,
    adminOnly: true,
    summary: 'Manage who can log in to House of Seya and what role they have.',
    points: [
      'Add, edit, or delete staff and admin accounts.',
      'Role determines access — Staff can use every screen above; only Admins can see this page and Attribute Options below.',
    ],
  },
  {
    id: 'attribute-options',
    title: 'Attribute Options',
    icon: Settings,
    adminOnly: true,
    summary: 'Manage the Metal Type, Diamond Shape, and Diamond Quality dropdown lists used across Products, Purchases, and Enquiries.',
    points: [
      'Add or remove an option from any of the three lists.',
      'Removing an option only affects the picker for new entries — anything already saved keeps showing exactly what was picked at the time.',
    ],
  },
];

export function HelpPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const visibleSections = SECTIONS.filter((s) => !s.adminOnly || isAdmin);

  return (
    <div>
      <PageHeader
        title="Help & Guide"
        description="What each part of House of Seya does, and what you can do there."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-graphite-200 bg-white p-4">
        <span className="text-sm text-graphite-500">You&rsquo;re logged in as</span>
        <Badge tone={isAdmin ? 'info' : 'neutral'}>{user?.role ?? 'STAFF'}</Badge>
        <span className="text-sm text-graphite-500">
          {isAdmin
            ? '— every section below is visible to you, including the two admin-only ones at the end.'
            : '— the sections below match what you have access to. Two admin-only sections (Users, Attribute Options) are hidden.'}
        </span>
      </div>

      <Card className="mb-6">
        <CardBody className="flex flex-wrap gap-2">
          {visibleSections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-md border border-graphite-200 bg-graphite-50 px-3 py-1.5 text-[13px] font-medium text-graphite-700 hover:bg-graphite-100"
            >
              {section.title}
            </a>
          ))}
        </CardBody>
      </Card>

      <div className="flex flex-col gap-6">
        {visibleSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.id} id={section.id} className="scroll-mt-6">
              <CardHeader
                title={
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-[18px] w-[18px] text-graphite-500" strokeWidth={2} />
                    {section.title}
                    {section.adminOnly && <Badge tone="info">Admin only</Badge>}
                  </span>
                }
                description={section.summary}
              />
              <CardBody>
                <ul className="flex flex-col gap-2 text-sm text-graphite-700">
                  {section.points.map((point, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-graphite-400" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
