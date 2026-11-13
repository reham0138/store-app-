import type { Order, OrderStatus } from "../types/order";

const STORAGE_KEY = "crown-anchor-orders";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isOrderItem(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.productId === "string" &&
    typeof value.title === "string" &&
    isFiniteNumber(value.unitPrice) &&
    isFiniteNumber(value.quantity) &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0
  );
}

function isOrder(value: unknown): value is Order {
  if (!isRecord(value) || !Array.isArray(value.items) || !value.items.every(isOrderItem)) {
    return false;
  }
  const address = value.shippingAddress;
  const statuses: OrderStatus[] = [
    "pending", "processing", "shipped", "delivered", "cancelled",
  ];
  const payments = ["cash", "card"];

  return (
    typeof value.id === "string" &&
    isRecord(address) &&
    typeof address.fullName === "string" &&
    typeof address.phone === "string" &&
    typeof address.city === "string" &&
    typeof address.street === "string" &&
    payments.includes(value.paymentMethod as string) &&
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

/** Migrates legacy orders (full product snapshots, numeric ids) to the new shape. */
function migrateLegacyOrder(value: Record<string, unknown>): Order | null {
  if (!Array.isArray(value.items)) return null;
  const items: Order["items"] = [];
  for (const raw of value.items as unknown[]) {
    if (!isRecord(raw)) continue;
    const product = isRecord(raw.product) ? raw.product : null;
    if (product) {
      items.push({
        productId: String(product.id ?? ""),
        title: typeof product.title === "string" ? product.title : "Product",
        thumbnail: typeof product.thumbnail === "string" ? product.thumbnail : "",
        category: typeof product.category === "string" ? product.category : "",
        unitPrice: isFiniteNumber(product.price)
          ? product.price
          : isFiniteNumber(raw.unitPrice)
            ? raw.unitPrice
            : 0,
        quantity: isFiniteNumber(raw.quantity) ? raw.quantity : 0,
      });
    } else if (isOrderItem(raw)) {
      items.push(raw as unknown as Order["items"][number]);
    }
  }

  if (items.length === 0) return null;

  const address = isRecord(value.shippingAddress)
    ? (value.shippingAddress as unknown as Order["shippingAddress"])
    : { fullName: "", phone: "", city: "", street: "" };

  return {
    ...(value as unknown as Order),
    items,
    subtotal: isFiniteNumber(value.subtotal) ? value.subtotal : 0,
    deliveryFee: isFiniteNumber(value.deliveryFee) ? value.deliveryFee : 0,
    total: isFiniteNumber(value.total) ? value.total : 0,
    shippingAddress: address,
    paymentMethod: value.paymentMethod === "card" ? "card" : "cash",
    status: (["pending", "processing", "shipped", "delivered", "cancelled"] as OrderStatus[]).includes(value.status as OrderStatus)
      ? (value.status as OrderStatus)
      : "pending",
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
  };
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
    const orders = parsed
      .map((value) => {
        if (isOrder(value)) return value;
        if (isRecord(value)) return migrateLegacyOrder(value);
        return null;
      })
      .filter((order): order is Order => order !== null);
    if (orders.length !== parsed.length) {
      console.warn("Invalid saved orders were skipped.");
    }
    return orders;
  } catch (error) {
    console.warn("Unable to read saved orders.", error);
    return [];
  }
}

export function saveOrders(orders: Order[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  window.dispatchEvent(new Event("orders-updated"));
}

export function saveOrder(order: Order): boolean {
  try {
    saveOrders([order, ...getOrders()]);
    return true;
  } catch (error) {
    console.error("Unable to save order to browser storage.", error);
    return false;
  }
}

export function updateOrderStatusLocal(
  orderId: string,
  status: OrderStatus,
): void {
  saveOrders(
    getOrders().map((order) =>
      order.id === orderId ? { ...order, status, updatedAt: new Date().toISOString() } : order,
    ),
  );
}

export function getOrderById(id: string): Order | undefined {
  return getOrders().find((order) => order.id === id);
}
