# API CONTRACT — The Crown & Anchor

**Status:** v2 — updated after the team decided to rebuild the backend from scratch.
**Rule:** This file + `frontend/src/shared/types/` are the single source of truth.
If backend and frontend disagree, fix one of them — never let them drift.

Backend stack: NestJS + MongoDB (Mongoose). Base path: `/api`.
The old `backend/` folder is NOT used. Keep it only as a reference (`backend-old`).

---

## 0. Conventions (read first)

### IDs

| Entity | ID type | Notes |
|---|---|---|
| Product | `string` | Mongo `_id` serialized as string. (Changed from number in v1.) |
| Branch | `string` slug (e.g. `"damascus"`) | Unique `id` field on the branch. Stable and human-readable. |
| User | `string` | Mongo `_id`. |
| Order | `string` | Mongo `_id` in v1. A human-readable `orderNumber` (`ORD-2026-000123`) is a nice-to-have for later (needs a counters collection with atomic `$inc`). **Never** `ORD-${Date.now()}`. |
| Review | `string` | Mongo `_id`. |

Product ids appear as `productId: string` in order items and reviews.

### Response shapes

- **Single entity** (GET by id, POST, PATCH): returned directly. **No** `{ success, data }` envelope.
- **Lists**: always `{ items: T[], total: number, page: number, limit: number }`.
- **Deletes**: `204 No Content`.
- **Auth**: `Authorization: Bearer <jwt>`. Token payload: `{ sub: userId, role, branchId? }`.
- **Money**: USD, numbers rounded to 2 decimals **by the server**.
- **Dates**: ISO 8601 strings.

### Errors

Shape: `{ statusCode: number, message: string | string[], code?: string }`.
`message` may be an array (validation errors). The frontend decides behavior by `code`, never by message text.

| code | HTTP | When |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Invalid body/query |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password (generic message) |
| `UNAUTHORIZED` | 401 | Missing/expired/invalid token |
| `FORBIDDEN` | 403 | Role or branch scope not allowed |
| `NOT_FOUND` | 404 | Entity does not exist |
| `EMAIL_TAKEN` | 409 | Register with an existing email |
| `REVIEW_EXISTS` | 409 | (only if upsert is not used) second review for same product |
| `INSUFFICIENT_STOCK` | 409 | Not enough stock in the branch. Include `details: [{ productId, available }]` |
| `BRANCH_CLOSED` | 409 | Order for a closed branch |
| `INVALID_TRANSITION` | 400 | Status change not allowed by the flow |

### Who can call what

| Role | Meaning |
|---|---|
| `public` | No token needed |
| `customer` | Logged-in user with role `customer` |
| `branchManager` | Has `branchId` in the JWT; **can only touch their own branch's data** |
| `admin` | Full access |

**Scoping rule:** a branchManager's `branchId` ALWAYS comes from the JWT, never from the body or query. Guards check the role; services must ALSO filter by `user.branchId`.

### Environment variables (`.env.example`)

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/crown-anchor
JWT_SECRET=change-me
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

---

## 1. Auth — `/api/auth`

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | public | Create customer account |
| POST | `/auth/login` | public | Login, returns JWT |
| GET | `/auth/me` | authenticated | Current user |

### POST /auth/register
```jsonc
// request
{ "name": "Reham", "email": "reham@x.com", "password": "min8chars" }
// 201
{ "id": "665f...", "name": "Reham", "email": "reham@x.com", "role": "customer", "token": "eyJ..." }
```
Rules: email unique + lowercased; password 8–72 chars, hashed with bcrypt.
**Role is always `customer`.** Any `role` or `branchId` sent by the client is ignored.

### POST /auth/login
```jsonc
{ "email": "reham@x.com", "password": "min8chars" }
// 200 — branchManager also includes branchId
{ "id": "...", "name": "...", "email": "...", "role": "branchManager", "branchId": "damascus", "token": "eyJ..." }
```
Errors: `401 INVALID_CREDENTIALS`.

### GET /auth/me
Returns `{ id, name, email, role, branchId? }` (no token, no password).

Staff accounts (admin, branchManagers) are created by the **seed script only** in v1.

---

