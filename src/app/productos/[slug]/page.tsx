import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categoryMeta, formatCLP, mlUrl, vehicleLabel } from "@/lib/products";
import { getProduct, getProducts } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { ProductImage } from "@/components/ProductImage";
import { AddToCart } from "@/components/AddToCart";
import { FitBadge, ProductCard } from "@/components/ProductCard";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  return { title: product?.name ?? "Producto", description: product?.short };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);
  const related = products
    .filter((p) => p.slug !== product.slug && ((p.make && p.make === product.make && p.model === product.model) || p.category === product.category))
    .sort((a, b) => Number(b.make === product.make && b.model === product.model) - Number(a.make === product.make && a.model === product.model))
    .slice(0, 4);
  const meta = categoryMeta[product.category];
  const veh = vehicleLabel(product);
  const ml = mlUrl(product);
  const specs = [
    ["Vehículo", veh || "Varios / consultar"],
    ["Marca del repuesto", product.brand || "Alternativo de primera calidad"],
    ["Origen", product.origin || "—"],
    ["Garantía", product.warranty || "3 meses"],
    ["Código", product.sku || "—"],
    ["Categoría", product.mlCategory || meta.name],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 animate-fade">
      <nav className="text-sm text-muted">
        <Link href="/productos" className="hover:text-accent">Catálogo</Link> /{" "}
        <Link href={`/productos?categoria=${product.category}`} className="hover:text-accent">{meta.name}</Link>
        {product.make && (
          <> / <Link href={`/productos?marca=${encodeURIComponent(product.make)}${product.model ? `&modelo=${encodeURIComponent(product.model)}` : ""}`} className="hover:text-accent">{product.make} {product.model}</Link></>
        )}
      </nav>
      <div className="mt-6 grid gap-10 md:grid-cols-[1fr_380px]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: meta.color }}>{meta.name}</p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight md:text-4xl">{product.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <FitBadge product={product} />
            {product.freeShipping && <span className="rounded-md bg-ok/15 px-2 py-0.5 text-xs font-medium text-ok">Envío gratis</span>}
            {!product.active && <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">A pedido: confirma disponibilidad antes de comprar</span>}
          </div>

          <div className="tile relative mt-8 grid h-72 place-items-center overflow-hidden rounded-lg md:h-96">
            <ProductImage product={product} className={`relative ${product.imageUrl ? "h-full w-full" : "h-1/2 w-1/2"}`} />
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            {specs.map(([k, v]) => (
              <div key={k} className="rounded-2xl border bg-surface p-4">
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="mt-1 font-medium">{v}</dd>
              </div>
            ))}
          </dl>

          {product.description && (
            <>
              <h2 className="mt-10 font-display text-2xl font-bold">Descripción</h2>
              <p className="mt-3 whitespace-pre-line text-muted">{product.description}</p>
            </>
          )}

          <div className="mt-8 rounded-2xl border bg-surface-2 p-5 text-sm">
            <p className="font-semibold">¿Dudas si le sirve a tu auto?</p>
            <p className="mt-1 text-muted">
              Envíanos el VIN de 17 dígitos que aparece en tu padrón por WhatsApp al <span className="font-mono text-fg">{settings.whatsapp}</span> y lo confirmamos antes de que compres.
            </p>
          </div>
        </div>

        <aside className="h-fit space-y-4 md:sticky md:top-32">
          <div className="card p-6">
            <AddToCart product={product} />
            {ml && (
              <a href={ml} target="_blank" rel="noopener" className="btn-ml mt-3 w-full text-sm">
                {product.active ? "Comprar en Mercado Libre ↗" : "Ver en Mercado Libre ↗"}
              </a>
            )}
            <ul className="mt-5 space-y-2 border-t pt-4 text-xs text-muted">
              <li>✓ {product.freeShipping ? "Envío gratis a todo Chile" : `Envío a todo Chile, gratis sobre ${formatCLP(settings.freeShippingFrom)}`}</li>
              <li>✓ Retiro en tienda en La Cisterna</li>
              <li>✓ Garantía legal de {product.warranty || "3 meses"}</li>
              <li>✓ Boleta o factura</li>
            </ul>
          </div>
        </aside>
      </div>
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl font-bold">
            {product.make && related[0].make === product.make ? `Más para ${product.make} ${product.model}` : "Productos relacionados"}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
