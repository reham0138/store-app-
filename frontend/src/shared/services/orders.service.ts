import type { Order, OrderStatus, PaymentMethod, ShippingAddress } from "../types/order";
import { ORDER_STATUS_FLOW } from "../types/order";
import type { User } from "../types/auth";
import { apiClient, USE_MOCK, ApiError, normalizeError } from "../api/index.ts";
import {
  getOrders as getStoredOrders,
  saveOrder,
  getOrderById,
  updateOrderStatusLocal,
} from "../utils/orderStorage";
import { getProducts } from "./product.service";
import { saveProducts } from "../utils/productStorage";
import { getProductPrice } from "../utils/pricing";
import { authService } from "./authService";
import type { StoreProduct } from "../types/cart";

export interface CreateOrderInput {
  branchId: string;
  items: { productId: string; quantity: number }[];
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
}

export interface OrderQuery {
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

export interface OrderListResponse {
  items: Order[];
  total: number;
  page: number;
  limit: number;
}

const DELIVERY_FEE = 5;
const MAX_PAGE_LIMIT = 100;

function scopeOrdersForUser(orders: Order[], user: User | null): Order[] {
  if (!user) return [];
  if (user.role === "admin") return orders;
  if (user.role === "branchManager") {
    return orders.filter((order) => (order.branchId ?? order.branch?.id) === user.branchId);
  }
  return orders.filter((order) => order.userId === user.id);
}

function canSeeOrder(order: Order, user: User | null): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role === "branchManager") return orderBranchId(order) === user.branchId;
  return order.userId === user.id;
}

function orderBranchId(order: Order): string | undefined {
  return order.branchId ?? order.branch?.id;
}

function assertValidTransition(from: OrderStatus, to: OrderStatus): void {
  if (!ORDER_STATUS_FLOW[from].includes(to)) {
    throw new ApiError(
      `Cannot move an order from "${from}" to "${to}".`,
      "INVALID_TRANSITION",
      400,
    );
  }
}

// ---------- Mock implementation ----------

async function mockCreateOrder(input: CreateOrderInput): Promise<Order> {
  const user = authService.getCurrentUser();
  if (!user) {
    throw new ApiError("You must be logged in to place an order.", "UNAUTHORIZED", 401);
  }

  // Contract validation: non-empty items, no duplicate productIds, qty 1-99.
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new ApiError("Order must contain at least one item.", "VALIDATION_ERROR", 400);
  }
  const seen = new Set<string>();
  for (const line of input.items) {
    if (seen.has(line.productId)) {
      throw new ApiError("Duplicate product in order items.", "VALIDATION_ERROR", 400);
    }
    seen.add(line.productId);
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) {
      throw new ApiError("Quantity must be an integer between 1 and 99.", "VALIDATION_ERROR", 400);
    }
  }
  const addr = input.shippingAddress;
  if (!addr?.fullName?.trim() || !addr?.phone?.trim() || !addr?.city?.trim() || !addr?.street?.trim()) {
    throw new ApiError("Shipping address is incomplete.", "VALIDATION_ERROR", 400);
  }

  const { getBranches } = await import("./branches.service");
  const branches = await getBranches();
  const branch = branches.find((b) => b.id === input.branchId);
  if (!branch) throw new ApiError("Branch not found.", "NOT_FOUND", 404);
  if (branch.operationalStatus === "closed") {
    throw new ApiError(
      `Branch "${branch.name}" is currently closed.`,
      "BRANCH_CLOSED",
      409,
    );
  }

  const products = await getProducts({ limit: 100 });
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Pre-check ALL items first so the error can carry details for every
  // insufficient product, like the API's INSUFFICIENT_STOCK response.
  const insufficient: { productId: string; available: number }[] = [];
  const resolved: { product: StoreProduct; quantity: number; unitPrice: number }[] = [];
  let subtotal = 0;

  for (const line of input.items) {
    const product = productMap.get(line.productId);
    if (!product) {
      throw new ApiError(`Product ${line.productId} not found.`, "NOT_FOUND", 404);
    }
    const branchStock =
      product.branchInventory?.find((i) => i.branchId === input.branchId)?.stock ??
      0;
    if (branchStock < line.quantity) {
      insufficient.push({ productId: product.id, available: branchStock });
      continue;
    }
    const unitPrice = getProductPrice(product, input.branchId);
    subtotal += unitPrice * line.quantity;
    resolved.push({ product, quantity: line.quantity, unitPrice });
  }

  if (insufficient.length > 0) {
    const titles = insufficient
      .map((i) => productMap.get(i.productId)?.title ?? i.productId)
      .join(", ");
    throw new ApiError(
      `Not enough stock for: ${titles}.`,
      "INSUFFICIENT_STOCK",
      409,
      insufficient,
    );
  }

  // Decrement branch stock once for all items (mock fidelity).
  try {
    const { decrementBranchStock } = await import("../utils/productStorage");
    let nextProducts = await getProducts({ limit: 100 });
    for (const line of input.items) {
      nextProducts = decrementBranchStock(nextProducts, line.productId, input.branchId, line.quantity);
    }
    saveProducts(nextProducts);
  } catch {
    // mock stock drift is acceptable
  }

  const orderItems = resolved.map(({ product, quantity, unitPrice }) => ({
    productId: product.id,
    title: product.title,
    thumbnail: product.thumbnail,
    category: product.category,
    unitPrice,
    quantity,
  }));

  const deliveryFee = orderItems.length > 0 ? DELIVERY_FEE : 0;
  const order: Order = {
    // Mongo _id-style string in v1 — never ORD-${Date.now()}.
    id: crypto.randomUUID(),
    userId: user.id,
    items: orderItems,
    branch: { id: branch.id, name: branch.name },
    branchId: branch.id,
    shippingAddress: {
      fullName: addr.fullName.trim(),
      phone: addr.phone.trim(),
      city: addr.city.trim(),
      street: addr.street.trim(),
      building: addr.building?.trim() || undefined,
      notes: addr.notes?.trim() || undefined,
    },
    paymentMethod: input.paymentMethod,
    subtotal: Math.round(subtotal * 100) / 100,
    deliveryFee,
    total: Math.round((subtotal + deliveryFee) * 100) / 100,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  saveOrder(order);
  return order;
}

