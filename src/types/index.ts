export type Role = 'USER' | 'ADMIN' | 'COMPANY_ADMIN' | 'SUPER_ADMIN';

export type SortDir = 'asc' | 'desc';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  // From the UserWarehouse mapping; null for COMPANY_ADMIN/SUPER_ADMIN.
  warehouseId?: string | null;
  warehouseName?: string | null;
  warehouse?: { id: string; name: string } | null;
  createdAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  totalSales: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  productCount: number;
}

export interface ProductStockByWarehouse {
  warehouseId: string;
  warehouseName: string;
  quantity: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  // Quantity at the viewer's own warehouse when scoped; total across all warehouses for company-level roles.
  quantityInStock: number;
  reorderLevel: number;
  categoryId: string | null;
  categoryName: string | null;
  stockByWarehouse: ProductStockByWarehouse[];
  createdAt: string;
}

export type StockMovementType = 'RESTOCK' | 'SALE' | 'ADJUSTMENT';

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  reason: string | null;
  createdAt: string;
}

export type SaleStatus = 'OUTWARD_TRANSIT' | 'CANCELLED';

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Sale {
  id: string;
  saleNumber: string;
  customerId: string;
  customerName: string;
  warehouseId: string;
  warehouseName: string;
  status: SaleStatus;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  issuedAt: string | null;
  createdAt: string;
}

export interface RecentSaleByProduct {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  date: string;
}

export interface Vendor {
  id: string;
  companyName: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  totalOrders: number;
  lastOrderedDate: string | null;
  lastOrderedProduct: string | null;
  lastOrderedQty: number | null;
  createdAt: string;
}

export type PurchaseStatus = 'ORDERED' | 'INWARD_TRANSIT' | 'IN_STOCK' | 'CANCELLED';

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  vendorId: string;
  vendorName: string;
  warehouseId: string;
  warehouseName: string;
  status: PurchaseStatus;
  items: PurchaseItem[];
  subtotal: number;
  total: number;
  orderedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
}

export type EnquiryStatus = 'OPEN' | 'FULFILLED';

export interface Enquiry {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  status: EnquiryStatus;
  createdAt: string;
}

export interface StockTransfer {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  createdAt: string;
}

export interface StockConversion {
  id: string;
  fromProductId: string;
  fromProductName: string;
  fromSku: string;
  toProductId: string;
  toProductName: string;
  toSku: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  createdAt: string;
}

export interface SalesReport {
  totalCount: number;
  totalRevenue: number;
  totalTax: number;
  statusBreakdown: { status: SaleStatus; count: number }[];
  topProducts: { product: string; sku: string; quantity: number; revenue: number }[];
  sales: { id: string; saleNumber: string; customerName: string; status: SaleStatus; total: number; createdAt: string }[];
}

export interface PurchasesReport {
  totalCount: number;
  totalCost: number;
  statusBreakdown: { status: PurchaseStatus; count: number }[];
  topProducts: { product: string; sku: string; quantity: number; cost: number }[];
  purchases: { id: string; purchaseNumber: string; vendorName: string; status: PurchaseStatus; total: number; createdAt: string }[];
}

export interface InventoryReport {
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  lowStockProducts: { id: string; name: string; sku: string; quantityInStock: number; reorderLevel: number }[];
  categoryBreakdown: { category: string; productCount: number; stockValue: number }[];
  recentMovements: { id: string; productName: string; sku: string; type: StockMovementType; quantity: number; reason: string | null; createdAt: string }[];
}

export type NotificationType = 'LOW_STOCK' | 'PURCHASE_RECEIVED' | 'SALE_ISSUED' | 'SYSTEM';

export interface AppNotification {
  id: string;
  warehouseId: string | null;
  warehouseName: string | null;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}
