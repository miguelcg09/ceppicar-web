import "server-only";
import { query } from "./db";

export type OrderStatus = "pendiente" | "pagado" | "despachado" | "fallido";

export type OrderItem = {
  variantId: string;
  name: string; // "Amortiguadores Traseros Chevrolet Sail 1.4 2011-2020 Par · Unidad"
  qty: number;
  unitPrice: number;
};

export type Delivery = "envio" | "retiro";

export type OrderCustomer = {
  name: string;
  email: string;
  phone: string;
  rut: string;
  delivery: Delivery;
  address: string; // vacío si retira en tienda
  region: string;
  comuna: string;
  vehicle: string; // "Chevrolet Sail 2015" o VIN, para verificar compatibilidad
  invoice: string; // razón social, RUT y giro si pide factura; vacío = boleta
};

export type Order = {
  id: string;
  status: OrderStatus;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentRef: string | null;
  createdAt: string;
  paidAt: string | null;
  tracking: string | null;
  shippedAt: string | null;
  note: string | null;
};

type OrderRow = {
  id: string;
  status: OrderStatus;
  customer: OrderCustomer | string;
  items: OrderItem[] | string;
  subtotal: number;
  shipping: number;
  total: number;
  payment_ref: string | null;
  created_at: string | Date;
  paid_at: string | Date | null;
  tracking: string | null;
  shipped_at: string | Date | null;
  note: string | null;
};

const asJson = <T,>(v: T | string): T => (typeof v === "string" ? (JSON.parse(v) as T) : v);
const asIso = (v: string | Date | null) => (v == null ? null : new Date(v).toISOString());

function toOrder(r: OrderRow): Order {
  return {
    id: r.id,
    status: r.status,
    customer: asJson(r.customer),
    items: asJson(r.items),
    subtotal: Number(r.subtotal),
    shipping: Number(r.shipping),
    total: Number(r.total),
    paymentRef: r.payment_ref,
    createdAt: asIso(r.created_at)!,
    paidAt: asIso(r.paid_at),
    tracking: r.tracking ?? null,
    shippedAt: asIso(r.shipped_at ?? null),
    note: r.note ?? null,
  };
}

export function newOrderId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `CP-${stamp}${rand}`;
}

