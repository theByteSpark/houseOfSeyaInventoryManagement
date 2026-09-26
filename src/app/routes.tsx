import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AdminRoute } from '@/components/layout/AdminRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { CustomersListPage } from '@/features/customers/CustomersListPage';
import { ProductsListPage } from '@/features/inventory/ProductsListPage';
import { ProductFormPage } from '@/features/inventory/ProductFormPage';
import { CategoriesPage } from '@/features/inventory/CategoriesPage';
import { SubcategoriesPage } from '@/features/inventory/SubcategoriesPage';
import { AttributeOptionsPage } from '@/features/attributes/AttributeOptionsPage';
import { EnquiriesListPage } from '@/features/enquiries/EnquiriesListPage';
import { SalesListPage } from '@/features/sales/SalesListPage';
import { SaleFormPage } from '@/features/sales/SaleFormPage';
import { SaleDetailPage } from '@/features/sales/SaleDetailPage';
import { VendorsListPage } from '@/features/vendors/VendorsListPage';
import { PurchasesListPage } from '@/features/purchases/PurchasesListPage';
import { PurchaseFormPage } from '@/features/purchases/PurchaseFormPage';
import { PurchaseDetailPage } from '@/features/purchases/PurchaseDetailPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { UsersListPage } from '@/features/users/UsersListPage';
import { HelpPage } from '@/features/help/HelpPage';

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
        <Route path="/inventory/products/new" element={<ProductFormPage />} />
        <Route path="/inventory/products/:id/edit" element={<ProductFormPage />} />
        <Route path="/enquiries" element={<EnquiriesListPage />} />
        <Route path="/inventory/categories" element={<CategoriesPage />} />
        <Route path="/inventory/subcategories" element={<SubcategoriesPage />} />
        <Route path="/sales" element={<SalesListPage />} />
        <Route path="/sales/new" element={<SaleFormPage />} />
        <Route path="/sales/:id/edit" element={<SaleFormPage />} />
        <Route path="/sales/:id" element={<SaleDetailPage />} />
        <Route path="/vendors" element={<VendorsListPage />} />
        <Route path="/purchases" element={<PurchasesListPage />} />
        <Route path="/purchases/new" element={<PurchaseFormPage />} />
        <Route path="/purchases/:id/edit" element={<PurchaseFormPage />} />
        <Route path="/purchases/:id" element={<PurchaseDetailPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route
          path="/users"
          element={
            <AdminRoute>
              <UsersListPage />
            </AdminRoute>
          }
        />
        <Route
          path="/settings/attributes"
          element={
            <AdminRoute>
              <AttributeOptionsPage />
            </AdminRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
