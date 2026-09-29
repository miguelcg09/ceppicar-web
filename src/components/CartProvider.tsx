"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { buildVehicleIndex, findVariantIn, type Product, type Variant, type Vehicle, type VehicleIndex } from "@/lib/products";
import type { Settings } from "@/lib/config";

export type CartLine = { variantId: string; qty: number };

type StoreContextValue = {
  catalog: Product[];
  settings: Settings;
  vehicles: VehicleIndex;
  find: (variantId: string) => { product: Product; variant: Variant } | undefined;
  lines: CartLine[];
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  add: (variantId: string, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  vehicle: Vehicle;
  setVehicle: (v: Vehicle) => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);
const STORAGE_KEY = "ceppicar-cart-v1";
const VEHICLE_KEY = "ceppicar-vehicle-v1";

// Catálogo, ajustes de la tienda, vehículo elegido y carrito, disponibles en todos los componentes de cliente.
export function StoreProvider({
  catalog,
  settings,
  children,
}: {
  catalog: Product[];
  settings: Settings;
  children: React.ReactNode;
}) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [vehicle, setVehicleState] = useState<Vehicle>({});
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CartLine[];
        setLines(parsed.filter((l) => findVariantIn(catalog, l.variantId)));
      }
      const car = localStorage.getItem(VEHICLE_KEY);
      if (car) setVehicleState(JSON.parse(car) as Vehicle);
    } catch {}
    setLoaded(true);
  }, [catalog]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, loaded]);

  const value = useMemo<StoreContextValue>(() => {
    const find = (id: string) => findVariantIn(catalog, id);
    const maxQty = (id: string) => {
      const stock = find(id)?.variant.stock;
      return stock == null ? 99 : Math.max(0, Math.min(99, stock));
    };
    const found = lines.map((l) => ({ l, f: find(l.variantId) }));
    const subtotal = found.reduce((sum, { l, f }) => sum + (f?.variant.price ?? 0) * l.qty, 0);
    const allFree = found.length > 0 && found.every(({ f }) => f?.product.freeShipping);
    const shipping = subtotal === 0 || allFree || subtotal >= settings.freeShippingFrom ? 0 : settings.shippingCost;
    return {
      catalog,
      settings,
      vehicles: buildVehicleIndex(catalog),
      find,
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal,
      shipping,
      total: subtotal + shipping,
      add: (variantId, qty = 1) => {
        setLines((prev) => {
          const existing = prev.find((l) => l.variantId === variantId);
          if (existing) {
            return prev.map((l) =>
              l.variantId === variantId ? { ...l, qty: Math.min(l.qty + qty, maxQty(variantId)) } : l,
            );
          }
          return [...prev, { variantId, qty: Math.min(qty, maxQty(variantId)) }];
        });
        setOpen(true);
      },
      setQty: (variantId, qty) =>
        setLines((prev) =>
          qty <= 0
            ? prev.filter((l) => l.variantId !== variantId)
            : prev.map((l) => (l.variantId === variantId ? { ...l, qty: Math.min(qty, maxQty(variantId)) } : l)),
        ),
      remove: (variantId) => setLines((prev) => prev.filter((l) => l.variantId !== variantId)),
      clear: () => setLines([]),
      open,
      setOpen,
      vehicle,
      setVehicle: (v) => {
        setVehicleState(v);
        try {
          localStorage.setItem(VEHICLE_KEY, JSON.stringify(v));
        } catch {}
      },
    };
  }, [catalog, settings, lines, open, vehicle]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de StoreProvider");
  return ctx;
}

export const useCart = useStore;
