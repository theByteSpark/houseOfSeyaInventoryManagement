export type Role = 'ADMIN' | 'STAFF';

export type SortDir = 'asc' | 'desc';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
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
  subcategoryCount: number;
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  productCount: number;
}

export type AttributeType = 'METAL' | 'DIAMOND_SHAPE' | 'DIAMOND_QUALITY';

export interface AttributeOption {
  id: string;
  type: AttributeType;
  label: string;
  sortOrder: number;
}

export interface ProductDiamond {
  id?: string;
  shape: string;
  quality: string;
  pieces: number;
  caratWeight: number;
  weight: number;
  rate: number;
  amount?: number;
}

export interface Product {
  id: string;
  designNumber: string;
  name: string;
  metalType: string | null;
  grossWeight: number | null;
  metalRatePerGram: number | null;
  metalCost: number;
  diamonds: ProductDiamond[];
  totalDiamondCost: number;
  makingChargePerGram: number | null;
  labourCost: number;
  fixedExpense: number;
  totalCost: number;
  taxAmount: number;
  finalAmount: number;
  sellingPrice: number;
  quantityInStock: number;
  reorderLevel: number;
  subcategoryId: string | null;
  subcategoryName: string | null;
  categoryId: string | null;
  categoryName: string | null;
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

export type SaleStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  designNumber: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Sale {
  id: string;
  saleNumber: string;
  customerId: string;
  customerName: string;
  status: SaleStatus;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  issuedAt: string | null;
  createdAt: string;
}

export interface DashboardSummary {
  totalProducts: number;
  lowStockCount: number;
  totalCustomers: number;
  totalVendors: number;
  salesThisMonth: number;
  revenueThisMonth: number;
  purchasesThisMonth: number;
  pendingPOs: number;
  recentSales: Sale[];
  recentPurchases: Purchase[];
  lowStockProducts: Product[];
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

export type PurchaseStatus = 'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  designNumber: string;
  quantity: number;
  receivedQuantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  vendorId: string;
  vendorName: string;
  status: PurchaseStatus;
  items: PurchaseItem[];
  subtotal: number;
  total: number;
  vendorInvoiceNumber: string | null;
  vendorInvoiceDate: string | null;
  orderedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
}

export interface SalesReport {
  totalCount: number;
  totalRevenue: number;
  totalTax: number;
  statusBreakdown: { status: SaleStatus; count: number }[];
  topProducts: { product: string; designNumber: string; quantity: number; revenue: number }[];
  sales: { id: string; saleNumber: string; customerName: string; status: SaleStatus; total: number; createdAt: string }[];
}

export interface PurchasesReport {
  totalCount: number;
  totalCost: number;
  statusBreakdown: { status: PurchaseStatus; count: number }[];
  topProducts: { product: string; designNumber: string; quantity: number; cost: number }[];
  purchases: { id: string; purchaseNumber: string; vendorName: string; status: PurchaseStatus; total: number; createdAt: string }[];
}

export interface InventoryReport {
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  lowStockProducts: { id: string; name: string; designNumber: string; quantityInStock: number; reorderLevel: number }[];
  categoryBreakdown: { category: string; productCount: number; stockValue: number }[];
  recentMovements: { id: string; productName: string; designNumber: string; type: StockMovementType; quantity: number; reason: string | null; createdAt: string }[];
}
