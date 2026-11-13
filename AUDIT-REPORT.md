# 1. GIT & BUILD STATE

- Current branch: `main`, tracking `origin/main`.
- Local branches: `feature/auth`, `feature/authentication-merge`, `main`.
- Working tree at audit time:
  ```text
  ## main...origin/main
  ?? frontend/src/shared/components/LanguageSwitcher.tsx
  ?? package-lock.json
  ```
  No modified tracked files.
- `npm run build`: passed (`tsc -b` and Vite production build).
- `npm run lint`: failed. Output:
  ```text
  C:\Users\ASUS\store-app-\frontend\src\shared\contexts\CartContext.tsx
    154:17  error  Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components  react-refresh/only-export-components

  ✖ 1 problem (1 error, 0 warnings)
  ```
- Latest 15 commits:
  ```text
  8411c65 Merge pull request #11 from reham0138/feature/branch-based-mock-data
  c286ee9 Preserve original mock products and reconcile branch stock totals
  591692f Merge pull request #10 from reham0138/feature/branch-based-mock-data
  e7b0c84 Add branch inventory type to store products
  ad09d66 Add mock store branches
  2880cc3 Add branch-specific prices and stock to mock products
  40f0922 Merge pull request #9 from reham0138/feature/authentication-merge
  f274fcc auth files setup
  5fc0327 Merge pull request #8 from reham0138/feature/filter
  ce4df75 haidar second update
  9f7cd2f Merge pull request #7 from reham0138/feature/cart-checkout-orders
  3288d4e Merge branch 'main' into feature/cart-checkout-orders
  c6555a5 Complete cart checkout and order management flow
  399b049 feat: implement cart checkout and order management
  3b871c0 haidar first update
  ```
- Outside `frontend/`: root [package-lock.json](package-lock.json) is untracked and contains an empty `packages` object. Root `package.json`: **NOT FOUND**. `crown_anchor_design_reference/` is also outside `frontend/` and contains design reference assets.

# 2. FILE TREE

```text
src/
├── App.css
├── App.tsx
├── main.tsx
├── assets/
│   ├── hero.png
│   ├── react.svg
│   └── vite.svg
├── pages/
│   ├── BranchSelectorTestPage.tsx
│   ├── CheckoutPage.tsx
│   ├── login.tsx
│   ├── OrdersPage.tsx
│   ├── OrderSuccessPage.tsx
│   ├── ProductPage.tsx
│   └── RegisterPage.tsx
└── shared/
    ├── components/
    │   ├── AuthCard.tsx
    │   ├── branch/
    │   │   ├── BranchBadge.tsx
    │   │   └── BranchSelector.tsx
    │   ├── Button.css
    │   ├── Button.tsx
    │   ├── CartItem.tsx
    │   ├── CartPage.tsx
    │   ├── CartSummary.tsx
    │   ├── Footer.tsx
    │   ├── FormError.tsx
    │   ├── Input.tsx
    │   ├── Label.tsx
    │   ├── LanguageSwitcher.tsx
    │   ├── NavBar.tsx
    │   ├── OrderStatus.tsx
    │   ├── PasswordField.tsx
    │   ├── ProductCard.tsx
    │   ├── ProductCatalog.tsx
    │   ├── ProductGrid.tsx
    │   ├── ProtectedRoute.tsx
    │   ├── Select.tsx
    │   ├── SubmitButton.tsx
    │   └── TextField.tsx
    ├── contexts/
    │   ├── AuthContext.tsx
    │   ├── AuthProvider.tsx
    │   ├── auth-context.ts
    │   ├── BranchContext.ts
    │   ├── BranchProvider.tsx
    │   ├── CartContext.tsx
    │   └── useBranch.ts
    ├── hooks/
    │   ├── useAuth.ts
    │   └── useFetch.ts
    ├── i18n/ [empty]
    ├── layouts/
    │   └── MainLayout.tsx
    ├── services/
    │   ├── authService.ts
    │   └── product.service.ts
    ├── types/
    │   ├── auth.ts
    │   ├── cart.ts
    │   ├── order.ts
    │   ├── Product.ts
    │   └── type.ts
    └── utils/
        ├── authValidation.ts
        ├── format.ts
        ├── orderStorage.ts
        └── pricing.ts
```

