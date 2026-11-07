import type { Order, OrderStatus } from "../types/order";
import type { StoreProduct } from "../types/cart";

export interface DashboardMetric {
  label: string;
  value: number;
  displayValue?: string;
}

export type DailyRevenue = DashboardMetric;

export type InventoryStockLevel = "In stock" | "Low stock" | "Out of stock";

const orderStatuses: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function getRevenueByDay(orders: Order[]): DailyRevenue[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return {
      date,
      value: 0,
    };
  });
  const dailyRevenue = new Map(
    days.map(({ date, value }) => [getDateKey(date), value]),
  );

  orders.forEach((order) => {
    if (order.status === "cancelled") return;
    const createdAt = new Date(order.createdAt);
    if (Number.isNaN(createdAt.getTime())) return;

    const key = getDateKey(createdAt);
    if (dailyRevenue.has(key)) {
      dailyRevenue.set(key, (dailyRevenue.get(key) ?? 0) + order.total);
    }
  });

  return days.map(({ date }) => ({
    label: date.toLocaleDateString(undefined, { weekday: "short" }),
    value: dailyRevenue.get(getDateKey(date)) ?? 0,
  }));
}

export function getOrderStatusCounts(orders: Order[]) {
  return orderStatuses.map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length,
  }));
}

export function getTopProducts(orders: Order[], limit = 5): DashboardMetric[] {
  const productTotals = new Map<
    number,
    { id: number; title: string; quantity: number }
  >();

  orders
    .filter((order) => order.status !== "cancelled")
    .forEach((order) => {
      order.items.forEach(({ product, quantity }) => {
        const existing = productTotals.get(product.id);
        productTotals.set(product.id, {
          id: product.id,
          title: product.title,
          quantity: (existing?.quantity ?? 0) + quantity,
        });
      });
    });

  return [...productTotals.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit)
    .map(({ id, title, quantity }) => ({
      key: `product-${id}`,
      label: title,
      value: quantity,
      displayValue: `${quantity} units`,
    }));
}

export function getInventoryStockLevels(
  products: StoreProduct[],
  branchId?: string,
): DashboardMetric[] {
  const counts: Record<InventoryStockLevel, number> = {
    "In stock": 0,
    "Low stock": 0,
    "Out of stock": 0,
  };

  products.forEach((product) => {
    const stockEntries = branchId
      ? [
          product.branchInventory?.find(
            (inventory) => inventory.branchId === branchId,
          )?.stock ?? 0,
        ]
      : product.branchInventory?.length
        ? product.branchInventory.map((inventory) => inventory.stock)
        : [product.stock];

    stockEntries.forEach((stock) => {
      const status: InventoryStockLevel =
        stock <= 0 ? "Out of stock" : stock <= 10 ? "Low stock" : "In stock";
      counts[status] += 1;
    });
  });

  return Object.entries(counts).map(([label, value]) => ({
    label,
    value,
  }));
}
