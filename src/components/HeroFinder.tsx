"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { VehicleFinder } from "./VehicleFinder";

// Buscador de la portada con pestañas: por marca/modelo, por VIN o por texto.
export function HeroFinder({ whatsapp }: { whatsapp: string }) {
  const [tab, setTab] = useState<"auto" | "vin" | "texto">("auto");
  const [q, setQ] = useState("");
  const router = useRouter();
  const wa = `https://wa.me/${whatsapp.replace(/\D/g, "")}`;

  return (
    <div className="overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/15 backdrop-blur-sm">
      <div role="tablist" className="flex border-b border-white/15 bg-black/20 text-sm">
        {([["auto", "Marca / Modelo"], ["vin", "VIN"], ["texto", "Buscar repuesto"]] as const).map(([k, label]) => (
          <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)} className="tab">
            {label}
          </button>
        ))}
      </div>
      <div className="p-5">
        {tab === "auto" && <VehicleFinder dark />}
        {tab === "vin" && (
          <form
            onSubmit={(e) => { e.preventDefault(); window.open(`${wa}?text=${encodeURIComponent(`Hola, necesito un repuesto. Mi VIN es ${q.trim()}`)}`, "_blank"); }}
            className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
          >
            <label className="block">
              <span className="text-sm font-semibold text-white/90">VIN o número de chasis (17 caracteres)</span>
              <input value={q} onChange={(e) => setQ(e.target.value.toUpperCase())} minLength={11} maxLength={17} placeholder="Ej: 9BGRB48X0DG000000" className="field mt-1 py-3 font-mono uppercase" />
            </label>
            <button className="btn-cta py-3 px-6">Consultar por WhatsApp</button>
            <p className="text-xs text-white/70 sm:col-span-2">Con el VIN confirmamos el repuesto exacto antes de que compres. Está en el padrón del vehículo.</p>
          </form>
        )}
        {tab === "texto" && (
          <form onSubmit={(e) => { e.preventDefault(); router.push(`/productos?q=${encodeURIComponent(q.trim())}`); }} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="block">
              <span className="text-sm font-semibold text-white/90">¿Qué repuesto necesitas?</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej: amortiguador Sail, bomba de agua, kit embrague" className="field mt-1 py-3" />
            </label>
            <button className="btn-cta py-3 px-6">Buscar</button>
          </form>
        )}
      </div>
    </div>
  );
}
