
import { useState } from "react";
import { type Product } from "../types/Product";
import { useCart } from "../contexts/CartContext";

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  const finalPrice = product.price * (1 - product.discountPercentage / 100);

  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    if (product.stock <= 0) return;

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
        السعر: ${finalPrice.toFixed(2)}
      </p>

      {product.discountPercentage > 0 && (
        <p className="text-xs text-gray-400 line-through mb-3">
          ${product.price.toFixed(2)}
        </p>
      )}

      <button
        onClick={handleAddToCart}
        disabled={product.stock <= 0}
        className={`font-medium py-2 px-4 rounded transition-colors w-full text-white ${
          product.stock <= 0
            ? "bg-gray-400 cursor-not-allowed"
            : isAdded
              ? "bg-green-600"
              : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {product.stock <= 0
          ? "Out of stock"
          : isAdded
            ? "Added to cart ✓"
            : "Add to cart"}
      </button>
    </div>
  );
}

export default ProductCard;
