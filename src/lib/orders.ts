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
