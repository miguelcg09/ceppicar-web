import "server-only";
import type { Settings } from "./config";
import { formatCLP } from "./products";
import type { Order } from "./orders";

// Correos transaccionales. Con RESEND_API_KEY se envían por Resend;
// sin ella se imprimen en la consola (útil en desarrollo).

type Mail = { to: string; subject: string; html: string; text: string };

async function send(mail: Mail, settings: Settings) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? `${settings.name} <onboarding@resend.dev>`;
  if (!apiKey) {
    console.log(`[correo no enviado: falta RESEND_API_KEY]\nPara: ${mail.to}\nAsunto: ${mail.subject}\n\n${mail.text}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, html: mail.html, text: mail.text }),
  });
  if (!res.ok) console.error(`Resend respondió ${res.status}: ${await res.text()}`);
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function itemsText(order: Order) {
  return order.items.map((i) => `- ${i.name} × ${i.qty}: ${formatCLP(i.unitPrice * i.qty)}`).join("\n");
}

function itemsHtml(order: Order) {
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${esc(i.name)} × ${i.qty}</td><td style="padding:6px 0;text-align:right;white-space:nowrap">${formatCLP(i.unitPrice * i.qty)}</td></tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
    <tr><td style="padding:6px 0;border-top:1px solid #ddd">Envío</td><td style="padding:6px 0;border-top:1px solid #ddd;text-align:right">${order.shipping ? formatCLP(order.shipping) : order.customer.delivery === "retiro" ? "Retiro en tienda" : "Gratis"}</td></tr>
    <tr><td style="padding:6px 0;font-weight:bold">Total</td><td style="padding:6px 0;text-align:right;font-weight:bold">${formatCLP(order.total)}</td></tr>
  </table>`;
}

function layout(settings: Settings, title: string, body: string) {
  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0a1830">
    <h1 style="font-size:20px;margin:0 0 16px;color:#0b3d91">${esc(settings.name)}</h1>
    <h2 style="font-size:17px;margin:0 0 12px">${title}</h2>
    ${body}
    <p style="font-size:12px;color:#777;margin-top:24px">${esc(settings.warranty)}</p>
    <p style="font-size:12px;color:#777">${esc(settings.name)} · ${esc(settings.email)} · WhatsApp ${esc(settings.whatsapp)}</p>
  </div>`;
}

const deliveryOf = (o: Order, s: Settings) =>
  o.customer.delivery === "retiro"
    ? `Retiro en tienda: ${s.address}`
    : `${o.customer.address}, ${o.customer.comuna}, ${o.customer.region}`;

export async function sendOrderEmails(order: Order, settings: Settings) {
  const c = order.customer;
  const where = deliveryOf(order, settings);
  const retiro = c.delivery === "retiro";

  const customerMail: Mail = {
    to: c.email,
    subject: `Pedido ${order.id} confirmado · ${settings.name}`,
    text: `Hola ${c.name},\n\nRecibimos tu pago. Este es el detalle de tu pedido ${order.id}:\n\n${itemsText(order)}\nEnvío: ${order.shipping ? formatCLP(order.shipping) : retiro ? "Retiro en tienda" : "Gratis"}\nTotal: ${formatCLP(order.total)}\n\n${retiro ? "Retiro" : "Despacho"}: ${where}\n${c.vehicle ? `Vehículo indicado: ${c.vehicle}\n` : ""}\n${retiro ? "Te avisaremos por este medio cuando esté listo para retirar." : "Te avisaremos por este medio cuando salga con su número de seguimiento."}\n\n${settings.name} · ${settings.email}`,
    html: layout(
      settings,
      `Recibimos tu pago, ${esc(c.name)}`,
      `<p>Este es el detalle de tu pedido <strong>${order.id}</strong>:</p>${itemsHtml(order)}
       <p style="margin-top:16px"><strong>${retiro ? "Retiro" : "Despacho a"}:</strong><br>${esc(where)}</p>
       ${c.vehicle ? `<p><strong>Vehículo indicado:</strong> ${esc(c.vehicle)}</p>` : ""}
       <p>${retiro ? "Te avisaremos cuando esté listo para retirar." : "Te avisaremos cuando salga con su número de seguimiento."}</p>`,
    ),
  };

  const storeMail: Mail = {
    to: process.env.ORDERS_NOTIFY_EMAIL ?? settings.email,
    subject: `Nuevo pedido ${order.id} · ${formatCLP(order.total)}`,
    text: `Pedido ${order.id} pagado.\n\nCliente: ${c.name}\nRUT: ${c.rut}\nCorreo: ${c.email}\nTeléfono: ${c.phone}\n${retiro ? "Retiro en tienda" : `Dirección: ${where}`}\nVehículo: ${c.vehicle || "-"}\nFactura: ${c.invoice || "no (boleta)"}\n\n${itemsText(order)}\nEnvío: ${order.shipping ? formatCLP(order.shipping) : retiro ? "Retiro" : "Gratis"}\nTotal: ${formatCLP(order.total)}\nReferencia de pago: ${order.paymentRef ?? "-"}`,
    html: layout(
      settings,
      `Nuevo pedido ${order.id}`,
      `<p><strong>${esc(c.name)}</strong> · RUT ${esc(c.rut)}<br>${esc(c.email)} · ${esc(c.phone)}<br>${esc(retiro ? "Retiro en tienda" : where)}</p>
       <p>Vehículo: ${esc(c.vehicle || "-")}<br>Factura: ${esc(c.invoice || "no (boleta)")}</p>${itemsHtml(order)}
       <p style="font-size:12px;color:#777">Referencia de pago: ${esc(order.paymentRef ?? "-")}</p>`,
    ),
  };

  await Promise.all([send(customerMail, settings), send(storeMail, settings)]);
}

export async function sendShippedEmail(order: Order, settings: Settings) {
  const c = order.customer;
  const tracking = order.tracking ?? "-";
  const retiro = c.delivery === "retiro";
  await send(
    {
      to: c.email,
      subject: retiro ? `Tu pedido ${order.id} está listo para retirar · ${settings.name}` : `Tu pedido ${order.id} va en camino · ${settings.name}`,
      text: retiro
        ? `Hola ${c.name},\n\nTu pedido ${order.id} está listo para retirar en ${settings.address}.\n\n${tracking !== "-" ? `Indicaciones: ${tracking}\n\n` : ""}${itemsText(order)}\n\n${settings.name} · ${settings.email}`
        : `Hola ${c.name},\n\nTu pedido ${order.id} fue despachado a ${deliveryOf(order, settings)}.\n\nNúmero de seguimiento: ${tracking}\n\n${itemsText(order)}\n\n${settings.name} · ${settings.email}`,
      html: layout(
        settings,
        retiro ? `Tu pedido está listo, ${esc(c.name)}` : `Tu pedido va en camino, ${esc(c.name)}`,
        retiro
          ? `<p>Tu pedido <strong>${order.id}</strong> está listo para retirar en ${esc(settings.address)}.</p>
             ${tracking !== "-" ? `<p><strong>Indicaciones:</strong> ${esc(tracking)}</p>` : ""}${itemsHtml(order)}`
          : `<p>Tu pedido <strong>${order.id}</strong> fue despachado a ${esc(deliveryOf(order, settings))}.</p>
             <p style="font-size:18px"><strong>Seguimiento:</strong> ${esc(tracking)}</p>${itemsHtml(order)}`,
      ),
    },
    settings,
  );
}
