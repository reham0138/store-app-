export interface StoreProduct {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  thumbnail: string;
  images: string[];
}

export interface CartItem {
  product: StoreProduct;
  quantity: number;
}

export interface CartContextType {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  total: number;

  addToCart: (product: StoreProduct, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
}