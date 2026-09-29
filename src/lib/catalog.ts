import "server-only";
import { query } from "./db";
import { categories, type Category, type Product, type Variant } from "./products";
import seed from "./seed.json";

type ProductRow = {
  slug: string;
  name: string;
  category: string;
  ml_category: string;
  short: string;
  description: string;
  brand: string;
  origin: string;
  warranty: string;
  make: string;
  model: string;
  year_from: number | null;
  year_to: number | null;
  sku: string;
  ml_id: string;
  color: string;
  image_url: string | null;
  featured: boolean;
  visible: boolean;
  active: boolean;
  free_shipping: boolean;
  sort: number;
};

type VariantRow = { id: string; product_slug: string; label: string; price: number; stock: number | null; sort: number };

let seeded = false;

// La primera vez que la base está vacía se carga el catálogo importado desde Mercado Libre (src/lib/seed.json).
// Se inserta por lotes para que el primer arranque tarde segundos, no minutos.
async function ensureSeeded() {
  if (seeded) return;
  const [{ n }] = await query<{ n: number }>("SELECT count(*)::int AS n FROM products");
  if (Number(n) === 0) {
    const products = seed as unknown as Product[];
    for (let i = 0; i < products.length; i += 150) await insertProducts(products.slice(i, i + 150));
    const variants = products.flatMap((p) => p.variants.map((v, sort) => ({ ...v, slug: p.slug, sort })));
    for (let i = 0; i < variants.length; i += 300) await insertVariants(variants.slice(i, i + 300));
  }
  seeded = true;
}

const productCols =
  "slug, name, category, ml_category, short, description, brand, origin, warranty, make, model, year_from, year_to, sku, ml_id, color, image_url, featured, visible, active, free_shipping, sort";

function productValues(p: Omit<Product, "variants">) {
  return [
    p.slug, p.name, p.category, p.mlCategory, p.short, p.description, p.brand, p.origin, p.warranty, p.make, p.model,
    p.yearFrom, p.yearTo, p.sku, p.mlId, p.color, p.imageUrl ?? null, Boolean(p.featured), p.visible, p.active,
    p.freeShipping, p.sort,
  ];
}

async function insertProducts(list: Omit<Product, "variants">[]) {
  const width = productCols.split(",").length;
  const params: unknown[] = [];
  const rows = list.map((p, i) => {
    params.push(...productValues(p));
    return `(${Array.from({ length: width }, (_, j) => `$${i * width + j + 1}`).join(",")})`;
  });
  await query(`INSERT INTO products (${productCols}) VALUES ${rows.join(",")} ON CONFLICT (slug) DO NOTHING`, params);
}

async function insertVariants(list: (Variant & { slug: string; sort: number })[]) {
  const params: unknown[] = [];
  const rows = list.map((v, i) => {
    params.push(v.id, v.slug, v.label, v.price, v.stock, v.sort);
    return `($${i * 6 + 1},$${i * 6 + 2},$${i * 6 + 3},$${i * 6 + 4},$${i * 6 + 5},$${i * 6 + 6})`;
  });
  await query(`INSERT INTO variants (id, product_slug, label, price, stock, sort) VALUES ${rows.join(",")} ON CONFLICT (id) DO NOTHING`, params);
}

function toProduct(r: ProductRow, variants: VariantRow[]): Product {
  return {
    slug: r.slug,
    name: r.name,
    category: (categories as readonly string[]).includes(r.category) ? (r.category as Category) : "otros",
    mlCategory: r.ml_category,
    short: r.short,
    description: r.description,
    brand: r.brand,
    origin: r.origin,
    warranty: r.warranty,
    make: r.make,
    model: r.model,
    yearFrom: r.year_from == null ? null : Number(r.year_from),
    yearTo: r.year_to == null ? null : Number(r.year_to),
    sku: r.sku,
    mlId: r.ml_id,
    color: r.color,
    imageUrl: r.image_url ?? undefined,
    featured: r.featured,
    visible: r.visible,
    active: r.active,
    freeShipping: r.free_shipping,
    sort: Number(r.sort),
    variants: variants
      .filter((v) => v.product_slug === r.slug)
      .sort((a, b) => a.sort - b.sort)
      .map((v) => ({ id: v.id, label: v.label, price: Number(v.price), stock: v.stock == null ? null : Number(v.stock) })),
  };
}

export async function getProducts(opts: { includeHidden?: boolean } = {}): Promise<Product[]> {
  await ensureSeeded();
  const rows = await query<ProductRow>(`SELECT * FROM products ${opts.includeHidden ? "" : "WHERE visible"} ORDER BY sort, name`);
  const variants = await query<VariantRow>(
    opts.includeHidden ? "SELECT * FROM variants" : "SELECT v.* FROM variants v JOIN products p ON p.slug = v.product_slug WHERE p.visible",
  );
  return rows.map((r) => toProduct(r, variants));
}

export async function getProduct(slug: string, opts: { includeHidden?: boolean } = {}) {
  await ensureSeeded();
  const [row] = await query<ProductRow>("SELECT * FROM products WHERE slug = $1", [slug]);
  if (!row || (!row.visible && !opts.includeHidden)) return null;
  const variants = await query<VariantRow>("SELECT * FROM variants WHERE product_slug = $1", [slug]);
  return toProduct(row, variants);
}

export async function findVariant(variantId: string) {
  await ensureSeeded();
  const [v] = await query<VariantRow>("SELECT * FROM variants WHERE id = $1", [variantId]);
  if (!v) return undefined;
  const product = await getProduct(v.product_slug);
  if (!product) return undefined;
  const variant = product.variants.find((x) => x.id === variantId)!;
  return { product, variant };
}

export async function upsertProduct(p: Omit<Product, "variants">) {
  const cols = productCols.split(", ");
  const sets = cols.slice(1).map((c) => `${c} = EXCLUDED.${c}`).join(", ");
  await query(
    `INSERT INTO products (${productCols}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(",")})
     ON CONFLICT (slug) DO UPDATE SET ${sets}`,
    productValues(p),
  );
}

// Reemplaza las presentaciones del producto conservando los ids existentes (los carritos guardados siguen válidos).
export async function setVariants(slug: string, variants: Variant[]) {
  const ids = variants.map((v) => v.id);
  if (ids.length === 0) {
    await query("DELETE FROM variants WHERE product_slug = $1", [slug]);
    return;
  }
  await query(`DELETE FROM variants WHERE product_slug = $1 AND NOT (id = ANY($2::text[]))`, [slug, ids]);
  for (const [i, v] of variants.entries()) {
    await query(
      `INSERT INTO variants (id, product_slug, label, price, stock, sort) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, price = EXCLUDED.price, stock = EXCLUDED.stock, sort = EXCLUDED.sort`,
      [v.id, slug, v.label, v.price, v.stock, i],
    );
  }
}

export async function setProductVisible(slug: string, visible: boolean) {
  await query("UPDATE products SET visible = $2 WHERE slug = $1", [slug, visible]);
}

export async function deleteProduct(slug: string) {
  await query("DELETE FROM products WHERE slug = $1", [slug]);
}

// Descuenta stock de las presentaciones con control de stock (stock no nulo).
export async function decrementStock(items: { variantId: string; qty: number }[]) {
  for (const it of items) {
    await query("UPDATE variants SET stock = GREATEST(stock - $2, 0) WHERE id = $1 AND stock IS NOT NULL", [it.variantId, it.qty]);
  }
}
