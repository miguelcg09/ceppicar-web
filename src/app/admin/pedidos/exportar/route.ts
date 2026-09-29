import { isAdmin } from "@/lib/admin";
import { searchOrders, type OrderStatus } from "@/lib/orders";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

// Descarga los pedidos como CSV (se abre en Excel) con los mismos filtros de la lista.
export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("No autorizado", { status: 401 });
  const url = new URL(req.url);
  const status = (url.searchParams.get("estado") || "todos") as OrderStatus | "todos";
  const orders = await searchOrders({ status, q: url.searchParams.get("q") ?? "", limit: 5000 });
  const head = ["Pedido", "Fecha", "Estado", "Cliente", "RUT", "Correo", "Teléfono", "Entrega", "Dirección", "Comuna", "Región", "Vehículo", "Documento", "Productos", "Subtotal", "Envío", "Total", "Ref. pago", "Seguimiento", "Nota"];
  const lines = orders.map((o) => [
    o.id, new Date(o.createdAt).toLocaleString("es-CL", { timeZone: "America/Santiago" }), o.status, o.customer.name, o.customer.rut, o.customer.email, o.customer.phone,
    o.customer.delivery === "retiro" ? "Retiro en tienda" : "Envío", o.customer.address, o.customer.comuna, o.customer.region, o.customer.vehicle,
    o.customer.invoice ? `Factura: ${o.customer.invoice}` : "Boleta", o.items.map((i) => `${i.name} x${i.qty}`).join(" | "),
    o.subtotal, o.shipping, o.total, o.paymentRef ?? "", o.tracking ?? "", o.note ?? "",
  ].map(cell).join(";"));
  const csv = "﻿" + [head.map(cell).join(";"), ...lines].join("\r\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="pedidos-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
