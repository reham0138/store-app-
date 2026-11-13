import type { CartItem } from "../types/cart";
import type { Order, OrderStatus, PaymentMethod } from "../types/order";

const STORAGE_KEY = "crown-anchor-orders";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isCartItem(value: unknown): value is CartItem {
  if (!isRecord(value) || !isRecord(value.product)) return false;
  const product = value.product;
  return (
    isFiniteNumber(value.quantity) &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0 &&
    isFiniteNumber(product.id) &&
    typeof product.title === "string" &&
    typeof product.description === "string" &&
    typeof product.category === "string" &&
    isFiniteNumber(product.price) &&
    isFiniteNumber(product.discountPercentage) &&
    isFiniteNumber(product.rating) &&
    isFiniteNumber(product.stock) &&
    typeof product.brand === "string" &&
    typeof product.thumbnail === "string" &&
    Array.isArray(product.images) &&
    product.images.every((image) => typeof image === "string")
  );
}

function isOrder(value: unknown): value is Order {
  if (!isRecord(value) || !Array.isArray(value.items) ||
      !value.items.every(isCartItem) || !isRecord(value.shippingAddress)) {
    return false;
  }
  const address = value.shippingAddress;
  const statuses: OrderStatus[] = [
    "pending", "processing", "shipped", "delivered", "cancelled",
  ];
  const payments: PaymentMethod[] = ["cash", "card"];

  return (
    typeof value.id === "string" &&
    typeof address.fullName === "string" &&
    typeof address.phone === "string" &&
    typeof address.city === "string" &&
    typeof address.street === "string" &&
    payments.includes(value.paymentMethod as PaymentMethod) &&
    statuses.includes(value.status as OrderStatus) &&
    isFiniteNumber(value.subtotal) &&
    isFiniteNumber(value.deliveryFee) &&
    isFiniteNumber(value.total) &&
    typeof value.createdAt === "string" &&
    (!value.branch || (
      isRecord(value.branch) &&
      typeof value.branch.id === "string" &&
      typeof value.branch.name === "string"
    ))
  );
}

export function getOrders(): Order[] {
  try {
    const savedOrders = localStorage.getItem(STORAGE_KEY);
    if (!savedOrders) return [];
    const parsed: unknown = JSON.parse(savedOrders);
    if (!Array.isArray(parsed)) {
      console.warn("Saved orders data is invalid; ignoring it.");
      return [];
    }
    const orders = parsed.filter(isOrder);
    if (orders.length !== parsed.length) {
      console.warn("Invalid saved orders were skipped.");
    }
    return orders;
  } catch (error) {
    console.warn("Unable to read saved orders.", error);
    return [];
  }
}

export function saveOrder(order: Order): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([order, ...getOrders()]));
    window.dispatchEvent(new Event("orders-updated"));
    return true;
  } catch (error) {
    console.error("Unable to save order to browser storage.", error);
    return false;
  }
}

export function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  branchId?: string,
): void {
  const orders = getOrders();
  const orderIndex = orders.findIndex((order) => order.id === orderId);
  if (orderIndex < 0) {
    throw new Error("This order could not be found in saved orders.");
  }

  const order = orders[orderIndex];
  if (branchId !== undefined && order.branch?.id !== branchId) {
    throw new Error("You can only update orders from your assigned branch.");
  }

  const updatedOrders = orders.map((existingOrder) =>
    existingOrder.id === orderId ? { ...existingOrder, status } : existingOrder,
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
  window.dispatchEvent(new Event("orders-updated"));
}

export function getOrderById(id: string): Order | undefined {
  return getOrders().find((order) => order.id === id);
}
