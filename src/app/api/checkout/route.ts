import { NextResponse } from "next/server";
import { findVariant, decrementStock } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { getPaymentProvider } from "@/lib/payments";
import { isValidRut } from "@/lib/rut";
import { createOrder, markPaid, newOrderId, type Delivery, type OrderItem } from "@/lib/orders";
import { sendOrderEmails } from "@/lib/email";

type Body = {
  lines: { variantId: string; qty: number }[];
  customer: Record<string, string>;
};

export async function POST(req: Request) {
  const { lines, customer } = (await req.json()) as Body;
  const settings = await getSettings();

  if (!Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
  }
  if (!customer?.termsAck) {
    return NextResponse.json({ error: "Debes aceptar los términos y condiciones" }, { status: 400 });
  }
  const delivery: Delivery = customer.delivery === "retiro" ? "retiro" : "envio";
  const required = delivery === "retiro" ? (["name", "email", "phone"] as const) : (["name", "email", "phone", "address", "region", "comuna"] as const);
  if (required.some((k) => !customer[k]?.trim()) || !isValidRut(customer.rut ?? "")) {
    return NextResponse.json({ error: "Datos de contacto incompletos o RUT inválido" }, { status: 400 });
  }

  // Los precios se recalculan en el servidor; nunca se confía en montos del navegador.
  let subtotal = 0;
  let allFree = true;
  const items: OrderItem[] = [];
  for (const line of lines) {
    const found = await findVariant(line.variantId);
    const qty = Math.floor(Number(line.qty));
    if (!found || !(qty >= 1 && qty <= 99)) {
      return NextResponse.json({ error: "Producto inválido en el carrito" }, { status: 400 });
    }
    if (found.variant.stock != null && found.variant.stock < qty) {
      return NextResponse.json(
        { error: `${found.product.name}: ${found.variant.stock === 0 ? "agotado" : `solo quedan ${found.variant.stock}`}` },
        { status: 409 },
      );
    }
    subtotal += found.variant.price * qty;
    allFree = allFree && found.product.freeShipping;
    const label = found.variant.label === "Unidad" ? "" : ` · ${found.variant.label}`;
    items.push({ variantId: line.variantId, name: `${found.product.name}${label}`, qty, unitPrice: found.variant.price });
  }
  const shipping = delivery === "retiro" || allFree || subtotal >= settings.freeShippingFrom ? 0 : settings.shippingCost;

  const order = await createOrder({
    id: newOrderId(),
    customer: {
      name: customer.name.trim(),
      email: customer.email.trim(),
      phone: customer.phone.trim(),
      rut: customer.rut.trim(),
      delivery,
      address: delivery === "retiro" ? "" : customer.address.trim(),
      region: delivery === "retiro" ? "" : customer.region.trim(),
      comuna: delivery === "retiro" ? "" : customer.comuna.trim(),
      vehicle: (customer.vehicle ?? "").trim(),
      invoice: customer.wantsInvoice === "on" ? (customer.invoice ?? "").trim() : "",
    },
    items,
    subtotal,
    shipping,
    total: subtotal + shipping,
  });

  try {
    const { redirectUrl } = await getPaymentProvider().createPayment({
      orderId: order.id,
      amount: order.total,
      description: `Pedido ${order.id} · ${settings.name}`,
      items: order.shipping ? [...order.items, { name: "Envío", qty: 1, unitPrice: order.shipping }] : order.items,
      customer: { name: order.customer.name, email: order.customer.email, rut: order.customer.rut },
    });

    // En modo de prueba no hay pasarela que avise: se confirma el pago aquí mismo.
    if ((process.env.PAYMENT_PROVIDER ?? "mock") === "mock") {
      const paid = await markPaid(order.id, "modo-prueba");
      if (paid) {
        await decrementStock(paid.items);
        await sendOrderEmails(paid, settings);
      }
    }

    return NextResponse.json({ orderId: order.id, redirectUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No pudimos iniciar el pago. Intenta nuevamente." }, { status: 502 });
  }
}
