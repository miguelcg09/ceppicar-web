import "server-only";
import { query } from "./db";
import { getMlAccessToken } from "./ml-auth";

// Busca la foto principal de una publicación de Mercado Libre desde el servidor (Vercel),
// primero por la API pública y, si no responde, leyendo la etiqueta og:image de la página de la publicación.
// Con la tienda conectada (ver ml-auth.ts) la API responde siempre; sin conexión se intenta de forma anónima.

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("tiempo agotado")), ms))]);
}

async function fromApi(mlId: string): Promise<string | null> {
  const headers: Record<string, string> = { Accept: "application/json", "User-Agent": UA };
  const token = await getMlAccessToken().catch(() => null);
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await withTimeout(fetch(`https://api.mercadolibre.com/items/${mlId}?attributes=id,pictures,thumbnail`, { headers, cache: "no-store" }), 8000);
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = (await res.json()) as { pictures?: { secure_url?: string; url?: string }[]; thumbnail?: string };
  const pic = data.pictures?.[0]?.secure_url || data.pictures?.[0]?.url;
  if (pic) return pic;
  // La miniatura termina en -I.jpg (90 px); la versión -O.jpg es la imagen completa.
  if (data.thumbnail) return data.thumbnail.replace(/-I\.(jpg|webp|png)$/, "-O.$1").replace(/^http:/, "https:");
  return null;
}

async function fromPage(mlId: string): Promise<string | null> {
  const url = `https://articulo.mercadolibre.cl/${mlId.replace(/^MLC/, "MLC-")}`;
  const res = await withTimeout(fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "es-CL,es;q=0.9", Accept: "text/html" }, cache: "no-store", redirect: "follow" }), 9000);
  if (!res.ok) throw new Error(`página ${res.status}`);
  const html = await res.text();
  const og = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(html) ?? /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i.exec(html);
  if (og?.[1] && /mlstatic\.com/.test(og[1])) return og[1].replace(/^http:/, "https:");
  const any = /https:\/\/http2\.mlstatic\.com\/D_NQ_NP_[^"'\s]+?-[FOW]\.(?:webp|jpg)/i.exec(html);
  return any?.[0] ?? null;
}

export type PhotoResult = { slug: string; mlId: string; url: string | null; error?: string };

export async function findMlPhoto(slug: string, mlId: string): Promise<PhotoResult> {
  const errors: string[] = [];
  for (const fn of [fromApi, fromPage]) {
    try {
      const url = await fn(mlId);
      if (url) return { slug, mlId, url };
      errors.push("sin fotos");
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "error");
    }
  }
  return { slug, mlId, url: null, error: errors.join(" / ") };
}

// Productos que aún no tienen foto y no se han revisado en los últimos 7 días.
export async function productsNeedingPhoto(limit: number, onlyVisible: boolean, retry = false) {
  return query<{ slug: string; ml_id: string; name: string }>(
    `SELECT slug, ml_id, name FROM products
     WHERE ml_id <> '' AND image_url IS NULL ${onlyVisible ? "AND visible" : ""}
       ${retry ? "" : "AND (photo_checked_at IS NULL OR photo_checked_at < now() - interval '7 days')"}
     ORDER BY visible DESC, active DESC, sort, name LIMIT $1`,
    [limit],
  );
}

export async function countNeedingPhoto(onlyVisible: boolean) {
  const [r] = await query<{ n: number; pendientes: number }>(
    `SELECT count(*)::int AS n,
            count(*) FILTER (WHERE photo_checked_at IS NULL OR photo_checked_at < now() - interval '7 days')::int AS pendientes
     FROM products WHERE ml_id <> '' AND image_url IS NULL ${onlyVisible ? "AND visible" : ""}`,
  );
  return { sinFoto: Number(r.n), pendientes: Number(r.pendientes) };
}

// Trae las fotos de un lote de productos en paralelo y guarda las que encuentre.
export async function fetchPhotosBatch(limit: number, onlyVisible: boolean, retry = false) {
  const list = await productsNeedingPhoto(limit, onlyVisible, retry);
  const results = await Promise.all(list.map((p) => findMlPhoto(p.slug, p.ml_id)));
  for (const r of results) {
    if (r.url) await query("UPDATE products SET image_url = $2, photo_checked_at = now() WHERE slug = $1", [r.slug, r.url]);
    else await query("UPDATE products SET photo_checked_at = now() WHERE slug = $1", [r.slug]);
  }
  return { intentados: results.length, encontradas: results.filter((r) => r.url).length, fallidos: results.filter((r) => !r.url) };
}
