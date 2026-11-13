import type { CartItem } from "./cart";

export type PaymentMethod = "cash" | "card";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface ShippingAddress {
  fullName: string;
  phone: string;
  city: string;
  street: string;
  building?: string;
  notes?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
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
}