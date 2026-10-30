import { Minus, Plus, Trash2 } from "lucide-react";

import type { CartItem as CartItemType } from "../types/cart";

import {
  formatPrice,
  getProductPrice,
} from "../utils/pricing";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
}

export default function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  const { product, quantity } = item;

  const unitPrice = getProductPrice(product);

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-white p-4 sm:flex-row sm:items-center">

      {/* Product Image */}
      <img
        src={product.thumbnail}
        alt={product.title}
        className="size-24 rounded-lg bg-surface-cream object-cover"
      />

      {/* Product Information */}
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-brand-navy">
          {product.title}
        </h3>

        <p className="mt-1 text-sm text-text-slate">
          {product.brand}
        </p>

        <p className="mt-2 font-semibold text-brand-navy">
          {formatPrice(unitPrice)}
        </p>

        <p className="mt-1 text-xs text-text-slate">
          {product.stock} available
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">

        <div className="flex items-center gap-3 rounded-lg border border-border-subtle p-1">

          <button
            type="button"
            onClick={() => onUpdateQuantity(product.id, quantity - 1)}
            aria-label="Decrease quantity"
            className="rounded-md p-2 hover:bg-surface-cream"
          >
            <Minus size={16} />
          </button>

          <span className="min-w-6 text-center font-medium">
            {quantity}
          </span>

          <button
            type="button"
            disabled={quantity >= product.stock}
            onClick={() => onUpdateQuantity(product.id, quantity + 1)}
            aria-label="Increase quantity"
            className="rounded-md p-2 hover:bg-surface-cream disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={16} />
          </button>

        </div>

        <p className="font-semibold text-brand-navy">
          {formatPrice(unitPrice * quantity)}
        </p>

        <button
          type="button"
          onClick={() => onRemove(product.id)}
          className="inline-flex items-center gap-2 text-sm text-status-error hover:underline"
        >
          <Trash2 size={16} />
          Remove
        </button>

      </div>
    </article>
  );
}