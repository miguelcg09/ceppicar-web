import Link from "next/link";
import type { Metadata } from "next";
import { categories, categoryMeta, type Product } from "@/lib/products";
import { getProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { VehicleFinder } from "@/components/VehicleFinder";

export const metadata: Metadata = { title: "Catálogo" };

type Params = { categoria?: string; marca?: string; modelo?: string; ano?: string; q?: string; orden?: string; pagina?: string };
const PAGE = 48;

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function matches(p: Product, f: Params) {
  if (f.categoria && p.category !== f.categoria) return false;
  if (f.marca && p.make && p.make !== f.marca) return false;
  if (f.marca && !p.make) return false;
  if (f.modelo && p.model !== f.modelo) return false;
  if (f.ano && p.yearFrom && !(Number(f.ano) >= p.yearFrom && Number(f.ano) <= (p.yearTo ?? p.yearFrom))) return false;
  if (f.q) {
    const hay = norm(`${p.name} ${p.sku} ${p.mlCategory} ${p.make} ${p.model} ${p.brand}`);
    if (!norm(f.q).split(/\s+/).filter(Boolean).every((w) => hay.includes(w))) return false;
  }
  return true;
}

function link(f: Params, patch: Params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...f, ...patch, pagina: undefined })) if (v) q.set(k, v);
  return `/productos${q.size ? `?${q}` : ""}`;
}

export default async function Productos({ searchParams }: { searchParams: Promise<Params> }) {
  const f = await searchParams;
  const products = await getProducts();
  const base = products.filter((p) => matches(p, { ...f, categoria: undefined }));
  let list = base.filter((p) => !f.categoria || p.category === f.categoria);
  const price = (p: Product) => Math.min(...p.variants.map((v) => v.price));
  if (f.orden === "menor") list = [...list].sort((a, b) => price(a) - price(b));
  else if (f.orden === "mayor") list = [...list].sort((a, b) => price(b) - price(a));
  else list = [...list].sort((a, b) => Number(b.active) - Number(a.active) || a.sort - b.sort);

  const page = Math.max(1, Number(f.pagina) || 1);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const shown = list.slice((page - 1) * PAGE, page * PAGE);
  const counts = Object.fromEntries(categories.map((c) => [c, base.filter((p) => p.category === c).length]));
  const vehicle = [f.marca, f.modelo, f.ano].filter(Boolean).join(" ");
  const chips = [
    f.q && { label: `“${f.q}”`, href: link(f, { q: undefined }) },
    vehicle && { label: vehicle, href: link(f, { marca: undefined, modelo: undefined, ano: undefined }) },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">
            {f.categoria ? categoryMeta[f.categoria as keyof typeof categoryMeta]?.name ?? "Catálogo" : "Catálogo"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {list.length.toLocaleString("es-CL")} repuesto{list.length === 1 ? "" : "s"}{vehicle ? ` para ${vehicle}` : ""}
          </p>
        </div>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <Link key={c.href} href={c.href} className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-on-accent hover:opacity-90">
                {c.label} ×
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border bg-surface p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Filtrar por vehículo</p>
        <VehicleFinder compact />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link href={link(f, { categoria: undefined })} className={`rounded-full border px-4 py-1.5 text-sm ${!f.categoria ? "border-accent bg-accent text-on-accent" : "hover:border-accent"}`}>
          Todas <span className="opacity-70">{base.length}</span>
        </Link>
        {categories.filter((c) => counts[c] > 0).map((c) => (
          <Link
            key={c}
            href={link(f, { categoria: c })}
            className={`rounded-full border px-4 py-1.5 text-sm ${f.categoria === c ? "border-accent bg-accent text-on-accent" : "hover:border-accent"}`}
          >
            {categoryMeta[c].name} <span className="opacity-70">{counts[c]}</span>
          </Link>
        ))}
        <div className="ml-auto flex items-center gap-2 text-sm text-muted">
          Ordenar
          {[["", "Relevancia"], ["menor", "Menor precio"], ["mayor", "Mayor precio"]].map(([v, t]) => (
            <Link key={v} href={link(f, { orden: v || undefined })} className={`rounded-full px-2.5 py-1 ${(f.orden ?? "") === v ? "bg-surface-2 font-medium text-fg" : "hover:text-fg"}`}>
              {t}
            </Link>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed p-12 text-center text-muted">
          <p>No encontramos repuestos con esos filtros{vehicle ? ` para ${vehicle}` : ""}.</p>
          <p className="mt-2 text-sm">Prueba con otra categoría, cambia el vehículo o escríbenos con tu VIN y te lo conseguimos.</p>
          <Link href="/productos" className="btn-ghost mt-6 text-sm">Ver todo el catálogo</Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((p) => <ProductCard key={p.slug} product={p} />)}
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-10 flex flex-wrap items-center justify-center gap-2 text-sm" aria-label="Páginas">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`${link(f, {})}${link(f, {}).includes("?") ? "&" : "?"}pagina=${n}`}
              className={`grid h-9 min-w-9 place-items-center rounded-lg border px-2 ${n === page ? "border-accent bg-accent text-on-accent" : "hover:border-accent"}`}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
