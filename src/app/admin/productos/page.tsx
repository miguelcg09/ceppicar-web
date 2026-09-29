import Link from "next/link";
import { getProducts } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { categories, categoryMeta, formatCLP, mlUrl, vehicleLabel } from "@/lib/products";
import { ProductImage } from "@/components/ProductImage";
import { bulkProductsAction, quickVariantAction, removeProduct, toggleProductVisible } from "../actions";

export const dynamic = "force-dynamic";
const PAGE = 50;

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

type Params = { q?: string; ver?: string; pagina?: string; categoria?: string; stock?: string; orden?: string; aviso?: string };

export default async function Productos({ searchParams }: { searchParams: Promise<Params> }) {
  const { q = "", ver = "visibles", pagina, categoria = "", stock = "", orden = "", aviso } = await searchParams;
  const [all, settings] = await Promise.all([getProducts({ includeHidden: true }), getSettings()]);
  const words = norm(q).split(/\s+/).filter(Boolean);
  const list = all.filter((p) => {
    if (ver === "visibles" && !p.visible) return false;
    if (ver === "ocultos" && p.visible) return false;
    if (categoria && p.category !== categoria) return false;
    if (stock === "agotados" && !p.variants.some((v) => v.stock === 0)) return false;
    if (stock === "bajo" && !p.variants.some((v) => v.stock != null && v.stock <= settings.lowStock)) return false;
    if (stock === "sinfoto" && p.imageUrl) return false;
    if (stock === "sinml" && p.mlId) return false;
    if (stock === "destacados" && !p.featured) return false;
    if (!words.length) return true;
    const hay = norm(`${p.name} ${p.sku} ${p.mlId} ${p.make} ${p.model} ${p.brand}`);
    return words.every((w) => hay.includes(w));
  });
  const price = (p: (typeof all)[number]) => Math.min(...p.variants.map((v) => v.price));
  const stockOf = (p: (typeof all)[number]) => p.variants.reduce((a, v) => a + (v.stock ?? 0), 0);
  if (orden === "precio-asc") list.sort((a, b) => price(a) - price(b));
  else if (orden === "precio-desc") list.sort((a, b) => price(b) - price(a));
  else if (orden === "stock") list.sort((a, b) => stockOf(a) - stockOf(b));
  else if (orden === "nombre") list.sort((a, b) => a.name.localeCompare(b.name, "es"));

  const page = Math.max(1, Number(pagina) || 1);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const shown = list.slice((page - 1) * PAGE, page * PAGE);
  const href = (patch: Record<string, string | undefined>) => {
    const s = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, ver, categoria, stock, orden, ...patch })) if (v) s.set(k, v);
    return `/admin/productos?${s}`;
  };
  const back = href({ pagina: page > 1 ? String(page) : undefined });
  const chip = (label: string, key: string, value: string, active: boolean) => (
    <Link key={key + value} href={href({ [key]: active ? "" : value, pagina: undefined })} className={`rounded-full border px-3 py-1 text-xs font-medium ${active ? "border-accent bg-accent text-on-accent" : "hover:border-accent"}`}>
      {label}
    </Link>
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Productos</h1>
          <p className="mt-1 text-sm text-muted">
            {all.filter((p) => p.visible).length} visibles en la tienda · {all.filter((p) => !p.visible).length} ocultos (pausados en Mercado Libre).
            Cambia precio y stock directamente en la lista y pulsa Guardar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/admin/productos/exportar" className="btn-ghost text-sm">Descargar CSV</a>
          <Link href="/admin/mercadolibre" className="btn-ghost text-sm">Importar de Mercado Libre</Link>
          <Link href="/admin/productos/nuevo" className="btn-primary text-sm">+ Nuevo producto</Link>
        </div>
      </div>

      {aviso && <p className="mt-4 rounded-lg bg-accent/10 p-3 text-sm text-accent">{aviso}</p>}

      {/* Búsqueda y filtros */}
      <form className="mt-6 flex flex-wrap items-center gap-2">
        <input name="q" defaultValue={q} placeholder="Buscar por nombre, código, MLC, marca o vehículo" className="field mt-0 max-w-md py-2 text-sm" />
        <select name="ver" defaultValue={ver} className="field mt-0 w-auto py-2 text-sm">
          <option value="visibles">Solo visibles</option>
          <option value="ocultos">Solo ocultos</option>
          <option value="todos">Todos</option>
        </select>
        <select name="categoria" defaultValue={categoria} className="field mt-0 w-auto py-2 text-sm">
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c} value={c}>{categoryMeta[c].name}</option>)}
        </select>
        <select name="orden" defaultValue={orden} className="field mt-0 w-auto py-2 text-sm">
          <option value="">Orden del catálogo</option>
          <option value="nombre">Nombre A–Z</option>
          <option value="precio-asc">Precio: menor a mayor</option>
          <option value="precio-desc">Precio: mayor a menor</option>
          <option value="stock">Menos stock primero</option>
        </select>
        {stock && <input type="hidden" name="stock" value={stock} />}
        <button className="btn-ghost py-2 text-sm">Filtrar</button>
        <span className="text-sm text-muted">{list.length} resultados</span>
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Ver solo:</span>
        {chip("Agotados", "stock", "agotados", stock === "agotados")}
        {chip(`Stock bajo (≤ ${settings.lowStock})`, "stock", "bajo", stock === "bajo")}
        {chip("Sin foto", "stock", "sinfoto", stock === "sinfoto")}
        {chip("Destacados", "stock", "destacados", stock === "destacados")}
        {chip("Sin publicación ML", "stock", "sinml", stock === "sinml")}
      </div>

      {/* Acciones en lote: los productos se marcan con la casilla de cada fila (form="lote") */}
      <form id="lote" action={bulkProductsAction} className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border bg-surface-2 p-3 text-sm">
        <input type="hidden" name="back" value={back} />
        <span className="font-semibold">Con los marcados:</span>
        <button name="op" value="mostrar" className="btn-ghost py-1.5 text-xs">Mostrar</button>
        <button name="op" value="ocultar" className="btn-ghost py-1.5 text-xs">Ocultar</button>
        <button name="op" value="destacar" className="btn-ghost py-1.5 text-xs">Destacar</button>
        <button name="op" value="nodestacar" className="btn-ghost py-1.5 text-xs">Quitar destacado</button>
        <button name="op" value="envio" className="btn-ghost py-1.5 text-xs">Envío gratis</button>
        <button name="op" value="noenvio" className="btn-ghost py-1.5 text-xs">Sin envío gratis</button>
        <span className="ml-2 flex items-center gap-1">
          <input name="pct" type="number" step="0.5" placeholder="%" className="field mt-0 w-20 py-1.5 text-xs" aria-label="Porcentaje" />
          <button name="op" value="precio" className="btn-ghost py-1.5 text-xs" title="Ej: 5 sube 5 %, -10 baja 10 %. Redondea a $10.">Ajustar precios</button>
        </span>
        <button name="op" value="borrar" className="ml-auto text-xs text-red-500 hover:underline">Borrar marcados</button>
      </form>

      <div className="mt-4 space-y-2">
        {shown.map((p) => (
          <div key={p.slug} className={`flex flex-wrap items-center gap-3 rounded-2xl border bg-surface p-3 ${p.visible ? "" : "opacity-60"}`}>
            <input type="checkbox" name="slug" value={p.slug} form="lote" className="h-4 w-4 shrink-0 accent-accent" aria-label={`Marcar ${p.name}`} />
            <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-2 p-1">
              <ProductImage product={p} className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0 grow basis-64">
              <p className="flex items-center gap-2 font-medium" title={p.name}>
                <Link href={`/admin/productos/${p.slug}`} className="min-w-0 truncate hover:underline">{p.name}</Link>
                {p.featured && <span className="shrink-0 rounded-full bg-accent-2/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-accent">Destacado</span>}
                {!p.visible && <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">Oculto</span>}
                {!p.active && p.visible && <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">A pedido</span>}
                {p.freeShipping && <span className="shrink-0 rounded-full bg-ok/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-ok">Envío gratis</span>}
              </p>
              <p className="text-xs text-muted">
                {categoryMeta[p.category].name} · {vehicleLabel(p) || "sin vehículo"} ·{" "}
                {p.mlId ? <a href={mlUrl(p)} target="_blank" rel="noopener" className="hover:underline">{p.mlId} ↗</a> : "sin MLC"}
                {p.sku && ` · ${p.sku}`}
              </p>
            </div>
            {/* Edición rápida: una mini fila por opción */}
            <div className="flex flex-col gap-1">
              {p.variants.map((v) => (
                <form key={v.id} action={quickVariantAction} className="flex items-center gap-1 text-xs">
                  <input type="hidden" name="id" value={v.id} />
                  {p.variants.length > 1 && <span className="w-20 truncate text-muted" title={v.label}>{v.label}</span>}
                  <span className="text-muted">$</span>
                  <input name="price" type="number" min={1} defaultValue={v.price} className="field mt-0 w-24 py-1 text-right text-xs tabular" aria-label="Precio" />
                  <span className="ml-1 text-muted">Stock</span>
                  <input
                    name="stock" type="number" min={0} defaultValue={v.stock ?? ""} placeholder="∞" aria-label="Stock"
                    className={`field mt-0 w-16 py-1 text-right text-xs tabular ${v.stock === 0 ? "border-red-400 bg-red-500/10" : v.stock != null && v.stock <= settings.lowStock ? "border-amber-400 bg-amber-400/10" : ""}`}
                  />
                  <button className="btn-primary px-2 py-1 text-xs">Guardar</button>
                </form>
              ))}
              {p.variants.length === 0 && <span className="text-xs text-red-500">Sin precio: {formatCLP(0)}</span>}
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/admin/productos/${p.slug}`} className="btn-ghost py-2 text-sm">Editar</Link>
              <form action={toggleProductVisible.bind(null, p.slug, !p.visible)}>
                <button className="btn-ghost py-2 text-sm">{p.visible ? "Ocultar" : "Mostrar"}</button>
              </form>
              <form action={removeProduct.bind(null, p.slug)}>
                <button className="px-2 text-xs text-red-500 hover:underline">Borrar</button>
              </form>
            </div>
          </div>
        ))}
        {shown.length === 0 && <p className="py-10 text-center text-muted">No hay productos con ese filtro.</p>}
      </div>

      {pages > 1 && (
        <nav className="mt-8 flex flex-wrap justify-center gap-2 text-sm">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link key={n} href={href({ pagina: String(n) })} className={`grid h-9 min-w-9 place-items-center rounded-lg border px-2 ${n === page ? "border-accent bg-accent text-on-accent" : "hover:border-accent"}`}>
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
