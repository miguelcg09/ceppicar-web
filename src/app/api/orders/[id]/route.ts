import { NextResponse } from "next/server";
import { getOrder } from "@/lib/orders";

// Resumen público de un pedido para la página de confirmación (sin datos personales).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  return NextResponse.json({
    id: order.id,
    status: order.status,
    items: order.items,
    shipping: order.shipping,
    total: order.total,
    emailHint: order.customer.email.replace(/^(.).+(@.+)$/, "$1***$2"),
  });
}