## 2. Branches — `/api/branches`

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/branches` | public | List all branches |
| PATCH | `/branches/:id/status` | admin | Set open/closed |

### Branch object
```ts
{
  id: string;                         // "damascus"
  name: string;
  code?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
  operationalStatus: "open" | "closed"   // default "open"
}
```
`GET /branches` returns `{ items, total, page, limit }`.

### PATCH /branches/:id/status
```jsonc
{ "operationalStatus": "closed" }   // 200 → updated Branch
```
A closed branch cannot receive orders (`POST /orders` → `409 BRANCH_CLOSED`). The frontend also disables checkout, but the server is the real guard.

---

## 3. Products — `/api/products`

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/products` | public | List with filters/sort |
| GET | `/products/:id` | public | Detail |
| POST | `/products` | admin | Create |
| PATCH | `/products/:id` | admin | Update catalog fields only |
| DELETE | `/products/:id` | admin | Delete |
| PATCH | `/products/:id/stock` | admin / branchManager* | Set stock for one branch |
| PATCH | `/products/:id/branch-price` | admin | Set a branch-specific price |

*branchManager can only change their own branch.

### GET /products — query params
```
?search=phone&category=smartphones&branchId=damascus&sort=price-low&page=1&limit=40
```
- `search`: case-insensitive match on title, brand, description
- `category`: exact match
- `branchId`: if given, `price` and `stock` in each item reflect that branch
- `sort`: `default` | `price-low` | `price-high` | `rating`
- `limit`: default 40, max 100 (clients page through results with `page`; they never assume everything fits in one response)
- `stockStatus`: `in` | `low` | `out` — requires `branchId` (otherwise `400 VALIDATION_ERROR`); filters by that branch's stock (`low` = 0 < stock <= 5, `out` = 0, `in` = > 0). Used by the inventory dashboards.

### Product object
```ts
{
  id: string;
  title: string;
  description: string;
  category: string;                 // free-text slug, no categories collection
  brand: string;
  price: number;                    // base price, fallback when a branch has no entry
  discountPercentage: number;       // 0–100
  rating: number;                   // server-computed average, 0 if no reviews
  reviewCount: number;              // server-computed
  thumbnail: string;
  images: string[];
  stock: number;                    // COMPUTED on read = sum(branchInventory[].stock)
  branchInventory: { branchId: string; price: number; stock: number }[]
}
```
**`stock` is not stored.** The server computes it when serializing, so it can never drift from `branchInventory`.
Final price shown to the customer = `(branchInventory price ?? product.price) × (1 − discountPercentage/100)`, rounded to 2 decimals by the server.

### POST /products (admin)
```jsonc
{ "title": "...", "description": "...", "category": "...", "brand": "...",
  "price": 49.99, "discountPercentage": 10, "thumbnail": "https://...",
  "images": ["https://..."],
  "branchInventory": [{ "branchId": "damascus", "price": 49.99, "stock": 20 }] }
```
`rating`, `reviewCount`, `stock`, `id` are server-controlled and rejected/ignored if sent.

### PATCH /products/:id (admin)
Only catalog fields: `title, description, category, brand, price, discountPercentage, thumbnail, images`.
`branchInventory`, `stock`, `rating`, `reviewCount` are **rejected** here (`400 VALIDATION_ERROR`). Stock changes only via `/stock`, branch prices only via `/branch-price`.

### PATCH /products/:id/stock
```jsonc
// branchManager's branchId comes from the JWT; the body branchId is only used by admin
{ "branchId": "damascus", "stock": 15 }
// 200 → updated Product
```
Rules: `stock` integer ≥ 0. If the branch has no entry yet, create it (price defaults to product.price).
Implementation: a single `updateOne` with `arrayFilters` (or `$push` when missing). No read-then-write.

### PATCH /products/:id/branch-price (admin)
```jsonc
{ "branchId": "damascus", "price": 54.99 }   // 200 → updated Product
```

### Atomic stock decrement (used by orders)
```js
Product.findOneAndUpdate(
  { _id: productId, branchInventory: { $elemMatch: { branchId, stock: { $gte: quantity } } } },
  { $inc: { "branchInventory.$.stock": -quantity } },
  { new: true }
)
// null → not enough stock → INSUFFICIENT_STOCK
```

---

