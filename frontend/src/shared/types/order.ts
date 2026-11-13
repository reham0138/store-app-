export type PaymentMethod = "cash" | "card";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export interface ShippingAddress {
  fullName: string;
  phone: string;
  city: string;
  street: string;
  building?: string;
  notes?: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  thumbnail: string;
  /** Optional snapshot kept for mock reports; the contract item shape is
   *  { productId, title, thumbnail, unitPrice, quantity }. */
  category?: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId?: string;
  /** Direct indexed field used by reports/scoping (contract §4). */
  branchId?: string;
  items: OrderItem[];
  branch?: {
    id: string;
    name: string;
  };

  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;

  subtotal: number;
  deliveryFee: number;
  total: number;

  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
}
