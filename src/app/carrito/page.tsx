"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatCLP } from "@/lib/products";
import { ProductImage } from "@/components/ProductImage";

export default function Carrito() {
  const { lines, subtotal, shipping, total, setQty, remove, find } = useCart();

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Tu carrito está vacío</h1>
        <Link href="/productos" className="btn-primary mt-6">
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1fr_340px]">
      <div>
        <h1 className="font-display text-3xl font-bold md:text-4xl">Carrito</h1>
        <ul className="mt-6 divide-y rounded-2xl border">
          {lines.map((line) => {
            const found = find(line.variantId);
            if (!found) return null;
            const { product, variant } = found;
            return (
              <li key={line.variantId} className="flex items-center gap-4 p-4">
                <div className="h-24 w-16 shrink-0 rounded-lg bg-surface border p-1">
                  <ProductImage product={product} className="h-full w-full" />
                </div>
                <div className="flex-1">
                  <Link href={`/productos/${product.slug}`} className="font-medium hover:text-accent">{product.name}</Link>
                  <p className="text-sm text-muted">{variant.label} · {formatCLP(variant.price)}</p>
                  <button onClick={() => remove(line.variantId)} className="mt-1 text-xs text-muted hover:text-red-500">Eliminar</button>
                </div>
                <div className="flex items-center rounded-full border">
                  <button onClick={() => setQty(line.variantId, line.qty - 1)} className="px-3 py-1" aria-label="Menos">−</button>
                  <span className="w-6 text-center text-sm">{line.qty}</span>
                  <button onClick={() => setQty(line.variantId, line.qty + 1)} className="px-3 py-1" aria-label="Más">+</button>
                </div>
                <p className="w-24 text-right font-semibold">{formatCLP(variant.price * line.qty)}</p>
              </li>
            );
          })}
        </ul>
      </div>
      <aside className="h-fit rounded-2xl bg-surface border p-6">
        <h2 className="font-semibold">Resumen</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatCLP(subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Envío</dt><dd>{shipping === 0 ? "Gratis" : formatCLP(shipping)}</dd></div>
          <div className="flex justify-between border-t pt-2 text-base font-semibold"><dt>Total</dt><dd>{formatCLP(total)}</dd></div>
        </dl>
        <Link href="/checkout" className="btn-primary mt-6 w-full">
          Continuar al pago
        </Link>
      </aside>
    </div>
  );
}
