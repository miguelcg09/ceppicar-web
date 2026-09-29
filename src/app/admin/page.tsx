import Link from "next/link";
import { getProducts, stockSummary } from "@/lib/catalog";
import { countOrdersByStatus, salesSummary, searchOrders, topProducts } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { formatCLP } from "@/lib/products";

export const dynamic = "force-dynamic";

// Resumen del negocio: qué hay que despachar hoy, cómo van las ventas y qué se está agotando.
export default async function Resumen() {
  const settings = await getSettings();
  const [ventas, porEstado, recientes, top, stock, products] = await Promise.all([
    salesSummary(), countOrdersByStatus(), searchOrders({ limit: 6 }), topProducts(5), stockSummary(settings.lowStock), getProducts({ includeHidden: true }),
  ]);
  const fmtDate = (iso: string) => new Date(iso).toLocaleString("es-CL", { timeZone: "America/Santiago", dateStyle: "short", timeStyle: "short" });
  const lowList = products
    .filter((p) => p.visible)
    .flatMap((p) => p.variants.filter((v) => v.stock != null && v.stock <= settings.lowStock).map((v) => ({ p, v })))
    .sort((a, b) => (a.v.stock ?? 0) - (b.v.stock ?? 0))
    .slice(0, 8);
  const badge = (n: number, tone: string) => <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>{n}</span>;

  const kpis = [
    { label: "Ventas de hoy", value: formatCLP(ventas.hoy.total), sub: `${ventas.hoy.n} pedidos` },
    { label: "Últimos 7 días", value: formatCLP(ventas.semana.total), sub: `${ventas.semana.n} pedidos` },
    { label: "Últimos 30 días", value: formatCLP(ventas.mes.total), sub: `${ventas.mes.n} pedidos` },
    { label: "Ticket promedio (30 días)", value: ventas.mes.n ? formatCLP(Math.round(ventas.mes.total / ventas.mes.n)) : "—", sub: "por pedido cobrado" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Resumen</h1>
          <p className="mt-1 text-sm text-muted">Lo que necesita tu atención hoy y cómo van las ventas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/productos/nuevo" className="btn-primary text-sm">+ Nuevo producto</Link>
          <Link href="/admin/mercadolibre" className="btn-ghost text-sm">Actualizar desde Mercado Libre</Link>
        </div>
      </div>

      {/* Pendientes de acción */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/pedidos?estado=pagado" className={`card card-hover p-4 ${porEstado.pagado ? "border-cta ring-2 ring-cta/40" : ""}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Por despachar</p>
          <p className="mt-1 font-display text-3xl font-bold">{porEstado.pagado}</p>
          <p className="text-xs text-muted">pedidos pagados esperando envío o retiro</p>
        </Link>
        <Link href="/admin/pedidos?estado=pendiente" className="card card-hover p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Pendientes de pago</p>
          <p className="mt-1 font-display text-3xl font-bold">{porEstado.pendiente}</p>
          <p className="text-xs text-muted">iniciados y sin pago confirmado</p>
        </Link>
        <Link href="/admin/productos?stock=agotados" className={`card card-hover p-4 ${stock.agotados ? "border-red-300" : ""}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Agotados visibles</p>
          <p className="mt-1 font-display text-3xl font-bold">{stock.agotados}</p>
          <p className="text-xs text-muted">se muestran como “Agotado” en la tienda</p>
        </Link>
        <Link href="/admin/productos?stock=bajo" className="card card-hover p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Stock bajo</p>
          <p className="mt-1 font-display text-3xl font-bold">{stock.bajos}</p>
          <p className="text-xs text-muted">con {settings.lowStock} unidades o menos</p>
        </Link>
      </div>

      {/* Ventas */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg bg-navy p-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{k.label}</p>
            <p className="mt-1 font-display text-2xl font-bold">{k.value}</p>
            <p className="text-xs text-white/70">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Últimos pedidos */}
        <section className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Últimos pedidos</h2>
            <Link href="/admin/pedidos" className="text-sm font-semibold text-accent hover:underline">Ver todos ›</Link>
          </div>
          {recientes.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Todavía no hay pedidos.</p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <tbody>
                {recientes.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="py-2 font-mono text-xs">{o.id}</td>
                    <td className="py-2">{o.customer.name}</td>
                    <td className="py-2 text-muted">{fmtDate(o.createdAt)}</td>
                    <td className="py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${o.status === "pagado" ? "bg-accent/15 text-accent" : o.status === "despachado" ? "bg-ok/15 text-ok" : o.status === "fallido" ? "bg-red-500/15 text-red-600" : "bg-amber-400/15 text-amber-700"}`}>
                        {o.status === "despachado" && o.customer.delivery === "retiro" ? "listo para retiro" : o.status}
                      </span>
                    </td>
                    <td className="py-2 text-right font-semibold tabular">{formatCLP(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Más vendidos */}
        <section className="card p-5">
          <h2 className="font-semibold">Más vendidos (90 días)</h2>
          {top.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Aparecerán cuando haya ventas cobradas.</p>
          ) : (
            <ol className="mt-3 space-y-2 text-sm">
              {top.map((t, i) => (
                <li key={t.variantId} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-bold">{i + 1}</span>
                  <span className="min-w-0 grow truncate" title={t.name}>{t.name}</span>
                  <span className="shrink-0 text-muted">{t.qty} u.</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Stock bajo */}
        <section className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Stock bajo o agotado</h2>
            <Link href="/admin/productos?stock=bajo" className="text-sm font-semibold text-accent hover:underline">Ver todos ›</Link>
          </div>
          {lowList.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Nada por reponer por ahora.</p>
          ) : (
            <ul className="mt-3 divide-y text-sm">
              {lowList.map(({ p, v }) => (
                <li key={v.id} className="flex items-center gap-3 py-2">
                  <span className="min-w-0 grow truncate">{p.name}{p.variants.length > 1 && <span className="text-muted"> · {v.label}</span>}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${v.stock === 0 ? "bg-red-500/15 text-red-600" : "bg-amber-400/20 text-amber-800"}`}>
                    {v.stock === 0 ? "Agotado" : `${v.stock} u.`}
                  </span>
                  <Link href={`/admin/productos?q=${encodeURIComponent(p.mlId || p.name)}`} className="shrink-0 text-xs font-semibold text-accent hover:underline">Editar</Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Catálogo */}
        <section className="card p-5">
          <h2 className="font-semibold">Catálogo</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex justify-between"><span>Visibles en la tienda</span>{badge(stock.visibles, "bg-accent/15 text-accent")}</li>
            <li className="flex justify-between"><span>Ocultos (pausados en ML)</span>{badge(stock.ocultos, "bg-surface-2 text-muted")}</li>
            <li className="flex justify-between"><span>Activos en Mercado Libre</span>{badge(stock.activosMl, "bg-cta/30 text-on-cta")}</li>
            <li className="flex justify-between"><span>Visibles sin foto</span>{badge(stock.sinFoto, stock.sinFoto ? "bg-amber-400/20 text-amber-800" : "bg-surface-2 text-muted")}</li>
            <li className="flex justify-between"><span>Visibles sin publicación ML</span>{badge(stock.sinMl, "bg-surface-2 text-muted")}</li>
          </ul>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <Link href="/admin/productos" className="btn-ghost py-2 text-sm">Gestionar productos</Link>
            <a href="/admin/productos/exportar" className="btn-ghost py-2 text-sm">Descargar catálogo (CSV)</a>
          </div>
        </section>
      </div>
    </div>
  );
}
