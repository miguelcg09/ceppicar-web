export type Variant = {
  id: string;
  label: string; // p. ej. "Unidad", "Derecho (copiloto)"
  price: number; // CLP, IVA incluido
  stock: number | null; // null = sin control de stock
};

export type Product = {
  slug: string;
  name: string;
  category: Category;
  mlCategory: string; // categoría tal como aparece en Mercado Libre
  short: string;
  description: string;
  brand: string;
  origin: string;
  warranty: string;
  make: string; // marca del vehículo (vacío = varios / universal)
  model: string;
  yearFrom: number | null;
  yearTo: number | null;
  sku: string;
  mlId: string; // MLC… (vacío si no está publicado en Mercado Libre)
  color: string; // color de la ilustración si no hay foto
  imageUrl?: string;
  variants: Variant[];
  featured?: boolean;
  visible: boolean;
  active: boolean; // publicación activa en Mercado Libre
  freeShipping: boolean;
  sort: number;
};

export const categories = [
  "suspension",
  "frenos",
  "direccion",
  "refrigeracion",
  "motor",
  "embrague",
  "encendido",
  "carroceria",
  "filtros",
  "otros",
] as const;
export type Category = (typeof categories)[number];

export const categoryMeta: Record<Category, { name: string; blurb: string; color: string }> = {
  suspension: { name: "Suspensión", blurb: "Amortiguadores, bandejas, bieletas y cazoletas", color: "#0b3d91" },
  frenos: { name: "Frenos", blurb: "Pastillas, discos y cintas", color: "#d32f2f" },
  direccion: { name: "Dirección y ruedas", blurb: "Rodamientos, axiales, extremos y homocinéticas", color: "#0f9d8a" },
  refrigeracion: { name: "Refrigeración", blurb: "Bombas de agua, termostatos y depósitos", color: "#0097a7" },
  motor: { name: "Motor", blurb: "Distribución, correas, soportes y aceite", color: "#ef6c00" },
  embrague: { name: "Embrague", blurb: "Kits completos y rodamientos", color: "#6d4fc2" },
  encendido: { name: "Encendido y eléctrico", blurb: "Bobinas, bujías y sensores", color: "#c99700" },
  carroceria: { name: "Carrocería", blurb: "Espejos, focos, molduras y soportes", color: "#546e7a" },
  filtros: { name: "Filtros y admisión", blurb: "Kits de filtros y mangueras", color: "#2e7d32" },
  otros: { name: "Otros", blurb: "Cables, bombas y más", color: "#6b7280" },
};

export function findVariantIn(list: Product[], variantId: string) {
  for (const product of list) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return { product, variant };
  }
  return undefined;
}

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export function formatCLP(amount: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(amount);
}

// "Chevrolet Sail 2011–2020"
export function vehicleLabel(p: Pick<Product, "make" | "model" | "yearFrom" | "yearTo">) {
  if (!p.make) return "";
  const years = p.yearFrom ? (p.yearTo && p.yearTo !== p.yearFrom ? `${p.yearFrom}–${p.yearTo}` : String(p.yearFrom)) : "";
  return [p.make, p.model, years].filter(Boolean).join(" ");
}

export type Vehicle = { make?: string; model?: string; year?: number };

export type Fit = "yes" | "no" | "partial" | "unknown";

// Compara un producto con el vehículo elegido por el cliente.
// "partial": coincide la marca (o marca y modelo) pero falta elegir el resto.
export function fitsVehicle(p: Product, v: Vehicle): Fit {
  if (!v.make) return "unknown";
  if (!p.make) return "unknown";
  if (p.make !== v.make) return "no";
  if (!v.model) return "partial";
  if (p.model !== v.model) return "no";
  if (!v.year || !p.yearFrom) return "partial";
  return v.year >= p.yearFrom && v.year <= (p.yearTo ?? p.yearFrom) ? "yes" : "no";
}

export function mlUrl(p: Pick<Product, "mlId">) {
  return p.mlId ? `https://articulo.mercadolibre.cl/${p.mlId.replace(/^MLC/, "MLC-")}` : "";
}

// Marcas → modelos → rango de años, calculado desde el catálogo visible.
export type VehicleIndex = Record<string, Record<string, [number, number]>>;

export function buildVehicleIndex(products: Product[]): VehicleIndex {
  const idx: VehicleIndex = {};
  for (const p of products) {
    if (!p.make) continue;
    const models = (idx[p.make] ??= {});
    if (!p.model) continue;
    const range = (models[p.model] ??= [9999, 0]);
    if (p.yearFrom) {
      range[0] = Math.min(range[0], p.yearFrom);
      range[1] = Math.max(range[1], Math.min(p.yearTo ?? p.yearFrom, new Date().getFullYear() + 1));
    }
  }
  return idx;
}
