import { Eye, MessageCircleQuestion, Star } from "lucide-react";
import { formatPrice } from "../../utils/pricing";
import ProductThumb from "./ProductThumb";
import { STRINGS } from "./strings";
import type { AssistantProduct, Language } from "./types";

interface Props {
  product: AssistantProduct;
  language: Language;
  active: boolean;
  onView: () => void;
  onAsk: () => void;
}

export default function ReplyProductCard({ product, language, active, onView, onAsk }: Props) {
  const t = STRINGS[language];
  return (
    <article
      className={`flex gap-3 rounded-2xl border bg-surface-white p-2.5 shadow-2xs ${active ? "border-brand-gold" : "border-border-subtle"}`}
    >
      <ProductThumb src={product.thumbnail} className="size-16 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-start text-[13px] font-semibold text-brand-navy" title={product.name}>
          <bdi>{product.name}</bdi>
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-text-slate">
          <span className="text-sm font-bold text-text-main" dir="ltr">{formatPrice(product.price)}</span>
          {product.rating > 0 ? (
            <span className="inline-flex items-center gap-1" dir="ltr">
              <Star aria-hidden="true" size={12} className="fill-brand-gold text-brand-gold" />
              {product.rating.toFixed(1)}
              {product.reviewCount > 0 && ` (${product.reviewCount})`}
            </span>
          ) : (
            <span>{t.noRating}</span>
          )}
          {product.stock !== null && (
            <span className={`font-medium ${product.stock > 0 ? "text-status-success" : "text-status-error"}`}>
              {product.stock > 0 ? t.inStock(product.stock) : t.outOfStock}
            </span>
          )}
        </div>
        <div className="mt-1.5 flex gap-1.5">
          <button type="button" onClick={onAsk}
            className="inline-flex items-center gap-1 rounded-lg bg-brand-navy px-2.5 py-1 text-[11px] font-medium text-white transition hover:opacity-90">
            <MessageCircleQuestion aria-hidden="true" size={12} />{t.ask}
          </button>
          <button type="button" onClick={onView}
            className="inline-flex items-center gap-1 rounded-lg border border-border-subtle px-2.5 py-1 text-[11px] font-medium text-text-main transition hover:border-brand-gold">
            <Eye aria-hidden="true" size={12} />{t.view}
          </button>
        </div>
      </div>
    </article>
  );
}
