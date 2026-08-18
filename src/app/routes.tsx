import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { RequireRole } from '@/components/layout/AdminRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { CustomersListPage } from '@/features/customers/CustomersListPage';
import { ProductsListPage } from '@/features/inventory/ProductsListPage';
import { CategoriesPage } from '@/features/inventory/CategoriesPage';
import { SalesListPage } from '@/features/sales/SalesListPage';
import { SaleFormPage } from '@/features/sales/SaleFormPage';
import { SaleDetailPage } from '@/features/sales/SaleDetailPage';
import { VendorsListPage } from '@/features/vendors/VendorsListPage';
import { PurchasesListPage } from '@/features/purchases/PurchasesListPage';
import { PurchaseFormPage } from '@/features/purchases/PurchaseFormPage';
import { PurchaseDetailPage } from '@/features/purchases/PurchaseDetailPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { UsersListPage } from '@/features/users/UsersListPage';
import { WarehousesListPage } from '@/features/warehouses/WarehousesListPage';
import { EnquiriesPage } from '@/features/enquiries/EnquiriesPage';
import { StockTransfersPage } from '@/features/stock-transfers/StockTransfersPage';
import { StockConversionsPage } from '@/features/stock-conversions/StockConversionsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/customers" element={<CustomersListPage />} />
        <Route path="/inventory/products" element={<ProductsListPage />} />
        <Route path="/inventory/categories" element={<CategoriesPage />} />
        <Route path="/sales" element={<SalesListPage />} />
        <Route path="/sales/new" element={<SaleFormPage />} />
        <Route path="/sales/:id" element={<SaleDetailPage />} />
        <Route path="/vendors" element={<VendorsListPage />} />
        <Route path="/purchases" element={<PurchasesListPage />} />
        <Route path="/purchases/new" element={<PurchaseFormPage />} />
        <Route path="/purchases/:id/edit" element={<PurchaseFormPage />} />
        <Route path="/purchases/:id" element={<PurchaseDetailPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route
          path="/users"
          element={
            <RequireRole roles={['ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']}>
              <UsersListPage />
            </RequireRole>
          }
        />
        <Route
          path="/warehouses"
          element={
            <RequireRole roles={['COMPANY_ADMIN', 'SUPER_ADMIN']}>
              <WarehousesListPage />
            </RequireRole>
          }
        />
        <Route path="/enquiries" element={<EnquiriesPage />} />
        <Route path="/stock-conversions" element={<StockConversionsPage />} />
        <Route
          path="/stock-transfers"
          element={
            <RequireRole roles={['COMPANY_ADMIN', 'SUPER_ADMIN']}>
              <StockTransfersPage />
            </RequireRole>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
