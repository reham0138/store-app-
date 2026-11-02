
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import MainLayout from "./shared/layouts/MainLayout";
import BranchesPage from "./pages/BranchesPage";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";

import { CartProvider } from "./shared/contexts/CartContext";
import { AuthProvider } from "./shared/contexts/AuthProvider";
import { BranchProvider } from "./shared/contexts/BranchProvider";

import CartPage from "./shared/components/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import ProductsPage from "./pages/ProductPage";
import DashboardPreviewPage from "./pages/DashboardPreviewPage";
import DashboardOrdersPage from "./pages/DashboardOrdersPage";
import DashboardPlaceholderPage from "./pages/DashboardPlaceholderPage";
import DashboardLayout from "./shared/layouts/DashboardLayout";
import DashboardTopbar from "./shared/components/dashboard/DashboardTopbar";
import { managerDashboardNavigation } from "./shared/constants/dashboardNavigation";

function App() {
  return (
    <CartProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route
              path="dashboard-preview"
              element={<Navigate to="/manager/dashboard" replace />}
            />
            <Route
              path="manager"
              element={
                <DashboardLayout
                  sidebarItems={managerDashboardNavigation}
                  sidebarTitle="Manager Dashboard"
                  sidebarSubtitle="Preview"
                  topbar={
                    <DashboardTopbar
                      userName="Branch Manager"
                      branchName="Damascus Branch"
                    />
                  }
                />
              }
            >
              <Route path="dashboard" element={<DashboardPreviewPage />} />
              <Route path="orders" element={<DashboardOrdersPage />} />
              <Route path="products" element={<DashboardPreviewPage />} />
              <Route
                path="inventory"
                element={
                  <DashboardPlaceholderPage
                    title="Inventory"
                    description="Monitor stock levels for this branch."
                  />
                }
              />
              <Route
                path="reports"
                element={
                  <DashboardPlaceholderPage
                    title="Reports"
                    description="Review branch performance reports."
                  />
                }
              />
            </Route>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<div />} />
              <Route path="products" element={<ProductsPage />} />
              <Route
                path="branch-test"
                element={<BranchSelectorTestPage />}
              />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route
                path="order-success"
                element={<OrderSuccessPage />}
              />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </CartProvider>
  );
}

export default App;
