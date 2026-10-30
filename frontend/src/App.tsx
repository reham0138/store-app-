import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";

import MainLayout from "./shared/layouts/MainLayout";

import BranchSelectorTestPage from "./pages/BranchSelectorTestPage";

import { CartProvider } from "./shared/contexts/CartContext";

import CartPage from  "../src/shared/components/CartPage" 

import CheckoutPage from "./pages/CheckoutPage";

import OrdersPage from "./pages/OrdersPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import ProductsPage from "./pages/ProductPage";

function App() {
  return (
    <CartProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
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

          </Route>
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;