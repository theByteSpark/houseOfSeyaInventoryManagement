import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AdminRoute } from '@/components/layout/AdminRoute';
import { FullPageSpinner } from '@/components/ui';

// Every page is its own chunk, loaded on first navigation instead of all
// landing in one ~600kB bundle up front — keeps the initial load small
// regardless of how many feature pages the app grows to.
const LoginPage = lazy(() => import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() =>
  import('@/features/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
);
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const CustomersListPage = lazy(() =>
  import('@/features/customers/CustomersListPage').then((m) => ({ default: m.CustomersListPage })),
);
const ProductsListPage = lazy(() =>
  import('@/features/inventory/ProductsListPage').then((m) => ({ default: m.ProductsListPage })),
);
const ProductFormPage = lazy(() =>
  import('@/features/inventory/ProductFormPage').then((m) => ({ default: m.ProductFormPage })),
);
const CategoriesPage = lazy(() => import('@/features/inventory/CategoriesPage').then((m) => ({ default: m.CategoriesPage })));
const SubcategoriesPage = lazy(() =>
  import('@/features/inventory/SubcategoriesPage').then((m) => ({ default: m.SubcategoriesPage })),
);
const AttributeOptionsPage = lazy(() =>
  import('@/features/attributes/AttributeOptionsPage').then((m) => ({ default: m.AttributeOptionsPage })),
);
const EnquiriesListPage = lazy(() =>
  import('@/features/enquiries/EnquiriesListPage').then((m) => ({ default: m.EnquiriesListPage })),
);
const PurchaseEnquiriesListPage = lazy(() =>
  import('@/features/purchase-enquiries/PurchaseEnquiriesListPage').then((m) => ({
    default: m.PurchaseEnquiriesListPage,
  })),
);
const SalesListPage = lazy(() => import('@/features/sales/SalesListPage').then((m) => ({ default: m.SalesListPage })));
const SaleFormPage = lazy(() => import('@/features/sales/SaleFormPage').then((m) => ({ default: m.SaleFormPage })));
const SaleDetailPage = lazy(() => import('@/features/sales/SaleDetailPage').then((m) => ({ default: m.SaleDetailPage })));
const VendorsListPage = lazy(() => import('@/features/vendors/VendorsListPage').then((m) => ({ default: m.VendorsListPage })));
const PurchasesListPage = lazy(() =>
  import('@/features/purchases/PurchasesListPage').then((m) => ({ default: m.PurchasesListPage })),
);
const PurchaseFormPage = lazy(() =>
  import('@/features/purchases/PurchaseFormPage').then((m) => ({ default: m.PurchaseFormPage })),
);
const PurchaseDetailPage = lazy(() =>
  import('@/features/purchases/PurchaseDetailPage').then((m) => ({ default: m.PurchaseDetailPage })),
);
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const UsersListPage = lazy(() => import('@/features/users/UsersListPage').then((m) => ({ default: m.UsersListPage })));
const HelpPage = lazy(() => import('@/features/help/HelpPage').then((m) => ({ default: m.HelpPage })));

export function AppRoutes() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
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
          <Route path="/purchase-enquiries" element={<PurchaseEnquiriesListPage />} />
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
    </Suspense>
  );
}
