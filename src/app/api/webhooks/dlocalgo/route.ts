import { NextResponse } from "next/server";
import { markFailed, markPaid } from "@/lib/orders";
import { sendOrderEmails } from "@/lib/email";
import { getSettings } from "@/lib/settings";
import { decrementStock } from "@/lib/catalog";

// Notificación de dLocal Go cuando cambia el estado de un pago.
// No se confía en el cuerpo recibido: se consulta el pago en la API de dLocal Go
// y solo entonces se marca el pedido como pagado y se envían los correos.
// Verificar nombres de campos contra la documentación vigente: https://docs.dlocalgo.com

type Notification = { payment_id?: string; id?: string; order_id?: string };
type Payment = { id: string; status: string; order_id: string; amount: number; currency: string };

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Notification | null;
  const paymentId = body?.payment_id ?? body?.id;
  if (!paymentId) return NextResponse.json({ error: "Falta payment_id" }, { status: 400 });

  const apiKey = process.env.DLOCALGO_API_KEY;
  const secretKey = process.env.DLOCALGO_SECRET_KEY;
  if (!apiKey || !secretKey) return NextResponse.json({ error: "Pasarela no configurada" }, { status: 500 });

  const base =
    process.env.DLOCALGO_SANDBOX === "false" ? "https://api.dlocalgo.com" : "https://api-sbx.dlocalgo.com";
  const res = await fetch(`${base}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${apiKey}:${secretKey}` },
  });
  if (!res.ok) {
    console.error(`dLocal Go respondió ${res.status} al consultar el pago ${paymentId}`);
    return NextResponse.json({ error: "No se pudo verificar el pago" }, { status: 502 });
  }
  const payment = (await res.json()) as Payment;

  if (payment.status === "PAID") {
    const paid = await markPaid(payment.order_id, payment.id);
    if (paid) {
      await decrementStock(paid.items);
      await sendOrderEmails(paid, await getSettings());
    }
  } else if (["REJECTED", "CANCELLED", "EXPIRED"].includes(payment.status)) {
    await markFailed(payment.order_id, payment.id);
  }

  return NextResponse.json({ ok: true });
}
