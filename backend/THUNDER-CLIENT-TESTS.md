# Mini Store API - Thunder Client Walkthrough

This is a manual, end-to-end walkthrough for testing the Mini Store API in
Thunder Client. Follow the numbered steps in order because later requests use
IDs and stock created in earlier steps.

> **Use a disposable database.** These requests create, update, and soft-delete
> data. Order placement and status changes use MongoDB transactions, so the
> `MONGODB_URI` must connect to a replica set (a single-node local replica set
> is fine; a standalone MongoDB server is not).
> Run the [default branch backfill](./README.md#multi-branch-operations) before
> using a database that contains records from the previous single-branch API.

## 1. Start the API and prepare Thunder Client

1. Start MongoDB with the replica set configured.
2. In a terminal, start the Nest app from the `store` project:

   ```powershell
   npm run start:dev
   ```

3. Wait until Nest logs that the app is listening. The examples below assume
   the server is at `http://localhost:3000`.
4. In VS Code, open **Thunder Client** from the Activity Bar.
5. Select **Env**, create a new environment named `Mini Store Local`, then add
   the following variables:

   | Variable | Initial value |
   |---|---|
   | `baseUrl` | `http://localhost:3000/api` |
   | `adminKey` | Copy the value of `ADMIN_API_KEY` from your local `.env` |
   | `staffKey` | Copy the value of `STAFF_API_KEY` from your local `.env` |
   | `categoryId` | *(leave blank)* |
   | `branchId` | *(leave blank)* |
   | `productId` | *(leave blank)* |
   | `product2Id` | *(leave blank)* |
   | `orderId` | *(leave blank)* |
   | `cancelOrderId` | *(leave blank)* |
   | `customerEmail` | `buyer@example.com` |

6. Select `Mini Store Local` as the active environment.
7. For each request below, create a new request, select its HTTP method, enter
   the URL, then use **Headers** and **Body** as specified.
8. For JSON requests, choose **Body → JSON** and send
   `Content-Type: application/json`. Add the API key header only when a step
   requires it:
   - Admin: `x-api-key` = `{{adminKey}}`
   - Staff: `x-api-key` = `{{staffKey}}`
   - Visitor/public: do not send `x-api-key`

Thunder Client substitutes `{{variableName}}` with the active environment
value. Save each request if you want to rerun it later.

## 2. How to capture generated IDs

After a create request succeeds:

1. Read the response JSON in Thunder Client.
2. Find the Mongo ID at `data._id`.
3. Open **Env → Mini Store Local** and paste that value into the named variable.
4. Save the environment.

For list responses, product/order pagination returns records in `data` and
pagination information in `meta`. Individual create responses use `data._id`.
Branch-specific product requests include `branchId` in the query string;
order creation/status requests include it in the JSON body, and order list
and detail requests include it in the query string.

## 3. Run the endpoint tests

### Step 0 — Create a branch

- Method: **POST**
- URL: `{{baseUrl}}/branches`
- API key: admin
- Body → JSON:

  ```json
  {
    "name": "Downtown",
    "code": "downtown",
    "address": "10 Main Street"
  }
  ```

Expected: **201 Created**. Copy `data._id` into `branchId`. Branch codes are
unique and case-insensitive. Use `GET {{baseUrl}}/branches` with the staff key
to list active branches.

### Step 1 — Browse categories publicly

- Method: **GET**
- URL: `{{baseUrl}}/categories`
- API key: none
- Body: none
- Send the request.

Expected: **200 OK**. The response is a success envelope; each category has an
`activeProductCount`. An empty list is fine for a new database.

### Step 2 — Create a category

- Method: **POST**
- URL: `{{baseUrl}}/categories`
- API key: admin
- Body → JSON:

  ```json
  {
    "name": "Keyboards"
  }
  ```

Expected: **201 Created**. Copy `data._id` into `categoryId`.

### Step 3 — Rename the category

- Method: **PATCH**
- URL: `{{baseUrl}}/categories/{{categoryId}}`
- API key: admin
- Body → JSON:

  ```json
  {
    "name": "Keyboards and Keypads"
  }
  ```

Expected: **200 OK** and the updated name in `data`.

### Step 4 — Read the category

- Method: **GET**
- URL: `{{baseUrl}}/categories/{{categoryId}}`
- API key: none
- Body: none

Expected: **200 OK** and the renamed category.

### Step 5 — Create the first product

- Method: **POST**
- URL: `{{baseUrl}}/products`
- API key: admin
- Body → JSON:

  ```json
  {
    "name": "Mechanical Keyboard",
    "sku": "KB-MECH-001",
    "description": "Compact wired mechanical keyboard",
    "price": 79.99,
    "stock": 5,
    "branchId": "{{branchId}}",
    "categoryId": "{{categoryId}}"
  }
  ```

Expected: **201 Created**. Copy `data._id` into `productId`.

### Step 6 — Create a second product

- Method: **POST**
- URL: `{{baseUrl}}/products`
- API key: admin
- Body → JSON:

  ```json
  {
    "name": "USB-C Keypad",
    "sku": "KP-USBC-001",
    "description": "Small numeric keypad",
    "price": 24.5,
    "stock": 2,
    "branchId": "{{branchId}}",
    "categoryId": "{{categoryId}}"
  }
  ```

Expected: **201 Created**. Copy `data._id` into `product2Id`.

### Step 7 — Browse products with search, filters, sort, and pagination

- Method: **GET**
- URL:
  `{{baseUrl}}/products?branchId={{branchId}}&search=keyboard&categoryId={{categoryId}}&minPrice=20&maxPrice=100&sort=price_asc&page=1&limit=10`
- API key: none
- Body: none

Expected: **200 OK**, with a matching product in `data` and paging information
in `meta`.

Try changing `search` to `keypad`, `sort` to `price_desc`, or `page` to `2`.
Supported sort values are `newest`, `oldest`, `name_asc`, `name_desc`,
`price_asc`, `price_desc`, `stock_asc`, and `stock_desc`. You can use
`category={{categoryId}}` instead of `categoryId`.

### Step 8 — Read one product

- Method: **GET**
- URL: `{{baseUrl}}/products/{{productId}}?branchId={{branchId}}`
- API key: none
- Body: none

Expected: **200 OK** and the first product.

### Step 9 — Update product details

- Method: **PATCH**
- URL: `{{baseUrl}}/products/{{productId}}?branchId={{branchId}}`
- API key: admin
- Body → JSON:

  ```json
  {
    "description": "Updated keyboard description",
    "price": 82.5
  }
  ```

Expected: **200 OK**. The API does not allow stock or active-state updates
through this endpoint; use the stock route for inventory changes.

### Step 10 — Add stock

- Method: **PATCH**
- URL: `{{baseUrl}}/products/{{productId}}/stock?branchId={{branchId}}`
- API key: admin
- Body → JSON:

  ```json
  {
    "delta": 3
  }
  ```

Expected: **200 OK**; stock changes from 5 to 8. Inventory adjustment is
atomic.

### Step 11 — Check low-stock products as staff

- Method: **GET**
- URL: `{{baseUrl}}/products/low-stock?branchId={{branchId}}&threshold=10`
- API key: staff
- Body: none

Expected: **200 OK**. Active products with stock less than or equal to 10
appear, sorted by stock ascending. The low-stock threshold must be an integer
between 0 and 1,000,000. Repeat with an admin key if desired.

### Step 12 — Place an order as a visitor

- Method: **POST**
- URL: `{{baseUrl}}/orders`
- API key: none
- Body → JSON:

  ```json
  {
    "branchId": "{{branchId}}",
    "customerEmail": "{{customerEmail}}",
    "items": [
      {
        "productId": "{{productId}}",
        "quantity": 2
      },
      {
        "productId": "{{product2Id}}",
        "quantity": 1
      }
    ]
  }
  ```

Expected: **201 Created**. Save `data._id` as `orderId`. The order starts with
`pending` status. Product stock decreases to 6 for the keyboard and 1 for the
keypad.

The client sends no prices or total: the server reads current product prices
from the database. With the values in this guide, the total is
`2 × 82.50 + 1 × 24.50 = 189.50`.

### Step 13 — Track the order with the matching email

- Method: **GET**
- URL: `{{baseUrl}}/orders/{{orderId}}?branchId={{branchId}}&email={{customerEmail}}`
- API key: none
- Body: none

Expected: **200 OK**. Try changing the query email to
`someoneelse@example.com`; expected: **403 Forbidden**.

### Step 14 — List and filter orders as staff

- Method: **GET**
- URL:
  `{{baseUrl}}/orders?branchId={{branchId}}&status=pending&customerEmail={{customerEmail}}&page=1&limit=20`
- API key: staff
- Body: none

Expected: **200 OK**, matching order(s) in `data` and pagination details in
`meta`. Repeat with the admin key if desired.

### Step 15 — Mark the order paid

- Method: **PATCH**
- URL: `{{baseUrl}}/orders/{{orderId}}/status`
- API key: staff
- Body → JSON:

  ```json
  {
    "branchId": "{{branchId}}",
    "status": "paid"
  }
  ```

Expected: **200 OK**, with status `paid` and a new history entry.

### Step 16 — Ship the order

- Method: **PATCH**
- URL: `{{baseUrl}}/orders/{{orderId}}/status`
- API key: staff
- Body → JSON:

  ```json
  {
    "branchId": "{{branchId}}",
    "status": "shipped"
  }
  ```

Expected: **200 OK**, with status `shipped` and another history entry.

### Step 17 — Deliver the order

- Method: **PATCH**
- URL: `{{baseUrl}}/orders/{{orderId}}/status`
- API key: staff
- Body → JSON:

  ```json
  {
    "branchId": "{{branchId}}",
    "status": "delivered"
  }
  ```

Expected: **200 OK**, with status `delivered`.

### Step 18 — Verify invalid/repeated status behavior

1. Repeat the status request from Step 17 with `"status": "delivered"`.
   Expected: **200 OK** and no extra duplicate history entry.
2. Try changing the delivered order to `"status": "shipped"`.
   Expected: **400 Bad Request** because backwards transitions are not allowed.
3. Try sending `"status": "refunded"`.
   Expected: **400 Bad Request** because it is not a valid status.

### Step 19 — Create a separate order for the cancellation test

- Method: **POST**
- URL: `{{baseUrl}}/orders`
- API key: none
- Body → JSON:

  ```json
  {
    "branchId": "{{branchId}}",
    "customerEmail": "{{customerEmail}}",
    "items": [
      {
        "productId": "{{productId}}",
        "quantity": 1
      }
    ]
  }
  ```

Expected: **201 Created**. Save `data._id` as `cancelOrderId`. The keyboard
stock decreases from 6 to 5.

### Step 20 — Mark the cancellation-test order paid

- Method: **PATCH**
- URL: `{{baseUrl}}/orders/{{cancelOrderId}}/status`
- API key: staff
- Body → JSON:

  ```json
  {
    "branchId": "{{branchId}}",
    "status": "paid"
  }
  ```

Expected: **200 OK**.

### Step 21 — Cancel the paid order as admin

- Method: **PATCH**
- URL: `{{baseUrl}}/orders/{{cancelOrderId}}/status`
- API key: admin
- Body → JSON:

  ```json
  {
    "branchId": "{{branchId}}",
    "status": "cancelled"
  }
  ```

Expected: **200 OK**, status `cancelled`; product stock is restored from 5 to
6. Retry cancellation with the staff key to verify it returns **403 Forbidden**.
Cancellation of an order that is not paid should return **400 Bad Request**.

### Step 22 — Confirm category cannot be deleted while active products use it

At this point both products are still active and reference the category.

- Method: **DELETE**
- URL: `{{baseUrl}}/categories/{{categoryId}}`
- API key: admin
- Body: none

Expected: **409 Conflict** because active products still use the category.

### Step 23 — Soft-delete the first product

- Method: **DELETE**
- URL: `{{baseUrl}}/products/{{productId}}?branchId={{branchId}}`
- API key: admin
- Body: none

Expected: **200 OK**. The product becomes inactive and should no longer appear
in public browse or low-stock results.

### Step 24 — Soft-delete the second product

- Method: **DELETE**
- URL: `{{baseUrl}}/products/{{product2Id}}?branchId={{branchId}}`
- API key: admin
- Body: none

Expected: **200 OK**.

### Step 25 — Delete the now-unused category

- Method: **DELETE**
- URL: `{{baseUrl}}/categories/{{categoryId}}`
- API key: admin
- Body: none

Expected: **200 OK** because no active product uses the category.

## Additional validation checks

Run these checks while the test records still exist:

| What to try | Request detail | Expected |
|---|---|---|
| Missing API key for admin-only write | Repeat category create without `x-api-key` | `401 Unauthorized` |
| Staff key on admin-only write | Repeat category create with staff key | `403 Forbidden` |
| No key on staff-only endpoint | `GET /products/low-stock` without key | `401 Unauthorized` |
| Invalid product sort | `GET /products?sort=some_field` | `400 Bad Request` |
| Invalid pagination | `GET /products?page=0` or `?limit=101` | `400 Bad Request` |
| Inverted price range | `GET /products?minPrice=100&maxPrice=10` | `400 Bad Request` |
| Invalid order filter | `GET /orders?status=unknown` with staff key | `400 Bad Request` |
| Overdraw product stock | Stock route with a negative delta larger than stock | `409 Conflict` |
| Zero stock adjustment | Stock route with `{"delta":0}` | `400 Bad Request` |
| Client attempts to provide order price | Add `unitPrice` or `total` to order body | `400 Bad Request` (unknown fields rejected) |

## Checking responses

- Successful responses have `success: true` and `data`. Paginated responses
  also have top-level `meta`.
- Error responses have `success: false`, `statusCode`, `message`, `path`,
  `requestId`, and `timestamp`.
- Check the response headers for `X-Request-Id`.
- A missing key on a protected route should produce **401**; a valid key for
  the wrong role should produce **403**.
