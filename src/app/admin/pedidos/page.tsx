import { listOrders } from "@/lib/orders";
import { formatCLP } from "@/lib/products";
import { removeOrder, saveOrderNote, shipOrder } from "../actions";

export const dynamic = "force-dynamic";

const tone: Record<string, string> = {
  pagado: "bg-accent/15 text-accent",
  despachado: "bg-ok/15 text-ok",
  pendiente: "bg-amber-400/15 text-amber-700 dark:text-amber-300",
  fallido: "bg-red-500/15 text-red-600 dark:text-red-300",
};

export default async function Pedidos({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const orders = await listOrders(200);
  const fmtDate = (iso: string) => new Date(iso).toLocaleString("es-CL", { timeZone: "America/Santiago" });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Pedidos</h1>
      <p className="mt-1 text-sm text-muted">{orders.length} pedidos, del más reciente al más antiguo.</p>
      {error && <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">La clave no es válida.</p>}
      {orders.length === 0 ? (
        <p className="mt-10 text-muted">Todavía no hay pedidos.</p>
      ) : (
        <div className="mt-8 space-y-3">
          {orders.map((o) => {
            const deletable = o.paymentRef === "modo-prueba" || o.status === "pendiente" || o.status === "fallido";
            const retiro = o.customer.delivery === "retiro";
            return (
              <details key={o.id} className="rounded-2xl border bg-surface">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 text-sm">
                  <span className="font-mono font-semibold">{o.id}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone[o.status]}`}>
                    {o.status === "despachado" && retiro ? "listo para retiro" : o.status}
                  </span>
                  {retiro && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs">Retiro</span>}
                  <span className="text-muted">{fmtDate(o.createdAt)}</span>
                  <span className="grow">{o.customer.name}</span>
                  <span className="font-semibold tabular">{formatCLP(o.total)}</span>
                </summary>
                <div className="grid gap-6 border-t px-5 py-4 text-sm md:grid-cols-2">
                  <div>
                    <p className="font-semibold">Cliente</p>
                    <p className="mt-1 text-muted">
                      {o.customer.name} · RUT {o.customer.rut}<br />
                      {o.customer.email} · {o.customer.phone}<br />
                      {retiro ? "Retira en tienda" : `${o.customer.address}, ${o.customer.comuna}, ${o.customer.region}`}
                    </p>
                    {o.customer.vehicle && <p className="mt-2 text-xs text-muted">Vehículo: <strong className="text-fg">{o.customer.vehicle}</strong></p>}
                    <p className="mt-1 text-xs text-muted">Documento: {o.customer.invoice ? <strong className="text-fg">Factura · {o.customer.invoice}</strong> : "Boleta"}</p>
                    {o.paymentRef && <p className="mt-2 text-xs text-muted">Ref. pago: {o.paymentRef}</p>}
                    {o.status === "despachado" && (
                      <p className="mt-2 text-xs text-muted">
                        {retiro ? "Listo" : "Despachado"} {o.shippedAt && fmtDate(o.shippedAt)}
                        {o.tracking && o.tracking !== "-" && <> · {retiro ? "Indicaciones" : "Seguimiento"}: <strong className="text-fg">{o.tracking}</strong></>}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">Productos</p>
                    <ul className="mt-1 space-y-1 text-muted">
                      {o.items.map((i) => (
                        <li key={i.variantId} className="flex justify-between gap-3">
                          <span>{i.name} × {i.qty}</span><span className="shrink-0 tabular">{formatCLP(i.unitPrice * i.qty)}</span>
                        </li>
                      ))}
                      <li className="flex justify-between"><span>Envío</span><span>{o.shipping ? formatCLP(o.shipping) : retiro ? "Retiro" : "Gratis"}</span></li>
                      <li className="flex justify-between font-semibold text-fg"><span>Total</span><span>{formatCLP(o.total)}</span></li>
                    </ul>
                  </div>

                  {o.status === "pagado" && (
                    <form action={shipOrder} className="flex flex-wrap items-end gap-2 rounded-xl border p-3 md:col-span-2">
                      <input type="hidden" name="id" value={o.id} />
                      <label className="grow text-xs text-muted">
                        {retiro ? "Indicaciones para el retiro (opcional)" : "Número de seguimiento (Chilexpress, Starken, Blue…)"}
                        <input name="tracking" required={!retiro} placeholder={retiro ? "Ej: lunes a viernes de 10 a 18 h" : "Ej: 123456789"} className="field" />
                      </label>
                      <button className="btn-primary text-sm">{retiro ? "Marcar listo y avisar al cliente" : "Marcar despachado y avisar al cliente"}</button>
                    </form>
                  )}

                  <form action={saveOrderNote} className="flex flex-wrap items-end gap-2 md:col-span-2">
                    <input type="hidden" name="id" value={o.id} />
                    <label className="grow text-xs text-muted">
                      Nota interna
                      <input name="note" defaultValue={o.note ?? ""} placeholder="Solo la ves tú" className="field" />
                    </label>
                    <button className="btn-ghost text-sm">Guardar nota</button>
                    {deletable && (
                      <button formAction={removeOrder.bind(null, o.id)} className="ml-auto text-xs text-red-500 hover:underline">
                        Eliminar pedido
                      </button>
                    )}
                  </form>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
