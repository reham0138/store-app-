import { useState, useEffect } from "react";
import { type Product } from "../types/product";
import ProductGrid from "./ProductGrid";

function ProductCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/mock/products.json");
        if (!response.ok) {
          throw new Error("failed to load products");
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setProducts(data);
        } else if (data && Array.isArray(data.products)) {
          // الشكل: { "products": [...] }
          setProducts(data.products);
        } else if (data && Array.isArray(data.data)) {
          // الشكل: { "data": [...] }
          setProducts(data.data);
        } else {
          throw new Error("صيغة البيانات غير مدعومة");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "حدث خطأ أثناء جلب المنتجات");
      } finally {
        setLoading(false); // إيقاف حالة التحميل
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500 text-lg">
        جاري تحميل المنتجات...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500 text-lg">
        خطأ: {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <h2 className="text-2xl font-bold text-center my-6 text-gray-800">
        Products catalog
      </h2>
      <ProductGrid products={products} />
    </div>
  );
}

export default ProductCatalog;