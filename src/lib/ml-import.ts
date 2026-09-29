import "server-only";
import * as XLSX from "xlsx";
import { query } from "./db";
import { slugify, type Category, type Product } from "./products";

// Lee el Excel "Publicaciones" que Mercado Libre exporta desde Ventas > Publicaciones > Descargar
// y actualiza precios, stock y estado de las publicaciones que ya existen en la tienda.
// Las publicaciones nuevas con stock se crean con los datos básicos (vehículo deducido del título).

export type MlRow = {
  itemId: string;
  variationId: string;
  sku: string;
  title: string;
  variation: string;
  qty: number;
  price: number;
  status: string;
  freeShipping: boolean;
  category: string;
  description: string;
};

const num = (v: unknown) => {
  const n = Number(String(v ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export function parseMlWorkbook(buffer: ArrayBuffer): MlRow[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets["Publicaciones"] ?? wb.Sheets[wb.SheetNames[0]];
  if (!ws) throw new Error("El archivo no tiene la hoja Publicaciones");
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
  // La primera fila trae los nombres técnicos (ITEM_ID, TITLE…); ubicamos cada columna por nombre.
  const header = (rows[0] ?? []).map((c) => String(c ?? "").trim());
  const col = (name: string) => header.indexOf(name);
  const idx = {
    item: col("ITEM_ID"), variation: col("VARIATION_ID"), sku: col("SKU"), title: col("TITLE"), variations: col("VARIATIONS"),
    qty: col("QUANTITY"), price: col("PRICE"), status: col("STATUS"), shipping: col("SHIPPING_COST_MARKETPLACE"), category: col("CATEGORY"), description: col("DESCRIPTION"),
  };
  if (idx.item < 0 || idx.price < 0 || idx.qty < 0) throw new Error("No parece un Excel de publicaciones de Mercado Libre (faltan ITEM_ID, PRICE o QUANTITY)");
  const out: MlRow[] = [];
  for (const r of rows.slice(1)) {
    const itemId = String(r[idx.item] ?? "").trim();
    if (!/^MLC\d+$/.test(itemId)) continue;
    out.push({
      itemId,
      variationId: String(r[idx.variation] ?? "").trim(),
      sku: idx.sku >= 0 ? String(r[idx.sku] ?? "").trim() : "",
      title: String(r[idx.title] ?? "").replace(/\s+/g, " ").trim(),
      variation: idx.variations >= 0 ? String(r[idx.variations] ?? "").trim() : "",
      qty: Math.max(0, Math.round(num(r[idx.qty]))),
      price: Math.round(num(r[idx.price])),
      status: idx.status >= 0 ? String(r[idx.status] ?? "").trim() : "",
      freeShipping: idx.shipping >= 0 && /gratis/i.test(String(r[idx.shipping] ?? "")),
      category: idx.category >= 0 ? String(r[idx.category] ?? "").trim() : "",
      description: idx.description >= 0 ? String(r[idx.description] ?? "") : "",
    });
  }
  return out;
}

// --- Deducción de categoría y vehículo desde el título (misma lógica que scripts/importar_ml.py) ---

const GROUPS: [Category, RegExp][] = [
  ["frenos", /freno|pastilla|cinta|calipers|bomba de freno|cilindro de rueda|tambor/i],
  ["embrague", /embrague|volante motor|collar/i],
  ["direccion", /direcci|axial|extremo|homocin|rodamiento|maza|palier|terminal/i],
  ["suspension", /amortiguad|bandeja|bieleta|base|rótula|rotula|suspensi|resorte|buje|espiral|barra/i],
  ["refrigeracion", /agua|termostato|refrigera|radiador|fan clutch|ventilador|electroventilador/i],
  ["encendido", /bobina|bujía|bujia|distribuidor|encendido|sensor|alternador|motor de arranque|interruptor|telecomando|eléctric|electric/i],
  ["filtros", /filtro|admisi/i],
  ["motor", /distribuci|aceite|motor|correa|camisa|culata|empaquetadura|junta|pist|tensor|polea|carter|cárter|metal/i],
  ["carroceria", /parachoque|espejo|moldura|airbag|foco|faro|óptico|optico|manilla|capot|tapabarro|puerta|luz|guardafango|mascara|máscara/i],
];
const COLORS: Record<Category, string> = { suspension: "#0b3d91", refrigeracion: "#0097a7", direccion: "#0f9d8a", motor: "#ef6c00", embrague: "#6d4fc2", frenos: "#d32f2f", encendido: "#c99700", carroceria: "#546e7a", filtros: "#2e7d32", otros: "#6b7280" };

export function guessCategory(mlCategory: string, title: string): Category {
  for (const [g, rx] of GROUPS) if (rx.test(mlCategory)) return g;
  for (const [g, rx] of GROUPS) if (rx.test(title)) return g;
  return "otros";
}

const MAKES = ["Chevrolet","Mitsubishi","Mazda","Peugeot","Changan","Nissan","Toyota","Ssangyong","Byd","Chery","Jac","Geely","Maxus","Suzuki","Hyundai","Kia","Ford","Jeep","Dodge","Mg","Brilliance","Brillance","Great Wall","Dfsk","Dfm","Renault","Citroen","Honda","Volkswagen","Subaru","Fiat","Daewoo","Samsung","Mahindra","Tata","Haval","Chrysler","Opel","Isuzu","Foton","Zotye","Lifan","Dongfeng","Jmc","Faw","Baic","Kyc","Mercedes Benz","Mercedes","Hafei","Zna","Skoda","Seat","Audi","Bmw","Volvo","Land Rover","Mini","Jetour","Chevy","Gac","Ram","Alfa Romeo","Lada","Proton","Kaiyi","Soueast","Changhe","Shineray","Ssanyong","Chavrolet","Dewoo","Totoya"];
const CANON: Record<string, string> = { Ssanyong: "SsangYong", Chavrolet: "Chevrolet", Dewoo: "Daewoo", Totoya: "Toyota", Brillance: "Brilliance", Mercedes: "Mercedes Benz", Chevy: "Chevrolet", Ssangyong: "SsangYong", Byd: "BYD", Jac: "JAC", Mg: "MG", Dfsk: "DFSK", Dfm: "DFM", Jmc: "JMC", Faw: "FAW", Baic: "BAIC", Kyc: "KYC", Bmw: "BMW", Zna: "ZNA", Gac: "GAC", Ram: "RAM" };
const MAKE_RE = new RegExp("\\b(" + [...new Set(MAKES)].sort((a, b) => b.length - a.length).map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")\\b", "i");
const STOP = /^(año|años|del\.?|tras\.?|delanter\w*|traser\w*|par|kit|con|sin|izq\w*|der\w*|motor|mec\w*|aut\w*|lado|original|japon\w*|korea|corea|taiw\w*|china|el|la|los|las|y|al|und|unidad|gasolina|diesel|bencin\w*|cc|4x2|4x4|2wd|4wd)$/i;
const PAIRS = new Set(["spark gt","grand nomade","gran nomade","grand vitara","gran vitara","urban cruiser","montero sport","santa fe","cargo van"]);
const ALIAS: Record<string, string> = { monterosport: "Montero Sport", "sx-4": "SX4", bt50: "BT-50", "bt-50": "BT-50", "cx-70": "CX70", i30: "I-30", i10: "I-10", i20: "I-20", helantra: "Elantra", "h-100": "H100", "h-1": "H1", "gran nomade": "Grand Nomade", "gran vitara": "Grand Vitara", "x-trail": "X-TRAIL", "aveo-": "Aveo", "x-": "X-TRAIL", qasqai: "Qashqai", tida: "Tiida", winlge: "Wingle", compas: "Compass", "cx-5": "CX5", rav: "RAV4", rave: "RAV4", urban: "Urban Cruiser", santa: "Santa Fe", tarjet: "Trajet", rizzo: "Rezzo", gran: "Grand Vitara", md201: "M201", cs15: "CS15" };
const NOT_MODEL = new Set(["nissam", "nissan", "suzuki", "peugeot", "renault", "lada", "x"]);
const UPPER = new Set(["gt","lt","zs","zx","cx5","cx7","cx3","cx70","cs35","crv","cr-v","rav4","sx4","np300","l200","d21","d22","sm3","sm5","f0","s2","s3","j2","j3","t60","x25","n300","n400","i-10","i-20","i-30","x-trail","hr-v","b15","h1","h100","qq","a30","t30"]);
const title = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
const fmt = (w: string) => (UPPER.has(w.toLowerCase()) ? w.toUpperCase() : title(w));

export function parseVehicle(t: string) {
  const m = MAKE_RE.exec(t);
  if (!m) return { make: "", model: "", rest: t };
  const rawMake = m[1].split(" ").map(title).join(" ");
  const make = CANON[rawMake] ?? rawMake;
  const rest = t.slice(m.index + m[0].length).replace(/\//g, " / ").split(/\s+/).filter(Boolean);
  let model: string[] = [];
  for (const raw of rest) {
    const w = raw.replace(/^[,.;()]+|[,.;()]+$/g, "");
    if (!w || "/-+".includes(w) || STOP.test(w)) break;
    if (!model.length) {
      if (/^\d{1,3}$/.test(w) || (make === "Peugeot" && /^[1-5]00[1-8]$/.test(w)) || !/\d[.,-]|^\d/.test(w)) { model.push(w); continue; }
      break;
    }
    if (PAIRS.has(`${model[0].toLowerCase()} ${w.toLowerCase()}`)) model.push(w);
    else if (model[0].toLowerCase() === "new") model = [w];
    break;
  }
  if (model.length && NOT_MODEL.has(model[0].toLowerCase())) model = [];
  let modelText = "";
  if (model.length) {
    const k = model.join(" ").toLowerCase();
    modelText = ALIAS[k] ?? model.map(fmt).join(" ");
  }
  const ys = t.slice(0, m.index) + " " + rest.slice(model.length).join(" ");
  return { make, model: modelText, rest: ys };
}

export function parseYears(t: string): [number | null, number | null] {
  const ys = [...t.matchAll(/(?<![\d.,])((?:19[6-9]|20[0-3])\d)(?![\d.,])/g)].map((x) => Number(x[1]));
  if (ys.length > 1) return [Math.min(...ys), Math.max(...ys)];
  if (ys.length === 1) return [ys[0], new RegExp(`${ys[0]}\\s*(\\+|en adelante|adelante)`, "i").test(t) ? 2026 : ys[0]];
  const m = /(?<![\d.,])(\d{2})\s*(?:-|al|a)\s*(\d{2})(?![\d.,])/.exec(t);
  if (m) {
    const f = (y: number) => (y >= 50 ? 1900 + y : 2000 + y);
    const a = f(Number(m[1])), b = f(Number(m[2]));
    if (a <= b) return [a, b];
  }
  return [null, null];
}

export function cleanDescription(d: string) {
  const cut = d.split(/Somos CEPPICAR|CEPPICAR Tienda|_{5,}|-{5,}|Antes de realizar/)[0].trim();
  const info: { brand?: string; origin?: string; warranty?: string } = {};
  for (const [k, rx] of [["brand", /^\s*Marca\s*:\s*(.+)$/im], ["origin", /^\s*(?:Procedencia|Origen)\s*:\s*(.+)$/im], ["warranty", /^\s*Garant[ií]a\s*:?\s*(.+)$/im]] as const) {
    const m = rx.exec(cut);
    if (m) info[k] = m[1].trim().slice(0, 60);
  }
  const lines = cut.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !/^(Marca|Procedencia|Origen|Garant|Producto Nuevo|Lado|Tipo)\b/i.test(l));
  return { description: lines.join(" ").slice(0, 320), ...info };
}

export type ImportResult = {
  filas: number; publicaciones: number; actualizados: number; creados: number; omitidos: number; pausados: number; reactivados: number;
  nuevos: { slug: string; name: string }[];
};

// Aplica el Excel: por cada publicación conocida (ml_id) actualiza precio, stock, estado y envío;
// las desconocidas con stock se crean ocultas si están inactivas o visibles si están activas.
export async function applyMlImport(rows: MlRow[], opts: { syncVisibility: boolean; createNew: boolean }): Promise<ImportResult> {
  const res: ImportResult = { filas: rows.length, publicaciones: 0, actualizados: 0, creados: 0, omitidos: 0, pausados: 0, reactivados: 0, nuevos: [] };
  const parents = new Map<string, MlRow>();
  const variants = new Map<string, MlRow[]>();
  for (const r of rows) {
    if (r.variationId) (variants.get(r.itemId) ?? variants.set(r.itemId, []).get(r.itemId)!).push(r);
    else parents.set(r.itemId, r);
  }
  res.publicaciones = parents.size;
  const existing = await query<{ slug: string; ml_id: string; active: boolean; visible: boolean }>("SELECT slug, ml_id, active, visible FROM products WHERE ml_id <> ''");
  const bySlugMl = new Map(existing.map((p) => [p.ml_id, p]));

  for (const [itemId, p] of parents) {
    const vars = variants.get(itemId) ?? [];
    const stock = p.qty + vars.reduce((a, v) => a + v.qty, 0);
    const active = /^activa$/i.test(p.status);
    const known = bySlugMl.get(itemId);
    if (known) {
      await query("UPDATE products SET active = $2, free_shipping = $3 WHERE slug = $1", [known.slug, active, p.freeShipping]);
      if (opts.syncVisibility && known.visible !== active) {
        await query("UPDATE products SET visible = $2 WHERE slug = $1", [known.slug, active]);
        if (active) res.reactivados++; else res.pausados++;
      }
      if (vars.length) {
        for (const [i, v] of vars.entries()) {
          await query(
            `INSERT INTO variants (id, product_slug, label, price, stock, sort) VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, stock = EXCLUDED.stock`,
            [`${itemId}-${i + 1}`, known.slug, title(v.variation || `Opción ${i + 1}`), p.price || v.price, v.qty, i],
          );
        }
      } else {
        await query("UPDATE variants SET price = $2, stock = $3 WHERE product_slug = $1", [known.slug, p.price, stock]);
      }
      res.actualizados++;
      continue;
    }
    if (!opts.createNew || stock <= 0 || !p.price) { res.omitidos++; continue; }
    const { make, model, rest } = parseVehicle(p.title);
    const [yearFrom, yearTo] = parseYears(rest);
    const category = guessCategory(p.category, p.title);
    const desc = cleanDescription(p.description);
    const veh = [make, model, yearFrom ? `${yearFrom}-${yearTo}` : ""].filter(Boolean).join(" ");
    const slug = `${slugify(p.title).slice(0, 60)}-${itemId.slice(3)}`;
    const product: Omit<Product, "variants"> = {
      slug, name: p.title, category, mlCategory: p.category, short: veh || "Consulta compatibilidad", description: desc.description,
      brand: desc.brand ?? "", origin: desc.origin ?? "", warranty: desc.warranty ?? "3 meses", make, model, yearFrom, yearTo,
      sku: p.sku && p.sku !== "0" ? p.sku : "", mlId: itemId, color: COLORS[category], featured: false, visible: active, active, freeShipping: p.freeShipping, sort: 0,
    };
    const { upsertProduct, setVariants } = await import("./catalog");
    await upsertProduct(product);
    await setVariants(
      slug,
      vars.length
        ? vars.map((v, i) => ({ id: `${itemId}-${i + 1}`, label: title(v.variation || `Opción ${i + 1}`), price: p.price || v.price, stock: v.qty }))
        : [{ id: itemId, label: "Unidad", price: p.price, stock }],
    );
    res.creados++;
    res.nuevos.push({ slug, name: p.title });
  }
  return res;
}
