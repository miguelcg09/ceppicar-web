import Link from "next/link";
import { getProducts } from "@/lib/catalog";
import { categoryMeta, formatCLP, vehicleLabel } from "@/lib/products";
import { ProductImage } from "@/components/ProductImage";
import { removeProduct, toggleProductVisible } from "../actions";

export const dynamic = "force-dynamic";
const PAGE = 50;

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default async function Productos({ searchParams }: { searchParams: Promise<{ q?: string; ver?: string; pagina?: string }> }) {
  const { q = "", ver = "visibles", pagina } = await searchParams;
  const all = await getProducts({ includeHidden: true });
  const words = norm(q).split(/\s+/).filter(Boolean);
  const list = all.filter((p) => {
    if (ver === "visibles" && !p.visible) return false;
    if (ver === "ocultos" && p.visible) return false;
    if (!words.length) return true;
    const hay = norm(`${p.name} ${p.sku} ${p.mlId} ${p.make} ${p.model}`);
    return words.every((w) => hay.includes(w));
  });
  const page = Math.max(1, Number(pagina) || 1);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const shown = list.slice((page - 1) * PAGE, page * PAGE);
  const href = (patch: Record<string, string | undefined>) => {
    const s = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, ver, ...patch })) if (v) s.set(k, v);
    return `/admin/productos?${s}`;
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Productos</h1>
          <p className="mt-1 text-sm text-muted">
            {all.filter((p) => p.visible).length} visibles en la tienda · {all.filter((p) => !p.visible).length} ocultos (pausados en Mercado Libre).
          </p>
        </div>
        <Link href="/admin/productos/nuevo" className="btn-primary text-sm">+ Nuevo producto</Link>
      </div>

      <form className="mt-6 flex flex-wrap items-center gap-2">
        <input name="q" defaultValue={q} placeholder="Buscar por nombre, código, MLC o vehículo" className="field mt-0 max-w-md py-2 text-sm" />
        <select name="ver" defaultValue={ver} className="field mt-0 w-auto py-2 text-sm">
          <option value="visibles">Solo visibles</option>
          <option value="ocultos">Solo ocultos</option>
          <option value="todos">Todos</option>
        </select>
        <button className="btn-ghost py-2 text-sm">Filtrar</button>
        <span className="text-sm text-muted">{list.length} resultados</span>
      </form>

      <div className="mt-6 space-y-2">
        {shown.map((p) => (
          <div key={p.slug} className={`flex flex-wrap items-center gap-4 rounded-2xl border bg-surface p-3 ${p.visible ? "" : "opacity-60"}`}>
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-surface-2 p-2">
              <ProductImage product={p} className="h-full w-full" />
            </div>
            <div className="min-w-0 grow">
              <p className="truncate font-medium">
                {p.name}
                {p.featured && <span className="ml-2 rounded-full bg-accent-2/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-accent">Destacado</span>}
                {!p.visible && <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">Oculto</span>}
                {!p.active && p.visible && <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">A pedido</span>}
              </p>
              <p className="text-xs text-muted">
                {categoryMeta[p.category].name} · {vehicleLabel(p) || "sin vehículo"} · {p.mlId || "sin MLC"}{p.sku && ` · ${p.sku}`}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                {p.variants.map((v) => `${v.label} ${formatCLP(v.price)}${v.stock != null ? ` (stock ${v.stock})` : ""}`).join(" · ")}
              </p>
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
