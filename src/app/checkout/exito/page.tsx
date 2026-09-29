"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { formatCLP } from "@/lib/products";

type Summary = {
  id: string;
  status: "pendiente" | "pagado" | "fallido";
  items: { variantId: string; name: string; qty: number; unitPrice: number }[];
  shipping: number;
  total: number;
  emailHint: string;
};

function Exito() {
  const params = useSearchParams();
  const orderId = params.get("orden");
  const { clear } = useCart();
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => clear(), []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${encodeURIComponent(orderId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [orderId]);

  const pending = summary?.status === "pendiente";

  return (
    <div className="animate-fade mx-auto max-w-xl px-4 py-20 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-lime/15 text-3xl text-lime">
        {pending ? "⏳" : "✓"}
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold">
        {pending ? "Estamos confirmando tu pago" : "¡Gracias por tu compra!"}
      </h1>
      <p className="mt-3 text-muted">
        Tu pedido <strong className="text-fg">{orderId}</strong> fue recibido.
        {summary && <> Te enviaremos la confirmación y el número de seguimiento a <strong className="text-fg">{summary.emailHint}</strong>.</>}
      </p>

      {summary && (
        <div className="glass mt-8 rounded-2xl p-5 text-left text-sm">
          <ul className="space-y-2">
            {summary.items.map((i) => (
              <li key={i.variantId} className="flex justify-between gap-4">
                <span>{i.name} × {i.qty}</span>
                <span>{formatCLP(i.unitPrice * i.qty)}</span>
              </li>
            ))}
            <li className="flex justify-between border-t pt-2 text-muted">
              <span>Envío</span><span>{summary.shipping ? formatCLP(summary.shipping) : "Gratis"}</span>
            </li>
            <li className="flex justify-between font-semibold"><span>Total</span><span>{formatCLP(summary.total)}</span></li>
          </ul>
        </div>
      )}

      {params.get("modo") === "prueba" && (
        <p className="mt-4 rounded-lg bg-amber-400/10 p-3 text-sm text-amber-800 dark:text-amber-200">Modo de prueba: no se realizó ningún cobro.</p>
      )}
      <Link href="/productos" className="btn-primary mt-8">Seguir comprando</Link>
    </div>
  );
}

export default function Page() {
  return <Suspense><Exito /></Suspense>;
}
