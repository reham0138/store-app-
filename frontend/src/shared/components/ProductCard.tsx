import { type Product } from "../types/product";

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  const finalPrice = product.price * (1 - product.discountPercentage / 100);

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
      <p className="text-sm text-gray-500 mb-2">category: {product.category}</p>
      <p className="font-bold text-blue-600 mb-1">
        السعر: ${finalPrice.toFixed(2)}
      </p>
      {product.discountPercentage > 0 && (
        <p className="text-xs text-gray-400 line-through mb-3">
          ${product.price.toFixed(2)}
        </p>
      )}
      <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors w-full">
        Add to cart
      </button>
    </div>
  );
}

export default ProductCard;