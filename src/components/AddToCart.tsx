"use client";

import { useState } from "react";
import { formatCLP, type Product } from "@/lib/products";
import { useCart } from "./CartProvider";

export function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  if (!variant) return <p className="text-muted">Sin opciones disponibles.</p>;
  const soldOut = variant.stock === 0;
  const max = variant.stock == null ? 99 : Math.min(99, variant.stock);

  return (
    <div>
      <p key={variant.id} className="animate-fade font-display text-4xl font-bold text-accent">{formatCLP(variant.price)}</p>
      <p className="text-xs text-muted">IVA incluido</p>
      {product.variants.length > 1 && (
        <div className="mt-6">
          <p className="text-sm font-medium">Lado / opción</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                onClick={() => { setVariantId(v.id); setQty(1); }}
                className={`rounded-xl border px-4 py-2 text-sm transition ${
                  v.id === variant.id ? "border-accent bg-accent/10 text-accent" : "hover:border-accent/50"
                } ${v.stock === 0 ? "line-through opacity-60" : ""}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {variant.stock != null && variant.stock > 0 && variant.stock <= 5 && (
        <p className="mt-3 text-xs font-medium text-warn">Quedan {variant.stock} unidad{variant.stock === 1 ? "" : "es"}</p>
      )}
      <div className="mt-6 flex gap-3">
        <div className="flex items-center rounded-xl border">
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-2 text-muted hover:text-fg" aria-label="Menos">−</button>
          <span className="w-6 text-center tabular">{qty}</span>
          <button onClick={() => setQty(Math.min(max, qty + 1))} className="px-4 py-2 text-muted hover:text-fg" aria-label="Más">+</button>
        </div>
        <button
          disabled={soldOut}
          onClick={() => {
            add(variant.id, qty);
            setAdded(true);
            setTimeout(() => setAdded(false), 1500);
          }}
          className="btn-primary flex-1"
        >
          {soldOut ? "Agotado" : added ? "✓ Agregado" : "Agregar al carrito"}
        </button>
      </div>
    </div>
  );
}
