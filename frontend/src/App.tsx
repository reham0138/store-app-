
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

function App() {
  return (
    <BranchProvider>
      <CartProvider>
        <AuthProvider>
          <Router>
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
            </Routes>
          </Router>
        </AuthProvider>
      </CartProvider>
    </BranchProvider>
  );
}

export default App;
