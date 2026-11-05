
import {
  Boxes,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Package,
} from "lucide-react";
import {
  BrowserRouter as Router,
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
import DashboardOrdersPage from "./pages/DashboardOrdersPage";
import DashboardPlaceholderPage from "./pages/DashboardPlaceholderPage";
import DashboardPreviewPage from "./pages/DashboardPreviewPage";
import DashboardLayout from "./shared/layouts/DashboardLayout";
import { DashboardTopbar } from "./shared/components/dashboard";
import ErrorBoundary from "./shared/components/ErrorBoundary";

const dashboardSidebarItems = [
  {
    label: "Overview",
    path: "/dashboard",
    icon: <LayoutDashboard size={18} />,
    end: true,
  },
  {
    label: "Orders",
    path: "/dashboard/orders",
    icon: <ClipboardList size={18} />,
  },
  {
    label: "Products",
    path: "/dashboard/products",
    icon: <Package size={18} />,
  },
  {
    label: "Inventory",
    path: "/dashboard/inventory",
    icon: <Boxes size={18} />,
  },
  {
    label: "Reports",
    path: "/dashboard/reports",
    icon: <FileText size={18} />,
  },
];

function App() {
  return (
    <BranchProvider>
      <CartProvider>
        <AuthProvider>
          <Router>
            <ErrorBoundary>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="branches" element={<BranchesPage />} />
                <Route path="branch-test" element={<BranchesPage />} />
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
              {/* Re-enable the ProtectedRoute wrapper when dashboard access should be restricted. */}
              <Route
                path="dashboard"
                element={
                  <DashboardLayout
                    sidebarItems={dashboardSidebarItems}
                    topbar={<DashboardTopbar />}
                  />
                }
              >
                <Route index element={<DashboardPreviewPage />} />
                <Route path="orders" element={<DashboardOrdersPage />} />
                <Route
                  path="products"
                  element={
                    <DashboardPlaceholderPage
                      title="Products"
                      description="Manage the store product catalog."
                    />
                  }
                />
                <Route
                  path="inventory"
                  element={
                    <DashboardPlaceholderPage
                      title="Inventory"
                      description="Review stock levels across the store."
                    />
                  }
                />
                <Route
                  path="reports"
                  element={
                    <DashboardPlaceholderPage
                      title="Reports"
                      description="View store performance reports."
                    />
                  }
                />
              </Route>
            </Routes>
            </ErrorBoundary>
          </Router>
        </AuthProvider>
      </CartProvider>
    </BranchProvider>
  );
}

export default App;