## 4. Orders — `/api/orders`

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/orders` | customer | Create order from cart |
| GET | `/orders` | customer → own; branchManager → own branch; admin → all | List |
| GET | `/orders/:id` | owner / branchManager of that branch / admin | Detail |
| PATCH | `/orders/:id/status` | admin / branchManager* | Change status |

*branchManager only if `order.branch.id === user.branchId`, else `403 FORBIDDEN`.

Login is required for `POST /orders`. There is no guest checkout.

### POST /orders — request
```jsonc
{
  "branchId": "damascus",
  "items": [ { "productId": "665f...", "quantity": 2 } ],
  "shippingAddress": {
    "fullName": "Reham", "phone": "+963...", "city": "Damascus",
    "street": "...", "building": "...", "notes": "..."
  },
  "paymentMethod": "cash"           // "cash" | "card" (card is a demo, no gateway)
}
```
Validation: `items` non-empty, no duplicate productIds, `quantity` integer 1–99, `fullName/phone/city/street` required, `building/notes` optional.

**The client sends only ids and quantities.** The server MUST:
1. Load the branch; if `operationalStatus === "closed"` → `409 BRANCH_CLOSED`.
2. Load each product and the branch's inventory entry; recompute unit price, `subtotal`, `deliveryFee` ($5 flat when items exist), `total`.
3. For each item, decrement stock atomically (see §3).
4. **If any item fails midway, restore the stock of the items already decremented** (compensation), then return `409 INSUFFICIENT_STOCK` with `details`.
5. Create the order with `status: "pending"`, `userId` from the JWT, and a snapshot of the branch `{id, name}` and of each item (title, thumbnail, category, unitPrice).
6. Store `branchId` as a direct indexed field on the order too (used by reports).

### Order object
```ts
{
  id: string;
  userId: string;
  items: { productId: string; title: string; thumbnail: string; category: string; unitPrice: number; quantity: number }[];
  branch: { id: string; name: string };
  shippingAddress: { fullName: string; phone: string; city: string; street: string; building?: string; notes?: string };
  paymentMethod: "cash" | "card";
  subtotal: number; deliveryFee: number; total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string; updatedAt?: string
}
```

### GET /orders
Query: `?status=&page=1&limit=20`. Sorted newest first. Scoping is enforced by the server:
- `customer` → `{ userId: req.user.id }`
- `branchManager` → `{ "branch.id": req.user.branchId }`
- `admin` → all

### PATCH /orders/:id/status
```jsonc
{ "status": "processing" }
```
**Allowed transitions:**

| From | To |
|---|---|
| `pending` | `processing`, `cancelled` |
| `processing` | `shipped`, `cancelled` |
| `shipped` | `delivered` |
| `delivered`, `cancelled` | (final, nothing) |

Anything else → `400 INVALID_TRANSITION`.
**When an order becomes `cancelled`, the server returns the quantities to the branch stock** (`$inc` +quantity per item). The status change itself must be conditional (`findOneAndUpdate` with `status: <expected previous>`) so a double-cancel cannot restore stock twice.
Customers cannot cancel in v1 (staff only).

---

## 5. Reviews

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/products/:id/reviews` | public | Paginated list, newest first |
| POST | `/products/:id/reviews` | customer | Create **or update** own review (upsert) |
| DELETE | `/reviews/:id` | author / admin | Delete |

### Review object
```ts
{ id: string; productId: string; userId: string; userName: string;
  rating: number; comment?: string; createdAt: string; updatedAt?: string }
```

### POST /products/:id/reviews
```jsonc
{ "rating": 5, "comment": "Great phone" }   // 200/201 → Review
```
- `rating` integer 1–5 required; `comment` optional, max 500 chars.
- One review per user per product (unique index `{ productId, userId }`). A second POST from the same user **updates** the existing review (upsert), so there is no separate PATCH and no `409`.
- On create, update and delete the server **recomputes** `product.rating` and `product.reviewCount`.

`GET /products/:id` does NOT embed reviews. The frontend calls `GET /products/:id/reviews` separately.
Any logged-in customer may review in v1 (no verified-purchase check).

---

## 6. Reports — `/api/reports` (NEW)

