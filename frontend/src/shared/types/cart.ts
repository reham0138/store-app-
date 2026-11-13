export interface BranchInventory {
  branchId: string;
  price: number;
  stock: number;
}

export interface StoreProduct {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  reviewCount?: number;
  stock: number;
  brand: string;
  thumbnail: string;
  images: string[];
  branchInventory?: BranchInventory[];
}

export interface CartItem {
  product: StoreProduct;
  quantity: number;
}

export interface CartLine {
  productId: string;
  quantity: number;
  branchId: string;
}

export interface CartContextType {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  cartNotice: string | null;

  addToCart: (product: StoreProduct, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  dismissCartNotice: () => void;
}
