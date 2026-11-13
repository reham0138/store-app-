import type { Order, OrderStatus, PaymentMethod, ShippingAddress } from "../types/order";
import { ORDER_STATUS_FLOW } from "../types/order";
import type { User } from "../types/auth";
import { apiClient, USE_MOCK, ApiError, normalizeError } from "../api/index.ts";
import {
  getOrders,
  saveOrder,
  getOrderById,
  updateOrderStatusLocal,
} from "../utils/orderStorage";
import { getProducts } from "./product.service";
import { getProductPrice } from "../utils/pricing";
import { authService } from "./authService";

export interface CreateOrderInput {
  branchId: string;
  items: { productId: string; quantity: number }[];
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
}

const DELIVERY_FEE = 5;

interface OrderListResponse {
  items: Order[];
  total: number;
  page: number;
  limit: number;
}

function scopeOrdersForUser(orders: Order[], user: User | null): Order[] {
  if (!user) return [];
  if (user.role === "admin") return orders;
  if (user.role === "branchManager") {
    return orders.filter((order) => order.branch?.id === user.branchId);
  }
  return orders.filter((order) => order.userId === user.id);
}

function canSeeOrder(order: Order, user: User | null): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role === "branchManager") return order.branch?.id === user.branchId;
  return order.userId === user.id;
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

  const { getBranches } = await import("./branches.service");
  const branches = await getBranches();
  const branch = branches.find((b) => b.id === input.branchId);
  if (!branch) throw new ApiError("Branch not found.", undefined, 404);
  if (branch.operationalStatus === "closed") {
    throw new ApiError(
      `Branch "${branch.name}" is currently closed.`,
      "BRANCH_CLOSED",
      400,
    );
  }

  const products = await getProducts();
  const productMap = new Map(products.map((p) => [p.id, p]));

  const orderItems = [];
  let subtotal = 0;

  for (const line of input.items) {
    const product = productMap.get(line.productId);
    if (!product) {
      throw new ApiError(`Product ${line.productId} not found.`, undefined, 404);
    }
    const branchStock =
      product.branchInventory?.find((i) => i.branchId === input.branchId)?.stock ??
      0;
    if (branchStock < line.quantity) {
      throw new ApiError(
        `Not enough stock for "${product.title}" at ${branch.name}.`,
        "INSUFFICIENT_STOCK",
        409,
      );
    }
    const unitPrice = getProductPrice(product, input.branchId);
    subtotal += unitPrice * line.quantity;
    orderItems.push({
      productId: product.id,
      title: product.title,
      thumbnail: product.thumbnail,
      category: product.category,
      unitPrice,
      quantity: line.quantity,
    });
  }

  // Decrement branch stock once for all items (mock fidelity)
  try {
    const { decrementBranchStock } = await import("../utils/productStorage");
    const { saveProducts } = await import("../utils/productStorage");
    let nextProducts = products;
    for (const line of input.items) {
      nextProducts = decrementBranchStock(nextProducts, line.productId, input.branchId, line.quantity);
    }
    saveProducts(nextProducts);
  } catch {
    // mock stock drift is acceptable
  }

  const deliveryFee = orderItems.length > 0 ? DELIVERY_FEE : 0;
  const order: Order = {
    id: `ORD-${Date.now()}`,
    userId: user.id,
    items: orderItems,
    branch: { id: branch.id, name: branch.name },
    shippingAddress: input.shippingAddress,
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

async function mockGetOrders(): Promise<Order[]> {
  return scopeOrdersForUser(getOrders(), authService.getCurrentUser());
}

async function mockGetOrder(id: string): Promise<Order> {
  const order = getOrderById(id);
  if (!order || !canSeeOrder(order, authService.getCurrentUser())) {
    throw new ApiError("Order not found.", undefined, 404);
  }
  return order;
}

async function mockUpdateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const user = authService.getCurrentUser();
  const order = getOrderById(id);
  if (!order || !canSeeOrder(order, user)) {
    throw new ApiError("Order not found.", undefined, 404);
  }
  if (user?.role === "branchManager" && order.branch?.id !== user.branchId) {
    throw new ApiError("You can only update orders from your assigned branch.", "FORBIDDEN", 403);
  }
  assertValidTransition(order.status, status);
  updateOrderStatusLocal(id, status);
  return { ...order, status };
}

// ---------- API implementation ----------

async function apiCreateOrder(input: CreateOrderInput): Promise<Order> {
  try {
    const { data } = await apiClient.post<Order>("/orders", input);
    return data;
  } catch (error) {
    const normalized = normalizeError(error, "Could not place your order.");
    throw new ApiError(normalized.message, normalized.code, normalized.status);
  }
}

async function apiGetOrders(status?: OrderStatus): Promise<Order[]> {
  const { data } = await apiClient.get<Order[] | OrderListResponse>("/orders", {
    params: status ? { status } : undefined,
  });
  return Array.isArray(data) ? data : data.items;
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
  getOrders(status?: OrderStatus): Promise<Order[]> {
    return USE_MOCK ? mockGetOrders() : apiGetOrders(status);
  },
  getOrder(id: string): Promise<Order> {
    return USE_MOCK ? mockGetOrder(id) : apiGetOrder(id);
  },
  updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    return USE_MOCK ? mockUpdateOrderStatus(id, status) : apiUpdateOrderStatus(id, status);
  },
};
