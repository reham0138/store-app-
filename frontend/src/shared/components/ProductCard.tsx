
import { useState } from "react";
import type { StoreProduct } from "../types/cart";
import { useCart } from "../contexts/CartContext";
import { useBranch } from "../contexts/useBranch";
import {
  formatPrice,
  getProductPrice,
  getProductRegularPrice,
  getProductStock,
} from "../utils/pricing";
interface ProductCardProps {
  product: StoreProduct;
}
function ProductCard({ product }: ProductCardProps) {
  const { selectedBranch } = useBranch();
  const branchId = selectedBranch?.id;
  const { addToCart, items } = useCart();
  const stock = getProductStock(product, branchId);
  const quantityInCart =
    items.find((item) => item.product.id === product.id)?.quantity ?? 0;
  const hasReachedStockLimit = quantityInCart >= stock;
  const [isAdded, setIsAdded] = useState(false);
  const addButtonLabel =
    stock <= 0
      ? "Out of stock"
      : hasReachedStockLimit
        ? "Maximum quantity in cart"
        : isAdded
          ? "Added to cart ✓"
          : "Add to cart";

  const handleAddToCart = () => {
    if (hasReachedStockLimit) return;

    addToCart(product);
    setIsAdded(true);

    window.setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 text-center bg-white shadow-sm hover:shadow-md transition-shadow">
      <img
        src={product.thumbnail}
        alt={product.title}
        className="w-full h-36 object-cover rounded-md mb-3"
      />

      <h3 className="font-semibold text-lg text-gray-800 mb-1">
        {product.title}
      </h3>

      <p className="text-sm text-gray-500 mb-1">{product.brand}</p>

      <p className="text-sm text-gray-500 mb-2">
        category: {product.category}
      </p>

      <p className="font-bold text-blue-600 mb-1">
        {formatPrice(getProductPrice(product, branchId))}
      </p>

      {product.discountPercentage > 0 && (
        <p className="text-xs text-gray-400 line-through mb-3">
          {formatPrice(getProductRegularPrice(product, branchId))}
        </p>
      )}

      <p className="mb-3 text-xs text-gray-500">
        {stock} available at {selectedBranch?.name ?? "the selected branch"}
      </p>

      <button
        onClick={handleAddToCart}
        disabled={hasReachedStockLimit}
        className={`font-medium py-2 px-4 rounded transition-colors w-full text-white ${
          hasReachedStockLimit
            ? "bg-gray-400 cursor-not-allowed"
            : isAdded
              ? "bg-green-600"
              : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {addButtonLabel}
      </button>
    </div>
  );
}

export default ProductCard;
