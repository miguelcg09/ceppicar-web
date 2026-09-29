"use client";

import { useRouter } from "next/navigation";
import { useStore } from "./CartProvider";

// Selector marca → modelo → año. Guarda el vehículo en el navegador y lleva al catálogo filtrado.
export function VehicleFinder({ compact = false }: { compact?: boolean }) {
  const { vehicles, vehicle, setVehicle } = useStore();
  const router = useRouter();

  const makes = Object.keys(vehicles).sort();
  const models = vehicle.make ? Object.keys(vehicles[vehicle.make] ?? {}).sort((a, b) => a.localeCompare(b, "es", { numeric: true })) : [];
  const range = vehicle.make && vehicle.model ? vehicles[vehicle.make]?.[vehicle.model] : undefined;
  const years: number[] = [];
  if (range && range[1] > 0) for (let y = range[1]; y >= range[0]; y--) years.push(y);

  function go(v: typeof vehicle) {
    setVehicle(v);
    const q = new URLSearchParams();
    if (v.make) q.set("marca", v.make);
    if (v.model) q.set("modelo", v.model);
    if (v.year) q.set("ano", String(v.year));
    router.push(`/productos${q.size ? `?${q}` : ""}`);
  }

  const select = compact ? "field mt-0 py-2 text-sm" : "field mt-0";
  const label = compact ? "sr-only" : "text-xs font-semibold uppercase tracking-wider text-muted";

  return (
    <div className={`grid gap-3 ${compact ? "grid-cols-3" : "sm:grid-cols-3"}`}>
      <label className="block">
        <span className={label}>Marca</span>
        <select className={select} value={vehicle.make ?? ""} onChange={(e) => go(e.target.value ? { make: e.target.value } : {})}>
          <option value="">Marca</option>
          {makes.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </label>
      <label className="block">
        <span className={label}>Modelo</span>
        <select className={select} value={vehicle.model ?? ""} disabled={!vehicle.make} onChange={(e) => go({ make: vehicle.make, model: e.target.value || undefined })}>
          <option value="">Modelo</option>
          {models.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </label>
      <label className="block">
        <span className={label}>Año</span>
        <select className={select} value={vehicle.year ?? ""} disabled={!years.length} onChange={(e) => go({ ...vehicle, year: Number(e.target.value) || undefined })}>
          <option value="">Año</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </label>
    </div>
  );
}

// Etiqueta "Mi auto: Chevrolet Sail 2015" con botón para quitarlo.
export function VehicleChip() {
  const { vehicle, setVehicle } = useStore();
  const router = useRouter();
  if (!vehicle.make) return null;
  const text = [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" ");
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-on-accent">
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