The backend computes all dashboard numbers (Mongo aggregation). The frontend only displays them.

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/reports/summary` | admin | All branches; optional `?branchId=` |
| GET | `/reports/branch` | branchManager | Own branch (from JWT) |

Both return the same shape:
```ts
{
  totalOrders: number;                              // ALL orders, including cancelled (revenue and averageOrderValue exclude cancelled)
  revenue: number;                                  // sum of totals of orders with status != "cancelled"
  averageOrderValue: number;                        // revenue / number of non-cancelled orders
  outOfStockCount: number;                          // products with stock 0 (in the branch; in summary: branch/product pairs)
  ordersByStatus: Record<"pending"|"processing"|"shipped"|"delivered"|"cancelled", number>;
  lowStockProducts: { productId: string; title: string; branchId: string; stock: number }[]; // stock <= 5 (includes 0), lowest stock first, max 20 items
  topProducts: { productId: string; title: string; quantitySold: number }[];                  // top 5, non-cancelled
  salesByDay: { date: string; orders: number; revenue: number }[]                             // last 30 days
  salesByCategory: { category: string; quantitySold: number; revenue: number }[];             // non-cancelled, sorted by revenue desc
  recentOrders: Order[]                                                                       // last 5 orders (same Order object as §4)
}
```
`/reports/branch` also includes `branch: { id: string; name: string }`.
`/reports/summary` without `branchId` also includes `byBranch: { branchId: string; totalOrders: number; revenue: number }[]`.

---

## 7. Permissions summary

| Endpoint | public | customer | branchManager | admin |
|---|---|---|---|---|
| POST /auth/register, /auth/login | ✔ | | | |
| GET /auth/me | | ✔ | ✔ | ✔ |
| GET /branches | ✔ | ✔ | ✔ | ✔ |
| PATCH /branches/:id/status | | | | ✔ |
| GET /products, /products/:id, reviews list | ✔ | ✔ | ✔ | ✔ |
| POST/PATCH/DELETE /products, branch-price | | | | ✔ |
| PATCH /products/:id/stock | | | own branch | ✔ |
| POST /orders | | ✔ | | |
| GET /orders, /orders/:id | | own | own branch | all |
| PATCH /orders/:id/status | | | own branch | ✔ |
| POST /products/:id/reviews | | ✔ | | |
| DELETE /reviews/:id | | own | | ✔ |
| GET /reports/summary | | | | ✔ |
| GET /reports/branch | | | ✔ | |

---

## 8. Build plan (4 developers)

**Phase 0 — one person, ~1 day (everyone else reads this contract and the frontend types)**
- [ ] NestJS skeleton: `/api` prefix, Mongo connection, `ConfigModule` with env validation, CORS, global `ValidationPipe`, global exception filter that adds `code`, `.env.example`
- [ ] `common/`: `JwtAuthGuard`, `RolesGuard`, `@CurrentUser()`, `@Roles()`
- [ ] Push to the repo so the others can branch from it

**Phase 1**
- [ ] **Dev A:** `auth` + `users` (bcrypt, JWT, `/auth/me`) + seed script (1 admin, 1 manager per branch, sample customers, 3 branches, 40 products from the mock JSON)
- Until auth merges, the others use a temporary guard that injects a fake user.

**Phase 2 (parallel, one module per developer, one branch per module)**
- [ ] **Dev B:** `branches` + `products` (list/detail/CRUD, stock, branch-price)
- [ ] **Dev C:** `orders` (create with recompute + atomic decrement + compensation, scoped list, status flow, stock restore on cancel), then `reports`
- [ ] **Dev D:** `reviews` (upsert, rating recompute), then connecting the frontend API layer to the real endpoints

**Phase 3 — Integration**
- [ ] Turn off the mock switch (`VITE_USE_MOCK=false`), wire dashboards to the real endpoints
- [ ] End-to-end: register → browse → cart → login at checkout → order → manager updates status → customer sees it → cancel restores stock

---

## 9. Decisions log (resolved)

1. Guest checkout: **no**. Login required at checkout; guests can still browse and keep a localStorage cart.
2. Product id: **string** (`_id`).
3. Staff accounts: **seed only** in v1.
4. Status flow: **enforced** (see §4).
5. Closed branch: **rejects orders** (`BRANCH_CLOSED`).
6. Reviews: any logged-in customer, one per product (upsert).
7. Delivery fee: **flat $5**.
8. Currency: **USD**.
9. Revenue = all orders except `cancelled`.
10. Concurrency: **no Mongo transactions**; atomic `findOneAndUpdate` + compensation.
11. Semantic search: **removed**; plain `?search=` in the API.
12. Categories: plain string field, no collection.
13. No `GET /inventory` endpoint: the inventory dashboards use `GET /products?branchId=<id>&page=&limit=&search=&category=&stockStatus=` with real pagination (the catalog will grow beyond 100 products). The storefront also pages and filters server-side.
14. No `PATCH /reviews/:id`: the frontend always calls `POST /products/:id/reviews` (create or update, upsert).
15. Dashboards display the values returned by `/reports/*` and never recompute stats from orders/products on the client.
16. Lists always use `{ items, total, page, limit }` (never a bare array).
17. Order items snapshot `category` too, so `salesByCategory` is a plain aggregation on orders (no join with products).
18. `lowStockProducts` includes items with stock 0, so out-of-stock products appear in the alerts table; `outOfStockCount` stays as a separate number.
19. Counting rule everywhere (top level and `byBranch`): `totalOrders` counts all orders; `revenue` and `averageOrderValue` exclude `cancelled`.
20. `GET /branches` returns all branches inside the list envelope (no pagination params needed).
21. Card payments are a demo only (no payment provider in v1).

## 10. Still open (decide before the related module starts)

- `orderNumber` (`ORD-YYYY-NNNNNN`) now or later? (Needs a counters collection.)
- Can a customer cancel their own `pending` order? (v1: no.)
- Can a branchManager change branch-specific prices? (v1: no, admin only.)
- Low-stock threshold (v1: 5).
