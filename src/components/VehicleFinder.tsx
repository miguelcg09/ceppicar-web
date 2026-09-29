"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "./CartProvider";

type V = { make?: string; model?: string; year?: number };

// Selector marca → modelo → año. Al confirmar guarda el vehículo en el navegador y lleva al catálogo filtrado.
export function VehicleFinder({
  compact = false,
  onDone,
  dark = false,
}: {
  compact?: boolean;
  onDone?: () => void;
  dark?: boolean;
}) {
  const { vehicles, vehicle, setVehicle } = useStore();
  const router = useRouter();
  const [v, setV] = useState<V>(vehicle);

  const makes = Object.keys(vehicles).sort();
  const models = v.make ? Object.keys(vehicles[v.make] ?? {}).sort((a, b) => a.localeCompare(b, "es", { numeric: true })) : [];
  const range = v.make && v.model ? vehicles[v.make]?.[v.model] : undefined;
  const years: number[] = [];
  if (range && range[1] > 0) for (let y = range[1]; y >= range[0]; y--) years.push(y);

  function go() {
    if (!v.make) return;
    setVehicle(v);
    const q = new URLSearchParams();
    q.set("marca", v.make);
    if (v.model) q.set("modelo", v.model);
    if (v.year) q.set("ano", String(v.year));
    router.push(`/productos?${q}`);
    onDone?.();
  }

  const select = compact ? "field mt-0 py-2 text-sm" : "field mt-0 py-3";
  const label = compact ? "sr-only" : `text-sm font-semibold ${dark ? "text-white/90" : ""}`;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); go(); }}
      className={`grid gap-3 ${compact ? "grid-cols-2 md:grid-cols-[1fr_1fr_1fr_auto]" : "sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"}`}
    >
      <label className="block">
        <span className={label}>Marca</span>
        <select className={select} value={v.make ?? ""} onChange={(e) => setV(e.target.value ? { make: e.target.value } : {})}>
          <option value="">Marca</option>
          {makes.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </label>
      <label className="block">
        <span className={label}>Modelo</span>
        <select className={select} value={v.model ?? ""} disabled={!v.make} onChange={(e) => setV({ make: v.make, model: e.target.value || undefined })}>
          <option value="">Modelo</option>
          {models.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </label>
      <label className="block">
        <span className={label}>Año</span>
        <select className={select} value={v.year ?? ""} disabled={!years.length} onChange={(e) => setV({ ...v, year: Number(e.target.value) || undefined })}>
          <option value="">Año</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </label>
      <button type="submit" disabled={!v.make} className={`btn-cta ${compact ? "py-2 text-sm" : "py-3 px-6"} col-span-2 md:col-span-1`}>
        Buscar
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 6l6 6-6 6" /></svg>
      </button>
    </form>
  );
}

// Etiqueta "Mi auto: Chevrolet Sail 2015" con botón para quitarlo.
export function VehicleChip() {
  const { vehicle, setVehicle } = useStore();
  const router = useRouter();
  if (!vehicle.make) return null;
  const text = [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" ");
  return (
    <span className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-1 text-xs font-semibold text-on-accent">
      Mi auto: {text}
      <button
        type="button"
        onClick={() => { setVehicle({}); router.push("/productos"); }}
        className="rounded-full bg-on-accent/20 px-1.5 leading-none hover:bg-on-accent/40"
        aria-label="Quitar vehículo"
      >
        ×
      </button>
    </span>
  );
}
