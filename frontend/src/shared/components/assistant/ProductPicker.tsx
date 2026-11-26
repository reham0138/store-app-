import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { queryKeys } from "../../api/queryKeys";
import { useBranch } from "../../contexts/useBranch";
import { useCart } from "../../hooks/useCart";
import { listProducts } from "../../services/product.service";
import type { StoreProduct } from "../../types/cart";
import { formatPrice, getProductPrice } from "../../utils/pricing";
import ProductThumb from "./ProductThumb";
import { STRINGS } from "./strings";
import type { Language, ProductRef } from "./types";

interface Props {
  language: Language;
  onPick: (product: ProductRef) => void;
  onClose: () => void;
}

/** Lets the shopper choose any store product, not only what is already in the cart. */
export default function ProductPicker({ language, onPick, onClose }: Props) {
  const t = STRINGS[language];
  const { selectedBranch } = useBranch();
  const { items } = useCart();
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const branchId = selectedBranch?.id;

  useEffect(() => {
    const timer = window.setTimeout(() => setTerm(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const query = useQuery({
    queryKey: [...queryKeys.products.all, "assistant", branchId, term],
    queryFn: () => listProducts({ branchId, search: term || undefined, limit: 20 }),
  });

  const matchesTerm = (product: StoreProduct) => product.title.toLowerCase().includes(term.toLowerCase());
  const cart = items.map((item) => item.product).filter(matchesTerm);
  const cartIds = new Set(cart.map((product) => product.id));
  const others = (query.data?.items ?? []).filter((product) => !cartIds.has(product.id));

  const section = (title: string, products: StoreProduct[]) => products.length > 0 && (
    <div>
      <p className="px-1 pb-1.5 text-[11px] font-semibold text-text-slate">{title}</p>
      <ul className="space-y-1">
        {products.map((product) => (
          <li key={product.id}>
            <button type="button"
              onClick={() => onPick({ id: product.id, name: product.title, thumbnail: product.thumbnail })}
              className="flex w-full items-center gap-3 rounded-xl border border-transparent p-2 text-start transition hover:border-brand-gold hover:bg-surface-cream">
              <ProductThumb src={product.thumbnail} className="size-10 rounded-lg" />
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-text-main"><bdi>{product.title}</bdi></span>
              <span className="text-xs font-semibold text-brand-navy" dir="ltr">
                {formatPrice(getProductPrice(product, branchId))}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="assistant-sheet absolute inset-0 z-10 flex flex-col bg-surface-white" role="dialog" aria-label={t.pickerTitle}>
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-4 py-3">
        <p className="text-sm font-semibold text-brand-navy">{t.pickerTitle}</p>
        <button type="button" onClick={onClose} aria-label={t.cancel}
          className="rounded-lg p-1.5 text-text-slate hover:bg-surface-cream"><X size={18} /></button>
      </div>
      <div className="px-3 pt-3">
        <label className="flex items-center gap-2 rounded-xl border border-border-subtle px-3 focus-within:border-brand-gold focus-within:ring-2 focus-within:ring-brand-gold/20">
          <Search aria-hidden="true" size={15} className="text-text-slate" />
          <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} maxLength={100}
            placeholder={t.search} aria-label={t.search} dir="auto"
            className="h-10 min-w-0 flex-1 bg-transparent text-sm text-text-main outline-none placeholder:text-text-slate/70" />
        </label>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-3">
        {section(t.fromCart, cart)}
        {section(t.allProducts, others)}
        {query.isLoading && <p className="text-center text-xs text-text-slate">{t.loadingProducts}</p>}
        {query.isError && <p className="text-center text-xs text-status-error">{t.productsError}</p>}
        {query.isSuccess && !cart.length && !others.length && (
          <p className="text-center text-xs text-text-slate">{t.noResults}</p>
        )}
      </div>
    </div>
  );
}
