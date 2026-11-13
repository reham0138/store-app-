import type { Order, OrderStatus } from "../types/order";

const STORAGE_KEY = "crown-anchor-orders";

// ---------- Mock seed orders (one batch per branch, mock mode only) ----------

function daysAgoIso(days: number, hourOffset = 0): string {
  const d = new Date(Date.now() - days * 86_400_000 + hourOffset * 3_600_000);
  return d.toISOString();
}

interface SeedItem {
  productId: string;
  title: string;
  thumbnail: string;
  category: string;
  unitPrice: number;
  quantity: number;
}

function seedOrder(
  id: string,
  branchId: string,
  branchName: string,
  status: Order["status"],
  createdAt: string,
  items: SeedItem[],
): Order {
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const deliveryFee = 5;
  return {
    id,
    userId: "mock-customer",
    branchId,
    items,
    branch: { id: branchId, name: branchName },
    shippingAddress: {
      fullName: "Customer Demo",
      phone: "+963 000 000 000",
      city: branchName,
      street: "Main Street 1",
    },
    paymentMethod: "cash",
    subtotal: Math.round(subtotal * 100) / 100,
    deliveryFee,
    total: Math.round((subtotal + deliveryFee) * 100) / 100,
    status,
    createdAt,
  };
}

const SEED_ORDERS: Order[] = [
  // Damascus — busiest branch
  seedOrder("seed-dam-1", "damascus", "Damascus", "delivered", daysAgoIso(2), [
    { productId: "1", title: "Phone X Pro", thumbnail: "https://picsum.photos/seed/prod1-thumb/300/300", category: "smartphones", unitPrice: 719.97, quantity: 1 },
    { productId: "18", title: "Vanilla Amber 100ml", thumbnail: "https://picsum.photos/seed/prod18-thumb/300/300", category: "fragrances", unitPrice: 59, quantity: 2 },
  ]),
  seedOrder("seed-dam-2", "damascus", "Damascus", "processing", daysAgoIso(5), [
    { productId: "3", title: "Budget Phone Lite", thumbnail: "https://picsum.photos/seed/prod3-thumb/300/300", category: "smartphones", unitPrice: 184.37, quantity: 2 },
  ]),
  seedOrder("seed-dam-3", "damascus", "Damascus", "shipped", daysAgoIso(9), [
    { productId: "30", title: "Adjustable Dumbbells", thumbnail: "https://picsum.photos/seed/prod30-thumb/300/300", category: "sports-accessories", unitPrice: 79, quantity: 1 },
    { productId: "36", title: "Smart Watch Fit", thumbnail: "https://picsum.photos/seed/prod36-thumb/300/300", category: "mens-watches", unitPrice: 109, quantity: 1 },
  ]),
  seedOrder("seed-dam-4", "damascus", "Damascus", "pending", daysAgoIso(12), [
    { productId: "6", title: "Camera Phone Pro", thumbnail: "https://picsum.photos/seed/prod6-thumb/300/300", category: "smartphones", unitPrice: 849, quantity: 1 },
  ]),
  // Homs — mid volume, includes a cancelled order
  seedOrder("seed-hom-1", "homs", "Homs", "delivered", daysAgoIso(3), [
    { productId: "3", title: "Budget Phone Lite", thumbnail: "https://picsum.photos/seed/prod3-thumb/300/300", category: "smartphones", unitPrice: 175.42, quantity: 1 },
    { productId: "18", title: "Vanilla Amber 100ml", thumbnail: "https://picsum.photos/seed/prod18-thumb/300/300", category: "fragrances", unitPrice: 59, quantity: 1 },
  ]),
  seedOrder("seed-hom-2", "homs", "Homs", "delivered", daysAgoIso(14), [
    { productId: "30", title: "Adjustable Dumbbells", thumbnail: "https://picsum.photos/seed/prod30-thumb/300/300", category: "sports-accessories", unitPrice: 79, quantity: 2 },
  ]),
  seedOrder("seed-hom-3", "homs", "Homs", "cancelled", daysAgoIso(20), [
    { productId: "1", title: "Phone X Pro", thumbnail: "https://picsum.photos/seed/prod1-thumb/300/300", category: "smartphones", unitPrice: 685.02, quantity: 1 },
  ]),
  // Latakia — smallest branch
  seedOrder("seed-lat-1", "latakia", "Latakia", "delivered", daysAgoIso(6), [
    { productId: "36", title: "Smart Watch Fit", thumbnail: "https://picsum.photos/seed/prod36-thumb/300/300", category: "mens-watches", unitPrice: 109, quantity: 1 },
  ]),
  seedOrder("seed-lat-2", "latakia", "Latakia", "pending", daysAgoIso(18), [
    { productId: "18", title: "Vanilla Amber 100ml", thumbnail: "https://picsum.photos/seed/prod18-thumb/300/300", category: "fragrances", unitPrice: 59, quantity: 3 },
  ]),
];

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
        category:
          typeof product.category === "string" && product.category
            ? product.category
            : "Uncategorized",
        unitPrice: isFiniteNumber(product.price)
          ? product.price
          : isFiniteNumber(raw.unitPrice)
            ? raw.unitPrice
            : 0,
        quantity: isFiniteNumber(raw.quantity) ? raw.quantity : 0,
      });
    } else if (isOrderItem(raw)) {
      const item = raw as unknown as Order["items"][number];
      items.push({ ...item, category: item.category || "Uncategorized" });
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
    if (!savedOrders) {
      // First run in mock mode: seed one batch of orders per branch so each
      // manager dashboard shows different numbers. Existing data is never
      // overwritten — once the key exists the seeds are ignored.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ORDERS));
      return SEED_ORDERS;
    }
    const parsed: unknown = JSON.parse(savedOrders);
    if (!Array.isArray(parsed)) {
      console.warn("Saved orders data is invalid; ignoring it.");
      return [];
    }
    const orders = parsed
      .map((value) => {
        if (isOrder(value)) {
          // Backfill category on items saved before it became required.
          return {
            ...value,
            items: value.items.map((item) => ({
              ...item,
              category: item.category || "Uncategorized",
            })),
          };
        }
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
