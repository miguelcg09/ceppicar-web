"use client";

import Link from "next/link";
import { useState } from "react";
import { fitsVehicle, formatCLP, vehicleLabel, type Product } from "@/lib/products";
import { ProductImage } from "./ProductImage";
import { useCart, useStore } from "./CartProvider";

export function FitBadge({ product }: { product: Product }) {
  const { vehicle } = useStore();
  const fit = fitsVehicle(product, vehicle);
  const veh = vehicleLabel(product);
  if (fit === "yes") return <span className="inline-flex items-center gap-1 rounded bg-ok/12 px-2 py-0.5 text-xs font-semibold text-ok">✓ Sirve para tu auto</span>;
  if (fit === "no") return <span className="rounded bg-warn/12 px-2 py-0.5 text-xs font-semibold text-warn">No figura para tu auto</span>;
  if (veh) return <span className="rounded bg-surface-2 px-2 py-0.5 text-xs font-medium text-fg/80">{veh}</span>;
  return <span className="rounded bg-surface-2 px-2 py-0.5 text-xs text-muted">Verifica compatibilidad</span>;
}

// Tarjeta de producto al estilo de las tiendas de repuestos: imagen sobre celeste, precio grande y botón amarillo.
export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const from = Math.min(...product.variants.map((v) => v.price));
  const soldOut = product.variants.every((v) => v.stock === 0);
  const single = product.variants.length === 1 ? product.variants[0] : null;
  const href = `/productos/${product.slug}`;

  function addNow() {
    if (!single) return;
    add(single.id, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="card card-hover group flex h-full flex-col p-3">
      <Link href={href} className="tile relative block aspect-square overflow-hidden rounded-md">
        <div className="grid h-full w-full place-items-center">
          <ProductImage product={product} className={`${product.imageUrl ? "h-full w-full" : "h-3/5 w-3/5"} transition-transform duration-300 group-hover:scale-105`} />
        </div>
        {soldOut ? (
          <span className="absolute left-2 top-2 rounded bg-surface px-2 py-0.5 text-[11px] font-bold uppercase text-warn shadow">Agotado</span>
        ) : product.freeShipping ? (
          <span className="absolute left-2 top-2 rounded bg-ok px-2 py-0.5 text-[11px] font-bold text-white shadow">Envío gratis</span>
        ) : null}
        {!product.active && <span className="absolute right-2 top-2 rounded bg-surface px-2 py-0.5 text-[11px] font-semibold text-muted shadow">A pedido</span>}
      </Link>
      <Link href={href} className="mt-3 line-clamp-2 text-sm font-medium leading-snug hover:text-accent">{product.name}</Link>
      <div className="mt-2"><FitBadge product={product} /></div>
      <p className="mt-3 font-display text-2xl font-bold leading-none">
        {product.variants.length > 1 && <span className="font-sans text-xs font-normal text-muted">Desde </span>}
        {formatCLP(from)}
      </p>
      <div className="mt-auto pt-3">
        {single && !soldOut ? (
          <button type="button" onClick={addNow} className={`btn-cta w-full py-2.5 text-sm ${added ? "bg-ok text-white" : ""}`}>
            {added ? "✓ Agregado" : "Agregar al carrito"}
          </button>
        ) : (
          <Link href={href} className={`${soldOut ? "btn-ghost" : "btn-cta"} w-full py-2.5 text-sm`}>
            {soldOut ? "Ver detalle" : "Elegir opción"}
          </Link>
        )}
      </div>
    </div>
  );
}