async function mockListOrders(query?: OrderQuery): Promise<OrderListResponse> {
  const page = Math.max(1, query?.page ?? 1);
  const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, query?.limit ?? 20));
  let orders = scopeOrdersForUser(getStoredOrders(), authService.getCurrentUser());
  if (query?.status) {
    orders = orders.filter((order) => order.status === query.status);
  }
  orders = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const start = (page - 1) * limit;
  return {
    items: orders.slice(start, start + limit),
    total: orders.length,
    page,
    limit,
  };
}

async function mockGetOrder(id: string): Promise<Order> {
  const order = getOrderById(id);
  if (!order || !canSeeOrder(order, authService.getCurrentUser())) {
    throw new ApiError("Order not found.", "NOT_FOUND", 404);
  }
  return order;
}

/** Restore quantities to branch stock when an order is cancelled (mock). */
async function mockRestoreStock(order: Order): Promise<void> {
  const branchId = orderBranchId(order);
  if (!branchId) return;
  try {
    const products = await getProducts({ limit: 100 });
    const productMap = new Map(products.map((p) => [p.id, p]));
    const next = products.map((product) => {
      const item = order.items.find((i) => i.productId === product.id);
      if (!item) return product;
      const inventory = [...(product.branchInventory ?? [])];
      const idx = inventory.findIndex((i) => i.branchId === branchId);
      if (idx >= 0) {
        inventory[idx] = { ...inventory[idx], stock: inventory[idx].stock + item.quantity };
      } else {
        inventory.push({ branchId, price: item.unitPrice, stock: item.quantity });
      }
      return {
        ...product,
        branchInventory: inventory,
        stock: inventory.reduce((sum, i) => sum + i.stock, 0),
      };
    });
    void productMap;
    saveProducts(next);
  } catch {
    // mock stock drift is acceptable
  }
}

async function mockUpdateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const user = authService.getCurrentUser();
  const order = getOrderById(id);
  if (!order || !canSeeOrder(order, user)) {
    throw new ApiError("Order not found.", "NOT_FOUND", 404);
  }
  if (user?.role === "branchManager" && orderBranchId(order) !== user.branchId) {
    throw new ApiError("You can only update orders from your assigned branch.", "FORBIDDEN", 403);
  }
  assertValidTransition(order.status, status);
  if (status === "cancelled") {
    await mockRestoreStock(order);
  }
  updateOrderStatusLocal(id, status);
  return { ...order, status, updatedAt: new Date().toISOString() };
}

// ---------- API implementation ----------

async function apiCreateOrder(input: CreateOrderInput): Promise<Order> {
  try {
    const { data } = await apiClient.post<Order>("/orders", input);
    return data;
  } catch (error) {
    const normalized = normalizeError(error, "Could not place your order.");
    throw new ApiError(normalized.message, normalized.code, normalized.status, normalized.details);
  }
}

async function apiListOrders(query?: OrderQuery): Promise<OrderListResponse> {
  const { data } = await apiClient.get<OrderListResponse>("/orders", {
    params: {
      status: query?.status || undefined,
      page: query?.page ?? 1,
      limit: query?.limit ?? 20,
    },
  });
  return data;
}

async function apiGetOrder(id: string): Promise<Order> {
  try {
    const { data } = await apiClient.get<Order>(`/orders/${id}`);
    return data;
  } catch (error) {
    const normalized = normalizeError(error, "Order not found.");
    throw new ApiError(normalized.message, normalized.code, normalized.status);
  }
}

async function apiUpdateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  try {
    const { data } = await apiClient.patch<Order>(`/orders/${id}/status`, { status });
    return data;
  } catch (error) {
    const normalized = normalizeError(error, "Could not update order status.");
    throw new ApiError(normalized.message, normalized.code, normalized.status);
  }
}

// ---------- Public API ----------

export const ordersService = {
  createOrder(input: CreateOrderInput): Promise<Order> {
    return USE_MOCK ? mockCreateOrder(input) : apiCreateOrder(input);
  },
  /** Paginated, role-scoped order list — always the {items,total,page,limit} envelope. */
  list(query?: OrderQuery): Promise<OrderListResponse> {
    return USE_MOCK ? mockListOrders(query) : apiListOrders(query);
  },
  getOrder(id: string): Promise<Order> {
    return USE_MOCK ? mockGetOrder(id) : apiGetOrder(id);
  },
  updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    return USE_MOCK ? mockUpdateOrderStatus(id, status) : apiUpdateOrderStatus(id, status);
  },
};
