
import {
  Boxes,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Package,
} from "lucide-react";
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
import ProductDetailsPage from "./pages/ProductDetailsPage";
import DashboardOrdersPage from "./pages/DashboardOrdersPage";
import DashboardPreviewPage from "./pages/DashboardPreviewPage";
import DashboardLayout from "./shared/layouts/DashboardLayout";
import { DashboardTopbar } from "./shared/components/dashboard";
import ErrorBoundary from "./shared/components/ErrorBoundary";
import DashboardProductsPage from "./pages/DashboardProductsPage";
import DashboardInventoryPage from "./pages/DashboardInventoryPage";
import DashboardReportsPage from "./pages/DashboardReportsPage";
import DashboardBranchOverviewPage from "./pages/DashboardBranchOverviewPage";
import { ProtectedRoute } from "./shared/components/ProtectedRoute";
import { useAuth } from "./shared/hooks/useAuth";
import { useBranch } from "./shared/contexts/useBranch";

const adminSidebarItems = [
  {
    label: "Overview",
    path: "/dashboard/admin",
    icon: <LayoutDashboard size={18} />,
    end: true,
  },
  {
    label: "Orders",
    path: "/dashboard/admin/orders",
    icon: <ClipboardList size={18} />,
  },
  {
    label: "Products",
    path: "/dashboard/admin/products",
    icon: <Package size={18} />,
  },
  {
    label: "Inventory",
    path: "/dashboard/admin/inventory",
    icon: <Boxes size={18} />,
  },
  {
    label: "Reports",
    path: "/dashboard/admin/reports",
    icon: <FileText size={18} />,
  },
];

const branchManagerSidebarItems = [
  {
    label: "Overview",
    path: "/dashboard/branch",
    icon: <LayoutDashboard size={18} />,
    end: true,
  },
  {
    label: "Inventory",
    path: "/dashboard/branch/inventory",
    icon: <Boxes size={18} />,
  },
  {
    label: "Orders",
    path: "/dashboard/branch/orders",
    icon: <ClipboardList size={18} />,
  },
];

function DashboardEntryRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: "/dashboard" }} />;
  }
  if (user.role === "admin") {
    return <Navigate to="/dashboard/admin" replace />;
  }
  if (user.role === "branchManager") {
    return <Navigate to="/dashboard/branch" replace />;
  }
  return <Navigate to="/" replace />;
}

function BranchManagerDashboardTopbar() {
  const { user } = useAuth();
  const { branches } = useBranch();
  const branchName = branches.find((branch) => branch.id === user?.branchId)?.name
    ?? "Branch not assigned";

  return (
    <DashboardTopbar branchName={branchName} />
  );
}

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
                <Route path="products/:productId" element={<ProductDetailsPage />} />
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
              <Route path="dashboard" element={<DashboardEntryRedirect />} />
              <Route element={<ProtectedRoute roles={["admin"]} />}>
                <Route
                  path="dashboard/admin"
                  element={
                    <DashboardLayout
                      sidebarItems={adminSidebarItems}
                      sidebarTitle="Admin dashboard"
                      sidebarSubtitle="Store-wide management"
                      topbar={<DashboardTopbar />}
                    />
                  }
                >
                  <Route index element={<DashboardPreviewPage />} />
                  <Route path="orders" element={<DashboardOrdersPage />} />
                  <Route path="products" element={<DashboardProductsPage />} />
                  <Route path="inventory" element={<DashboardInventoryPage />} />
                  <Route path="reports" element={<DashboardReportsPage />} />
                </Route>
              </Route>
              <Route element={<ProtectedRoute roles={["branchManager"]} />}>
                <Route
                  path="dashboard/branch"
                  element={
                    <DashboardLayout
                      sidebarItems={branchManagerSidebarItems}
                      sidebarTitle="Branch dashboard"
                      sidebarSubtitle="Branch operations"
                      topbar={<BranchManagerDashboardTopbar />}
                    />
                  }
                >
                  <Route index element={<DashboardBranchOverviewPage />} />
                  <Route
                    path="inventory"
                    element={<DashboardInventoryPage branchScoped />}
                  />
                  <Route
                    path="orders"
                    element={<DashboardOrdersPage branchScoped />}
                  />
                </Route>
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
