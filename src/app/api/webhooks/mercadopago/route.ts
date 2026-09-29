import { NextResponse } from "next/server";
import { markFailed, markPaid } from "@/lib/orders";
import { sendOrderEmails } from "@/lib/email";
import { getSettings } from "@/lib/settings";
import { decrementStock } from "@/lib/catalog";

// Notificación de Mercado Pago (Webhooks / IPN) cuando cambia un pago.
// No se confía en el cuerpo recibido: se consulta el pago en la API de Mercado Pago
// con el access token y solo entonces se marca el pedido como pagado.
// Documentación: https://www.mercadopago.cl/developers/es/docs/your-integrations/notifications/webhooks

type Notification = { type?: string; topic?: string; action?: string; data?: { id?: string }; id?: string };
type Payment = { id: number; status: string; external_reference: string | null; transaction_amount: number };

export async function POST(req: Request) {
  const url = new URL(req.url);
  const body = (await req.json().catch(() => null)) as Notification | null;
  const type = body?.type ?? body?.topic ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const paymentId = body?.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id");

  // Mercado Pago también avisa de merchant_order, plan, etc.; solo nos interesan los pagos.
  if (type !== "payment" || !paymentId) return NextResponse.json({ ok: true, ignored: true });

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "Pasarela no configurada" }, { status: 500 });

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    console.error(`Mercado Pago respondió ${res.status} al consultar el pago ${paymentId}`);
    return NextResponse.json({ error: "No se pudo verificar el pago" }, { status: 502 });
  }
  const payment = (await res.json()) as Payment;
  const orderId = payment.external_reference;
  if (!orderId) return NextResponse.json({ ok: true, ignored: true });

  if (payment.status === "approved") {
    const paid = await markPaid(orderId, String(payment.id));
    if (paid) {
      await decrementStock(paid.items);
      await sendOrderEmails(paid, await getSettings());
    }
  } else if (["rejected", "cancelled", "refunded", "charged_back"].includes(payment.status)) {
    await markFailed(orderId, String(payment.id));
  }

  return NextResponse.json({ ok: true });
}
