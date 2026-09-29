"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { formatCLP } from "@/lib/products";
import { isValidRut } from "@/lib/rut";

const regiones = [
  "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo", "Valparaíso",
  "Metropolitana", "O'Higgins", "Maule", "Ñuble", "Biobío", "La Araucanía", "Los Ríos",
  "Los Lagos", "Aysén", "Magallanes",
];

export default function Checkout() {
  const { lines, subtotal, shipping, find, settings, vehicle } = useCart();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [delivery, setDelivery] = useState<"envio" | "retiro">("envio");
  const [wantsInvoice, setWantsInvoice] = useState(false);
  const shippingNow = delivery === "retiro" ? 0 : shipping;
  const total = subtotal + shippingNow;
  const vehicleText = [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" ");

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold uppercase">No hay productos en tu carrito</h1>
        <Link href="/productos" className="btn-primary mt-6">Ver catálogo</Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const customer = Object.fromEntries(form.entries()) as Record<string, string>;
    if (!isValidRut(customer.rut)) return setError("El RUT ingresado no es válido.");

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines, customer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo iniciar el pago");
      window.location.href = data.redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setLoading(false);
    }
  }

  const input = "field";
  const option = (on: boolean) => `flex cursor-pointer gap-3 rounded-xl border p-4 text-sm transition ${on ? "border-accent bg-accent/10" : "hover:border-accent/50"}`;

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1fr_360px]">
      <form onSubmit={onSubmit} className="space-y-8">
        <h1 className="font-display text-4xl font-bold uppercase">Finalizar compra</h1>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 font-semibold">Datos de contacto</legend>
          <label className="text-sm sm:col-span-2">Nombre completo<input name="name" required autoComplete="name" className={input} /></label>
          <label className="text-sm">Correo electrónico<input name="email" type="email" required autoComplete="email" className={input} /></label>
          <label className="text-sm">Teléfono<input name="phone" type="tel" required placeholder="+56 9" autoComplete="tel" className={input} /></label>
          <label className="text-sm">RUT<input name="rut" required placeholder="12.345.678-9" className={input} /></label>
          <label className="text-sm">Tu vehículo o VIN (opcional)
            <input name="vehicle" defaultValue={vehicleText} placeholder="Chevrolet Sail 2015 o VIN de 17 dígitos" className={input} />
          </label>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-2 font-semibold">Entrega</legend>
          <label className={option(delivery === "envio")}>
            <input type="radio" name="delivery" value="envio" checked={delivery === "envio"} onChange={() => setDelivery("envio")} className="mt-0.5" />
            <span>
              <span className="block font-medium">Envío a domicilio</span>
              <span className="text-muted">A todo Chile con seguimiento. {shipping === 0 ? "Gratis para este pedido." : `${formatCLP(shipping)}, gratis sobre ${formatCLP(settings.freeShippingFrom)}.`}</span>
            </span>
          </label>
          <label className={option(delivery === "retiro")}>
            <input type="radio" name="delivery" value="retiro" checked={delivery === "retiro"} onChange={() => setDelivery("retiro")} className="mt-0.5" />
            <span>
              <span className="block font-medium">Retiro en tienda · gratis</span>
              <span className="text-muted">{settings.address}. Te avisamos por correo cuando esté listo.</span>
            </span>
          </label>
        </fieldset>

        {delivery === "envio" && (
          <fieldset className="grid gap-4 sm:grid-cols-2 animate-fade">
            <legend className="mb-2 font-semibold">Dirección de despacho</legend>
            <label className="text-sm sm:col-span-2">Dirección<input name="address" required placeholder="Calle, número, depto." autoComplete="street-address" className={input} /></label>
            <label className="text-sm">Región
              <select name="region" required defaultValue="Metropolitana" className={input}>
                {regiones.map((r) => <option key={r} className="bg-surface">{r}</option>)}
              </select>
            </label>
            <label className="text-sm">Comuna<input name="comuna" required className={input} /></label>
          </fieldset>
        )}

        <fieldset className="space-y-3">
          <legend className="mb-2 font-semibold">Documento</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="wantsInvoice" checked={wantsInvoice} onChange={(e) => setWantsInvoice(e.target.checked)} />
            Necesito factura (si no, emitimos boleta)
          </label>
          {wantsInvoice && (
            <label className="block text-sm animate-fade">Razón social, RUT de la empresa y giro
              <input name="invoice" required placeholder="Transportes Ejemplo SpA · 76.123.456-7 · Transporte de carga" className={input} />
            </label>
          )}
        </fieldset>

        <label className="flex gap-3 rounded-xl border bg-surface-2 p-4 text-sm">
          <input type="checkbox" name="termsAck" required className="mt-1" />
          <span>
            Revisé que el repuesto corresponde a mi vehículo y acepto los <Link href="/terminos" className="underline">términos, condiciones y garantía</Link>.
          </span>
        </label>
        {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
        <button disabled={loading} className="btn-primary w-full">
          {loading ? "Redirigiendo al pago…" : `Pagar ${formatCLP(total)}`}
        </button>
        <p className="text-center text-xs text-muted">Serás redirigido a la pasarela de pago segura. No guardamos datos de tarjetas.</p>
      </form>

      <aside className="h-fit rounded-2xl border bg-surface p-6 md:sticky md:top-32">
        <h2 className="font-semibold">Tu pedido</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {lines.map((l) => {
            const f = find(l.variantId);
            if (!f) return null;
            return (
              <li key={l.variantId} className="flex justify-between gap-3">
                <span className="text-muted">{f.product.name}{f.variant.label !== "Unidad" && ` · ${f.variant.label}`} × {l.qty}</span>
                <span className="shrink-0 tabular">{formatCLP(f.variant.price * l.qty)}</span>
              </li>
            );
          })}
        </ul>
        <dl className="mt-4 space-y-2 border-t pt-4 text-sm tabular">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatCLP(subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Envío</dt><dd>{shippingNow === 0 ? (delivery === "retiro" ? "Retiro" : "Gratis") : formatCLP(shippingNow)}</dd></div>
          <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{formatCLP(total)}</dd></div>
        </dl>
      </aside>
    </div>
  );
}