- Empty files: [AuthContext.tsx](frontend/src/shared/contexts/AuthContext.tsx), [useFetch.ts](frontend/src/shared/hooks/useFetch.ts), [format.ts](frontend/src/shared/utils/format.ts), untracked [LanguageSwitcher.tsx](frontend/src/shared/components/LanguageSwitcher.tsx). The `i18n/` folder is empty.
- Duplicate/conflated naming: empty `AuthContext.tsx` and active `auth-context.ts`; overlapping product models in [Product.ts](frontend/src/shared/types/Product.ts#L1) and [cart.ts](frontend/src/shared/types/cart.ts#L7).
- Naming inconsistencies include `login.tsx` vs PascalCase page names, `Product.ts` vs lowercase type filenames, and `authService.ts` vs `product.service.ts`.
- Not imported by the routed app: `ProductCatalog`, `Input`, `ProtectedRoute`, and `LanguageSwitcher`. `ProductGrid` is only used by `ProductCatalog`, which itself is unused. `Product.ts` is used only by those legacy catalog files.
- `hero.png`, `react.svg`, and `vite.svg` under `src/assets/` have no source imports. `branches.json` is not loaded by source code.

# 3. TYPES

[Product.ts](frontend/src/shared/types/Product.ts#L1):
```ts
export interface Product {
  id: number;
  name:string;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  thumbnail: string;
  images: string[];
}
```

[cart.ts](frontend/src/shared/types/cart.ts#L1):
```ts
export interface BranchInventory {
  branchId: string;
  price: number;
  stock: number;
}

export interface StoreProduct {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  thumbnail: string;
  images: string[];
  branchInventory?: BranchInventory[];
}

export interface CartItem {
  product: StoreProduct;
  quantity: number;
}

export interface CartContextType {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  total: number;

  addToCart: (product: StoreProduct, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
}
```

[type.ts](frontend/src/shared/types/type.ts#L1):
```ts
export interface Branch {
  id: string;
  name: string;
  code?: string;          
  address?: string;
  isDefault?: boolean;    
  parentId?: string | null;
  latitude?: number;
  longitude?: number;
}
```

[order.ts](frontend/src/shared/types/order.ts#L1):
```ts
import type { CartItem } from "./cart";

export type PaymentMethod = "cash" | "card";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface ShippingAddress {
  fullName: string;
  phone: string;
  city: string;
  street: string;
  building?: string;
  notes?: string;
}

export interface Order {
  id: string;
  items: CartItem[];

  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;

  subtotal: number;
  deliveryFee: number;
  total: number;

  status: OrderStatus;
  createdAt: string;
}
```

[auth.ts](frontend/src/shared/types/auth.ts#L1):
```ts
export type UserRole = 'customer' | 'branchManager' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}
```

- `OrderItem`: **NOT FOUND**. `Order.items` uses `CartItem[]`.
- Same-domain types: `Product` and `StoreProduct` share the product fields, but `Product` requires `name` and has no `branchInventory`; `StoreProduct` has optional `branchInventory` and no `name`. Product JSON records have no `name`.
- `CartItem` is also the item model for orders; no separate order-line price/type is defined.

# 4. MOCK DATA

| File | Records | Top-level shape |
|---|---:|---|
| [products.json](frontend/public/mock/products.json#L1) | 40 products | `{ products, total, skip, limit }` |
| [branches.json](frontend/public/mock/branches.json#L1) | 3 branches | `{ branches }` |
| `frontend/src/**/*.json` | — | **NOT FOUND** |
| [design-tokens.json](crown_anchor_design_reference/tokens/design-tokens.json) | Not mock data | Design reference tokens outside frontend |

[branches.json](frontend/public/mock/branches.json#L1), full content:
```json
{
  "branches": [
    {
      "id": "damascus",
      "name": "Damascus",
      "code": "DAM",
      "address": "Damascus, Syria",
      "latitude": 33.5138,
      "longitude": 36.2765,
      "isDefault": true
    },
    {
      "id": "homs",
      "name": "Homs",
      "code": "HOM",
      "address": "Homs, Syria",
      "latitude": 34.7324,
      "longitude": 36.7137
    },
    {
      "id": "latakia",
      "name": "Latakia",
      "code": "LAT",
      "address": "Latakia, Syria",
      "latitude": 35.5317,
      "longitude": 35.7901
    }
  ]
}
```

First two product records from [products.json](frontend/public/mock/products.json#L1):
```json
{
  "id": 1,
  "title": "Phone X Pro",
  "description": "Phone X Pro by Apex. Reliable quality and great value, ideal for everyday use.",
  "category": "smartphones",
  "price": 699,
  "discountPercentage": 5,
  "rating": 4.5,
  "stock": 3,
  "brand": "Apex",
  "thumbnail": "https://picsum.photos/seed/prod1-thumb/300/300",
  "images": [
    "https://picsum.photos/seed/prod1-a/600/600",
    "https://picsum.photos/seed/prod1-b/600/600"
  ],
  "branchInventory": [
    { "branchId": "damascus", "price": 719.97, "stock": 1 },
    { "branchId": "homs", "price": 685.02, "stock": 1 },
    { "branchId": "latakia", "price": 699, "stock": 1 }
  ]
},
{
  "id": 2,
  "title": "Phone A Series",
  "description": "Phone A Series by Nova. Reliable quality and great value, ideal for everyday use.",
  "category": "smartphones",
  "price": 449,
  "discountPercentage": 8,
  "rating": 4,
  "stock": 12,
  "brand": "Nova",
  "thumbnail": "https://picsum.photos/seed/prod2-thumb/300/300",
  "images": [
    "https://picsum.photos/seed/prod2-a/600/600",
    "https://picsum.photos/seed/prod2-b/600/600"
  ],
  "branchInventory": [
    { "branchId": "damascus", "price": 462.47, "stock": 4 },
    { "branchId": "homs", "price": 440.02, "stock": 4 },
    { "branchId": "latakia", "price": 449, "stock": 4 }
  ]
}
```

Users: [authService.ts](frontend/src/shared/services/authService.ts#L10) uses `crown-anchor:mock-users` and `crown-anchor:session`. `readUsers()` returns `[]` for missing or invalid data; there is no seed function and no default user. Registration creates a UUID user with role `customer` and stores the supplied password in plaintext. No admin/manager account is seeded.

Orders: [orderStorage.ts](frontend/src/shared/utils/orderStorage.ts#L3) uses `crown-anchor-orders`; `saveOrder` prepends the order to the stored array. No order seed function was found.

| localStorage key | Reads/writes |
|---|---|
| `crown-anchor-cart` | [CartContext.tsx](frontend/src/shared/contexts/CartContext.tsx#L19): reads on initialization, writes on item changes |
| `crown-anchor:mock-users` | [authService.ts](frontend/src/shared/services/authService.ts#L10): reads/writes users |
| `crown-anchor:session` | [authService.ts](frontend/src/shared/services/authService.ts#L11): reads/writes/removes current user ID |
| `crown-anchor-orders` | [orderStorage.ts](frontend/src/shared/utils/orderStorage.ts#L3): reads/writes orders |
| `selectedBranchId` | [BranchProvider.tsx](frontend/src/shared/contexts/BranchProvider.tsx#L15): provider default key; current mounted page overrides it |
| `branch-test-selectedBranchId` | [BranchSelectorTestPage.tsx](frontend/src/pages/BranchSelectorTestPage.tsx#L84): key passed to the only `BranchProvider` mount |

# 5. SERVICES & DATA ACCESS

| File / function | Signature → return | Async? |
|---|---|---:|
| [product.service.ts](frontend/src/shared/services/product.service.ts#L8) `getProducts` | `(): Promise<StoreProduct[]>` | Yes |
| [authService.ts](frontend/src/shared/services/authService.ts#L55) `login` | `(LoginInput): Promise<User>` | Yes |
| [authService.ts](frontend/src/shared/services/authService.ts#L67) `register` | `(RegisterInput): Promise<User>` | Yes |
| [authService.ts](frontend/src/shared/services/authService.ts#L86) `logout` | `(): void` | No |
| [authService.ts](frontend/src/shared/services/authService.ts#L91) `getCurrentUser` | `(): User \| null` | No |
| [orderStorage.ts](frontend/src/shared/utils/orderStorage.ts#L5) `getOrders` | `(): Order[]` | No |
| [orderStorage.ts](frontend/src/shared/utils/orderStorage.ts#L17) `saveOrder` | `(order: Order): void` | No |
| [orderStorage.ts](frontend/src/shared/utils/orderStorage.ts#L28) `getOrderById` | `(id: string): Order \| undefined` | No |
| [pricing.ts](frontend/src/shared/utils/pricing.ts#L5) `getProductPrice` | `(product: StoreProduct): number` | No |
| [pricing.ts](frontend/src/shared/utils/pricing.ts#L13) `formatPrice` | `(price: number): string` | No |
| [authValidation.ts](frontend/src/shared/utils/authValidation.ts#L5) `validateName` | `(value: string): string \| undefined` | No |
| [authValidation.ts](frontend/src/shared/utils/authValidation.ts#L10) `validateEmail` | `(value: string): string \| undefined` | No |
| [authValidation.ts](frontend/src/shared/utils/authValidation.ts#L16) `validatePassword` | `(value: string): string \| undefined` | No |
| [authValidation.ts](frontend/src/shared/utils/authValidation.ts#L24) `validateConfirm` | `(password: string, confirm: string): string \| undefined` | No |

Other exported service symbols: `AuthError` with `AuthErrorCode = 'INVALID_CREDENTIALS' | 'EMAIL_TAKEN'`; `authService` object containing `login`, `register`, `logout`, `getCurrentUser`. `getProducts` fetches `/mock/products.json` and returns `data.products`.

Direct data access:
- [ProductCatalog.tsx](frontend/src/shared/components/ProductCatalog.tsx#L13) calls `fetch("/mock/products.json")` directly; this component is not imported by the app.
- [product.service.ts](frontend/src/shared/services/product.service.ts#L9) fetches the same JSON through the service; routed [ProductPage.tsx](frontend/src/pages/ProductPage.tsx#L26) calls `getProducts()`.
- Direct `localStorage` access occurs in [BranchProvider.tsx](frontend/src/shared/contexts/BranchProvider.tsx#L19), [CartContext.tsx](frontend/src/shared/contexts/CartContext.tsx#L27), [authService.ts](frontend/src/shared/services/authService.ts#L40), and [orderStorage.ts](frontend/src/shared/utils/orderStorage.ts#L7).
- Direct `axios` use and JSON imports: **NOT FOUND**.

# 6. BRANCHES

- `BranchContext`, `BranchProvider`, and `useBranch` are in [BranchContext.ts](frontend/src/shared/contexts/BranchContext.ts#L1), [BranchProvider.tsx](frontend/src/shared/contexts/BranchProvider.tsx#L12), and [useBranch.ts](frontend/src/shared/contexts/useBranch.ts#L4).
- `BranchProvider` is mounted only inside [BranchSelectorTestPage.tsx](frontend/src/pages/BranchSelectorTestPage.tsx#L84), using inline branch fixtures. It is not mounted in `App.tsx`.
- `branches.json` is not loaded. `initialBranches` defaults to `[]`; the test page supplies its own Damascus, Homs, and Latakia entries.
- Selected branch persistence: yes. Provider defaults to `selectedBranchId`, but the actual mount passes `branch-test-selectedBranchId`. It reads and writes the configured key; there is no try/catch around those operations.
- Selected branch is read by `BranchSelector` and `BranchSelectorTestContent` only: [BranchSelector.tsx](frontend/src/shared/components/branch/BranchSelector.tsx#L11), [BranchSelectorTestPage.tsx](frontend/src/pages/BranchSelectorTestPage.tsx#L36).
- `ProductPage`/`ProductCard`, `CartContext`/`CartPage`, and `CheckoutPage` do not read the selected branch; branch-specific inventory is therefore not used in those flows.
- `branchInventory` is defined as optional in [cart.ts](frontend/src/shared/types/cart.ts#L1) and present in all 40 product records (120 entries total). Runtime lookup via `find`, index, or direct access: **NOT FOUND**.
- Missing-inventory behavior: **NOT FOUND**; no code reads `branchInventory`, so no fallback or undefined handling exists.

# 7. PRICING

| File | Price/discount access |
|---|---|
| [ProductPage.tsx](frontend/src/pages/ProductPage.tsx#L73) | Sorts by `a.price`/`b.price` and `discountPercentage`; manual discounted-price formula at lines 76–85. |
| [ProductCard.tsx](frontend/src/shared/components/ProductCard.tsx#L9) | Calculates `product.price * (1 - discountPercentage / 100)`; displays discounted and base price using `toFixed(2)` at lines 44–49. Checks top-level `product.stock` at lines 15 and 55–65. |
| [CartContext.tsx](frontend/src/shared/contexts/CartContext.tsx#L49) | Add/update caps use top-level `product.stock`; subtotal calls `getProductPrice` at line 119; delivery fee and total are computed at lines 130–132. |
| [CartItem.tsx](frontend/src/shared/components/CartItem.tsx#L23) | Displays `getProductPrice(product)`, line total, and top-level stock at lines 46, 50, 74, and 85. |
| [CheckoutPage.tsx](frontend/src/pages/CheckoutPage.tsx#L324) | Manually calculates displayed item price from top-level `price` and `discountPercentage`; displays context subtotal, delivery fee, total at lines 336–346. |
| [CartSummary.tsx](frontend/src/shared/components/CartSummary.tsx#L29) | Displays subtotal, delivery fee, and total. |
| [OrdersPage.tsx](frontend/src/pages/OrdersPage.tsx#L115) | Displays saved `order.total`. |
| [OrderSuccessPage.tsx](frontend/src/pages/OrderSuccessPage.tsx#L81) | Displays saved `order.total`. |
| [pricing.ts](frontend/src/shared/utils/pricing.ts#L3) | `DELIVERY_FEE = 5`; discounted price uses `toFixed(2)` at lines 5–10; formats as `en-US`, USD at lines 13–18. |

Branch inventory prices/stocks are not read; calculations and stock checks use top-level values. ProductCard uses a literal `$`; shared `formatPrice` uses `Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })`. Manual formulas occur in ProductPage, ProductCard, and CheckoutPage; `toFixed` occurs in ProductCard and `pricing.ts`; `Math.round`: **NOT FOUND**.

Cart subtotal is the sum of rounded `getProductPrice(product) * quantity`; delivery is `$5` when cart has items, otherwise `$0`; total is subtotal plus delivery. Checkout stores those context totals. It clones each cart item and product object into `Order.items`, so the product fields including base `price`, `discountPercentage`, and optional inventory data are snapshotted. There is no explicit discounted unit-price field in an order item.

# 8. CART & ORDERS

- Cart shape: `items`, `totalItems`, `subtotal`, `deliveryFee`, `total`, `addToCart`, `updateQuantity`, `removeFromCart`, `clearCart`; defined in [cart.ts](frontend/src/shared/types/cart.ts#L26).
- Persistence key: `crown-anchor-cart`. `loadCart` catches read/parse errors; provider writes on every item change. See [CartContext.tsx](frontend/src/shared/contexts/CartContext.tsx#L19).
- `addToCart` ignores nonpositive quantity or zero top-level stock, merges by product ID, replaces the stored product, and caps quantity at top-level stock. `updateQuantity` caps quantity and filters out zero/negative quantities. Remove filters by ID; clear empties the cart. See [CartContext.tsx](frontend/src/shared/contexts/CartContext.tsx#L47).
- Branch changes: **NOT FOUND** in cart logic; cart items are not tied to branch ID.
- Checkout creates `ORD-${Date.now()}` with cloned cart items, shipping address, payment method, subtotal, delivery fee, total, status `pending`, and `createdAt`; saves it, clears cart, then navigates to success. See [CheckoutPage.tsx](frontend/src/pages/CheckoutPage.tsx#L60).
- Order fields: `id, items, shippingAddress, paymentMethod, subtotal, deliveryFee, total, status, createdAt`. No user ID or fulfillment/pickup field. Payment methods are `cash | card`; statuses are `pending | processing | shipped | delivered | cancelled`.
- `OrdersPage` loads all orders and does not filter by user. Saved `Order` has no user identifier. See [OrdersPage.tsx](frontend/src/pages/OrdersPage.tsx#L11).
- `react-refresh/only-export-components` at `CartContext.tsx:154:17` is caused by the module exporting both `CartProvider` and the non-component `useCart` hook. No change was made to that file.

# 9. ROUTING & AUTH

[App.tsx](frontend/src/App.tsx#L1), full:
```tsx
import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";

import MainLayout from "./shared/layouts/MainLayout";
import BranchSelectorTestPage from "./pages/BranchSelectorTestPage";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/RegisterPage";

import { CartProvider } from "./shared/contexts/CartContext";
import { AuthProvider } from "./shared/contexts/AuthProvider";

import CartPage from "./shared/components/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import ProductsPage from "./pages/ProductPage";

function App() {
  return (
    <CartProvider>
      <AuthProvider>
        <Router>
          <Routes>
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
```

[ProtectedRoute.tsx](frontend/src/shared/components/ProtectedRoute.tsx#L1), full:
```tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'
import type { UserRole } from '../types/auth.ts'

interface ProtectedRouteProps {
  /** إذا انحددت: بس هالأدوار مسموح لها (مثلاً الداشبورد). */
  roles?: UserRole[]
}

/**
 * الاستخدام داخل <Routes>:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="checkout" element={<CheckoutPage />} />
 *   </Route>
 *   <Route element={<ProtectedRoute roles={['admin', 'branchManager']} />}>
 *     <Route path="dashboard" element={<DashboardPage />} />
 *   </Route>
 */
export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    )
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
```

No separate router file: **NOT FOUND**. Routes in `App.tsx` are `/`, `/products`, `/branch-test`, `/cart`, `/checkout`, `/orders`, `/order-success`, `/login`, and `/register`. None are wrapped in `ProtectedRoute`; all are public. Login/register pages separately redirect already-authenticated users. 404 route/page and 403 page: **NOT FOUND**.

Provider order: `CartProvider` → `AuthProvider` → `Router`; `LanguageProvider`: **NOT FOUND**. `AuthProvider` is mounted in `App.tsx`; `LanguageProvider` is not.

`NavBar` shows brand/home, Branch test, cart with item count, Products, and Orders. Login/register/logout links, user menu, and an embedded branch selector: **NOT FOUND**. Cart count is read from `useCart()`. See [NavBar.tsx](frontend/src/shared/components/NavBar.tsx#L13).

# 10. I18N & RTL

- `src/shared/i18n/`: empty. `LanguageProvider`, `useLanguage`, translations, and calls to `t()`: **NOT FOUND**.
- [LanguageSwitcher.tsx](frontend/src/shared/components/LanguageSwitcher.tsx): empty, untracked.
- [index.html](frontend/index.html#L2) hardcodes `lang="en"` and no `dir`; [AuthCard.tsx](frontend/src/shared/components/AuthCard.tsx#L12) locally sets `dir="rtl"`.
- Hardcoded user-facing strings outside translation files (none exist):

| File | Strings |
|---|---|
| [index.html](frontend/index.html#L2) | Document title: “The Crown & Anchor”. |
| [NavBar.tsx](frontend/src/shared/components/NavBar.tsx#L22) | “The Crown & Anchor home”, “The Crown & Anchor”, “MORE THAN JUST A STORE”, “Home”, “Branch”, “Shopping cart, {n} items”, “Cart”, “Products”, “Orders”. |
| [Footer.tsx](frontend/src/shared/components/Footer.tsx#L4) | “The Crown & Anchor”, “MORE THAN JUST A STORE”, “Back to home”, copyright text. |
| [BranchSelectorTestPage.tsx](frontend/src/pages/BranchSelectorTestPage.tsx#L42) | “Component playground”, “Branch selector”, “Switch between store branches in Damascus, Homs, and Latakia.”, “Current branch”, “Branch ID”, “Address”, “Not provided”; inline branch names and addresses. |
| [BranchSelector.tsx](frontend/src/shared/components/branch/BranchSelector.tsx#L39) | “Branch”, “Select a branch”, “No branches available”, “(default)”, “Location is not supported by this browser.”, “Branch locations are not available yet.”, location denied/timeout/unavailable messages, “Finding nearby branch...”, “Use my location”, “Use default branch”. |
| [BranchBadge.tsx](frontend/src/shared/components/branch/BranchBadge.tsx#L19) | “Branch”, “None selected”, “Nearby”. |
| [ProductPage.tsx](frontend/src/pages/ProductPage.tsx#L35) | Load failure message; “The Crown & Anchor”, “Explore Our Products”, “Discover quality products selected for your everyday needs.”, “All Products”, loading/count text, search placeholder, sort label/options, “All”, “Try Again”, “No products found”, “Try another search term or category.”, “Clear filters”. |
| [ProductCard.tsx](frontend/src/shared/components/ProductCard.tsx#L39) | “category:”, Arabic “السعر:”, “Out of stock”, “Added to cart”, “Add to cart”. |
| [ProductCatalog.tsx](frontend/src/shared/components/ProductCatalog.tsx#L13) | Arabic loading/error/fallback messages and “Products catalog”; component is unused. |
| [ProductGrid.tsx](frontend/src/shared/components/ProductGrid.tsx#L10) | Arabic no-products message; only rendered by unused `ProductCatalog`. |
| [CartPage.tsx](frontend/src/shared/components/CartPage.tsx#L28) | “Your cart is empty”, explanatory empty-cart text, “Explore Products”, “Shopping”, “Shopping Cart”, item-count text. |
| [CartItem.tsx](frontend/src/shared/components/CartItem.tsx#L50) | “available”, “Decrease quantity”, “Increase quantity”, “Remove”. |
| [CartSummary.tsx](frontend/src/shared/components/CartSummary.tsx#L22) | “Order Summary”, “Subtotal”, “Delivery Fee”, “Total”, “Proceed to Checkout”, “Continue Shopping”. |
| [CheckoutPage.tsx](frontend/src/pages/CheckoutPage.tsx#L89) | “Your cart is empty”, “Browse Products”, “Back to Cart”, “Checkout”, shipping/payment headings and fields/placeholders, payment descriptions, “Order Review”, totals, “Place Order”, confirmation text. |
| [OrdersPage.tsx](frontend/src/pages/OrdersPage.tsx#L20) | “Account”, “My Orders”, tracking text, empty-state text, “Start Shopping”, order/date/item/total labels, delivery and payment labels. |
| [OrderSuccessPage.tsx](frontend/src/pages/OrderSuccessPage.tsx#L23) | “Order not found”, “View My Orders”, “Order Confirmed”, thank-you and tracking text, order/total/payment labels, “Continue Shopping”. |
| [login.tsx](frontend/src/pages/login.tsx#L49) | Arabic unexpected-error fallback, login title/subtitle, account/register prompt/link, email/password labels, email placeholder, submit label. |
| [RegisterPage.tsx](frontend/src/pages/RegisterPage.tsx#L58) | Arabic unexpected-error fallback, registration title/subtitle, account/login prompt/link, name/email/password/confirmation labels, email and minimum-password placeholders, submit label. |
| [PasswordField.tsx](frontend/src/shared/components/PasswordField.tsx#L21) | Arabic “إخفاء كلمة المرور” / “إظهار كلمة المرور” aria labels. |
| [authService.ts](frontend/src/shared/services/authService.ts#L61) | Arabic invalid-credentials and email-taken messages. |
| [authValidation.ts](frontend/src/shared/utils/authValidation.ts#L5) | Arabic name, email, password, confirmation, and mismatch validation messages. |
| [OrderStatus.tsx](frontend/src/shared/components/OrderStatus.tsx#L7) | “Pending”, “Processing”, “Shipped”, “Delivered”, “Cancelled”. |

- Physical-direction classes: [ProductPage.tsx](frontend/src/pages/ProductPage.tsx#L141) uses `left-3` at lines 141/156 and `pl-*`/`pr-*` at 149/165; [NavBar.tsx](frontend/src/shared/components/NavBar.tsx#L70) uses `-right-1`; [OrderSuccessPage.tsx](frontend/src/pages/OrderSuccessPage.tsx#L59) uses `text-left`. `text-right`, `ml-*`, `mr-*`, `rounded-l-*`, and `rounded-r-*`: **NOT FOUND**.
- Literal palette utilities: [ProductCard.tsx](frontend/src/shared/components/ProductCard.tsx#L26) uses `gray-*`, `blue-*`, `green-*`; [ProductCatalog.tsx](frontend/src/shared/components/ProductCatalog.tsx#L43) uses `gray-*`/`red-*`; [ProductGrid.tsx](frontend/src/shared/components/ProductGrid.tsx#L10) uses `gray-*`. `bg-white`/`text-white` also occur in [ProductPage.tsx](frontend/src/pages/ProductPage.tsx#L103), [CheckoutPage.tsx](frontend/src/pages/CheckoutPage.tsx#L94), [OrdersPage.tsx](frontend/src/pages/OrdersPage.tsx#L50), [OrderSuccessPage.tsx](frontend/src/pages/OrderSuccessPage.tsx#L97), [CartPage.tsx](frontend/src/shared/components/CartPage.tsx#L37), and [CartSummary.tsx](frontend/src/shared/components/CartSummary.tsx#L46).
- Hex colors are design tokens in [App.css](frontend/src/App.css#L3), lines 3–13; hardcoded `rgb()` shadows are in [App.css](frontend/src/App.css#L69) and [Button.css](frontend/src/shared/components/Button.css#L38), #43, #49, #54.
- RTL/LTR at a glance: Login/Register cards force RTL regardless of language; email inputs and password input have `dir="ltr"`. ProductPage uses physical-left classes; OrderSuccess uses `text-left`. The other pages have no explicit direction handling or language state. A complete RTL/LTR path: **NOT FOUND**.

# 11. UI COMPONENTS

| Component | Purpose | Importer/use |
|---|---|---|
| [AuthCard.tsx](frontend/src/shared/components/AuthCard.tsx#L10) | Authentication form frame | Login, Register |
| [BranchBadge.tsx](frontend/src/shared/components/branch/BranchBadge.tsx#L9) | Selected-branch badge | BranchSelectorTestPage |
| [BranchSelector.tsx](frontend/src/shared/components/branch/BranchSelector.tsx#L10) | Select/default/geolocation controls | BranchSelectorTestPage |
| [Button.tsx](frontend/src/shared/components/Button.tsx#L15) | Variant button | BranchSelector |
| [CartItem.tsx](frontend/src/shared/components/CartItem.tsx#L16) | Cart product quantity/removal row | CartPage |
| [CartPage.tsx](frontend/src/shared/components/CartPage.tsx#L9) | Cart and empty state | App route |
| [CartSummary.tsx](frontend/src/shared/components/CartSummary.tsx#L13) | Cart totals/checkout links | CartPage |
| [Footer.tsx](frontend/src/shared/components/Footer.tsx#L4) | Brand footer | MainLayout |
| [FormError.tsx](frontend/src/shared/components/FormError.tsx#L5) | Alert for form errors | Login, Register |
| [Input.tsx](frontend/src/shared/components/Input.tsx#L4) | Forward-ref input wrapper | No importer found |
| [Label.tsx](frontend/src/shared/components/Label.tsx#L16) | Label/error/hint wrapper | BranchSelector |
| [LanguageSwitcher.tsx](frontend/src/shared/components/LanguageSwitcher.tsx) | Empty file | No importer found |
| [NavBar.tsx](frontend/src/shared/components/NavBar.tsx#L13) | Main navigation/cart count | MainLayout |
| [OrderStatus.tsx](frontend/src/shared/components/OrderStatus.tsx#L23) | Status label | OrdersPage |
| [PasswordField.tsx](frontend/src/shared/components/PasswordField.tsx#L8) | Password field and eye toggle | Login, Register |
| [ProductCard.tsx](frontend/src/shared/components/ProductCard.tsx#L8) | Product summary/add-to-cart | ProductPage; ProductGrid |
| [ProductCatalog.tsx](frontend/src/shared/components/ProductCatalog.tsx#L5) | Alternate direct-fetch catalog | No importer found |
| [ProductGrid.tsx](frontend/src/shared/components/ProductGrid.tsx#L7) | Product card grid | ProductCatalog only |
| [ProtectedRoute.tsx](frontend/src/shared/components/ProtectedRoute.tsx#L19) | Auth/role guard | No route uses it |
| [Select.tsx](frontend/src/shared/components/Select.tsx#L14) | Forward-ref select | BranchSelector |
| [SubmitButton.tsx](frontend/src/shared/components/SubmitButton.tsx#L8) | Loading-aware submit button | Login, Register |
| [TextField.tsx](frontend/src/shared/components/TextField.tsx#L10) | Labeled input/error display | Login, Register |

Pages:
- [BranchSelectorTestPage.tsx](frontend/src/pages/BranchSelectorTestPage.tsx#L82): test UI with inline branches, selector, and selected branch details.
- [CheckoutPage.tsx](frontend/src/pages/CheckoutPage.tsx#L19): shipping and payment form/order review; creates an order.
- [login.tsx](frontend/src/pages/login.tsx#L22): Arabic login form.
- [OrdersPage.tsx](frontend/src/pages/OrdersPage.tsx#L11): locally stored order list.
- [OrderSuccessPage.tsx](frontend/src/pages/OrderSuccessPage.tsx#L10): order summary from navigation state.
- [ProductPage.tsx](frontend/src/pages/ProductPage.tsx#L11): product search/filter/sort catalog.
- [RegisterPage.tsx](frontend/src/pages/RegisterPage.tsx#L26): Arabic registration form.
- `/` index: empty `<div />` placeholder in [App.tsx](frontend/src/App.tsx#L29).

# 12. DASHBOARD

Dashboard page, route, layout, components, stats, and dashboard mock data: **NOT FOUND**. `ProtectedRoute.tsx` contains only documentation examples mentioning `DashboardPage`; `UserRole` defines `admin` and `branchManager`, but no dashboard implementation was found.

# 13. ACCESSIBILITY & QUALITY QUICK CHECK

- Images: product images have `alt={product.title}`; logo images use `alt=""`. `<img>` without an `alt` attribute: **NOT FOUND**.
- Inputs: auth fields use `TextField` labels; checkout inputs are associated with labels; payment radios are inside labels. Product search input has a placeholder but no `<label>` or `aria-label` at [ProductPage.tsx](frontend/src/pages/ProductPage.tsx#L144). Sort select has `aria-label`.
- Icon buttons: cart quantity minus/plus have aria labels; password visibility button has an Arabic aria label. Navbar home/branch/orders visible text is hidden below `sm`; those links have no explicit `aria-label` (cart and brand links do).
- `console.log`, `TODO`, `FIXME`, `@ts-ignore`, and explicit `any` under `frontend/src`: **NOT FOUND**.
- Build passes; lint issue is the `useCart` export in [CartContext.tsx](frontend/src/shared/contexts/CartContext.tsx#L154), as explained in section 8.

# 14. TOP RISKS

1. Branch-specific prices and stock are not used; all product/cart/checkout logic reads top-level values. [cart.ts](frontend/src/shared/types/cart.ts#L19), [ProductCard.tsx](frontend/src/shared/components/ProductCard.tsx#L9), [CartContext.tsx](frontend/src/shared/contexts/CartContext.tsx#L49), [CheckoutPage.tsx](frontend/src/pages/CheckoutPage.tsx#L324).
2. Branch state is isolated to the test page; `branches.json` is not loaded and production routes do not mount `BranchProvider`. [App.tsx](frontend/src/App.tsx#L23), [BranchSelectorTestPage.tsx](frontend/src/pages/BranchSelectorTestPage.tsx#L84).
3. Checkout and orders are public; `ProtectedRoute` is not wired into any route. [App.tsx](frontend/src/App.tsx#L28), [ProtectedRoute.tsx](frontend/src/shared/components/ProtectedRoute.tsx#L19).
4. Orders have no user identifier and the orders page displays the entire shared localStorage list. [order.ts](frontend/src/shared/types/order.ts#L21), [OrdersPage.tsx](frontend/src/pages/OrdersPage.tsx#L11).
5. Auth stores plaintext passwords in localStorage; no seed/default user exists, and registration only creates customer-role users. [authService.ts](frontend/src/shared/services/authService.ts#L10), [authService.ts](frontend/src/shared/services/authService.ts#L67).
6. No active i18n implementation exists; auth strings remain Arabic-only, `i18n/` is empty, and the untracked switcher file is empty. [login.tsx](frontend/src/pages/login.tsx#L55), [RegisterPage.tsx](frontend/src/pages/RegisterPage.tsx#L65).
7. The home route is a blank placeholder; 404, 403, dashboard, and product-detail pages are absent. [App.tsx](frontend/src/App.tsx#L29).
8. Pricing formulas are duplicated and order items have no explicit final unit-price field; product card, checkout, and cart calculations can differ in rounding. [ProductCard.tsx](frontend/src/shared/components/ProductCard.tsx#L9), [CheckoutPage.tsx](frontend/src/pages/CheckoutPage.tsx#L324), [pricing.ts](frontend/src/shared/utils/pricing.ts#L5).
9. `Product` and `StoreProduct` diverge, while actual product JSON has no `name`; the legacy catalog consumes the other model. [Product.ts](frontend/src/shared/types/Product.ts#L1), [cart.ts](frontend/src/shared/types/cart.ts#L7), [ProductCatalog.tsx](frontend/src/shared/components/ProductCatalog.tsx#L6).
10. Full lint fails on `CartContext.tsx` because the component provider and non-component hook are exported from the same file. [CartContext.tsx](frontend/src/shared/contexts/CartContext.tsx#L154).
