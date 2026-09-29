"use client";

import Link from "next/link";
import { categoryMeta, fitsVehicle, formatCLP, vehicleLabel, type Product } from "@/lib/products";
import { ProductImage } from "./ProductImage";
import { Tilt } from "./Tilt";
import { useStore } from "./CartProvider";

export function FitBadge({ product }: { product: Product }) {
  const { vehicle } = useStore();
  const fit = fitsVehicle(product, vehicle);
  const veh = vehicleLabel(product);
  if (fit === "yes") return <span className="rounded-md bg-ok/15 px-2 py-0.5 text-xs font-medium text-ok">✓ Sirve para tu auto</span>;
  if (fit === "no") return <span className="rounded-md bg-warn/15 px-2 py-0.5 text-xs font-medium text-warn">No figura para tu auto</span>;
  if (veh) return <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium text-fg/80">{veh}</span>;
  return <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">Verifica compatibilidad</span>;
}

export function ProductCard({ product }: { product: Product }) {
  const from = Math.min(...product.variants.map((v) => v.price));
  const soldOut = product.variants.every((v) => v.stock === 0);
  const meta = categoryMeta[product.category];
  return (
    <Tilt className="h-full">
      <Link
        href={`/productos/${product.slug}`}
        className="shine group relative flex h-full flex-col rounded-2xl border bg-surface p-3 transition-colors hover:border-accent/50"
        style={{ "--c": meta.color } as React.CSSProperties}
      >
        <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-xl bg-[linear-gradient(135deg,color-mix(in_oklab,var(--c)_16%,var(--surface-2)),var(--surface-2)_70%)]">
          <ProductImage product={product} className="relative h-3/5 w-3/5 transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105" />
          {soldOut && <span className="absolute left-3 top-3 rounded-full bg-surface/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-warn backdrop-blur">Agotado</span>}
          {!soldOut && product.freeShipping && <span className="absolute left-3 top-3 rounded-full bg-surface/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ok backdrop-blur">Envío gratis</span>}
          {!product.active && <span className="absolute right-3 top-3 rounded-full bg-surface/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted backdrop-blur">A pedido</span>}
        </div>
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-widest" style={{ color: meta.color }}>{meta.name}</p>
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">{product.name}</h3>
        <div className="mt-2"><FitBadge product={product} /></div>
        <div className="mt-auto flex items-end justify-between pt-3">
          <p className="font-display text-2xl font-bold text-accent">
            {product.variants.length > 1 && <span className="font-sans text-xs font-normal text-muted">Desde </span>}
            {formatCLP(from)}
          </p>
          <span className="grid h-9 w-9 place-items-center rounded-full border transition-all duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-on-accent">
            →
          </span>
        </div>
      </Link>
    </Tilt>
  );
}