export async function createOrder(
  input: Omit<Order, "status" | "paymentRef" | "createdAt" | "paidAt" | "tracking" | "shippedAt" | "note">,
) {
  const [row] = await query<OrderRow>(
    `INSERT INTO orders (id, customer, items, subtotal, shipping, total)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [input.id, JSON.stringify(input.customer), JSON.stringify(input.items), input.subtotal, input.shipping, input.total],
  );
  return toOrder(row);
}

export async function getOrder(id: string) {
  const [row] = await query<OrderRow>(`SELECT * FROM orders WHERE id = $1`, [id]);
  return row ? toOrder(row) : null;
}

// Marca el pedido como pagado una sola vez; devuelve null si ya lo estaba (evita correos duplicados).
export async function markPaid(id: string, paymentRef: string | null) {
  const [row] = await query<OrderRow>(
    `UPDATE orders SET status = 'pagado', payment_ref = $2, paid_at = now()
     WHERE id = $1 AND status <> 'pagado' AND status <> 'despachado' RETURNING *`,
    [id, paymentRef],
  );
  return row ? toOrder(row) : null;
}

export async function markFailed(id: string, paymentRef: string | null) {
  await query(`UPDATE orders SET status = 'fallido', payment_ref = $2 WHERE id = $1 AND status = 'pendiente'`, [id, paymentRef]);
}

// Marca como despachado (o listo para retiro) con número de seguimiento; devuelve null si no estaba pagado.
export async function markShipped(id: string, tracking: string) {
  const [row] = await query<OrderRow>(
    `UPDATE orders SET status = 'despachado', tracking = $2, shipped_at = now()
     WHERE id = $1 AND status = 'pagado' RETURNING *`,
    [id, tracking],
  );
  return row ? toOrder(row) : null;
}

export async function setOrderNote(id: string, note: string) {
  await query(`UPDATE orders SET note = $2 WHERE id = $1`, [id, note || null]);
}

export async function deleteOrder(id: string) {
  await query(`DELETE FROM orders WHERE id = $1`, [id]);
}

export async function listOrders(limit = 100) {
  const rows = await query<OrderRow>(`SELECT * FROM orders ORDER BY created_at DESC LIMIT $1`, [limit]);
  return rows.map(toOrder);
}

// Pedidos filtrados para el panel: por estado y texto (número, nombre, correo, RUT, teléfono).
export async function searchOrders(opts: { status?: OrderStatus | "todos"; q?: string; limit?: number } = {}) {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (opts.status && opts.status !== "todos") {
    params.push(opts.status);
    conds.push(`status = $${params.length}`);
  }
  if (opts.q?.trim()) {
    params.push(`%${opts.q.trim()}%`);
    const n = params.length;
    conds.push(`(id ILIKE $${n} OR customer::text ILIKE $${n} OR items::text ILIKE $${n} OR coalesce(tracking,'') ILIKE $${n})`);
  }
  params.push(opts.limit ?? 200);
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const rows = await query<OrderRow>(`SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT $${params.length}`, params);
  return rows.map(toOrder);
}

export async function countOrdersByStatus() {
  const rows = await query<{ status: OrderStatus; n: number }>("SELECT status, count(*)::int AS n FROM orders GROUP BY status");
  const out: Record<OrderStatus, number> = { pendiente: 0, pagado: 0, despachado: 0, fallido: 0 };
  for (const r of rows) out[r.status] = Number(r.n);
  return out;
}

// Ventas cobradas (pagadas o despachadas): hoy, últimos 7 días, últimos 30 días y total histórico.
export async function salesSummary() {
  const rows = await query<{ periodo: string; n: number; total: number }>(`
    SELECT periodo, count(*)::int AS n, coalesce(sum(total),0)::int AS total FROM (
      SELECT total,
        CASE WHEN paid_at >= date_trunc('day', now() AT TIME ZONE 'America/Santiago') AT TIME ZONE 'America/Santiago' THEN 'hoy'
             WHEN paid_at >= now() - interval '7 days' THEN 'semana'
             WHEN paid_at >= now() - interval '30 days' THEN 'mes'
             ELSE 'antes' END AS periodo
      FROM orders WHERE status IN ('pagado','despachado') AND paid_at IS NOT NULL
    ) t GROUP BY periodo`);
  const get = (k: string) => rows.find((r) => r.periodo === k) ?? { n: 0, total: 0 };
  const hoy = get("hoy"), semana = get("semana"), mes = get("mes");
  return {
    hoy: { n: Number(hoy.n), total: Number(hoy.total) },
    semana: { n: Number(hoy.n) + Number(semana.n), total: Number(hoy.total) + Number(semana.total) },
    mes: { n: Number(hoy.n) + Number(semana.n) + Number(mes.n), total: Number(hoy.total) + Number(semana.total) + Number(mes.total) },
    total: { n: rows.reduce((a, r) => a + Number(r.n), 0), total: rows.reduce((a, r) => a + Number(r.total), 0) },
  };
}

// Productos más vendidos (por unidades) entre los pedidos cobrados de los últimos 90 días.
export async function topProducts(limit = 5) {
  const rows = await query<OrderRow>(
    `SELECT * FROM orders WHERE status IN ('pagado','despachado') AND created_at >= now() - interval '90 days' ORDER BY created_at DESC LIMIT 500`,
  );
  const acc = new Map<string, { name: string; qty: number; total: number }>();
  for (const o of rows.map(toOrder)) {
    for (const it of o.items) {
      const cur = acc.get(it.variantId) ?? { name: it.name, qty: 0, total: 0 };
      cur.qty += it.qty;
      cur.total += it.qty * it.unitPrice;
      acc.set(it.variantId, cur);
    }
  }
  return [...acc.entries()].map(([variantId, v]) => ({ variantId, ...v })).sort((a, b) => b.qty - a.qty).slice(0, limit);
}
