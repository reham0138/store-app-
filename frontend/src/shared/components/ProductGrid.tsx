import React from "react";
import { type Product } from "../types/product";
import ProductCard from "./ProductCard";
interface ProductGridProps {
  products: Product[];
}
function ProductGrid({ products }: ProductGridProps) {
  if (!Array.isArray(products) || products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-lg">
        لا توجد منتجات صالحة للعرض حالياً.{" "}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
      {products.map((item) => (
        <ProductCard key={item.id} product={item} />
      ))}
    </div>
  );
}
export default ProductGrid;
