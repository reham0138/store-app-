import type { Order } from "../types/order";

const STORAGE_KEY = "crown-anchor-orders";

export function getOrders(): Order[] {
  try {
    const savedOrders = localStorage.getItem(STORAGE_KEY);

    return savedOrders
      ? JSON.parse(savedOrders) as Order[]
      : [];
  } catch {
    return [];
  }
}

export function saveOrder(order: Order): void {
  const orders = getOrders();

  const updatedOrders = [order, ...orders];

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedOrders)
  );
}

export function getOrderById(id: string): Order | undefined {
  return getOrders().find((order) => order.id === id);
}