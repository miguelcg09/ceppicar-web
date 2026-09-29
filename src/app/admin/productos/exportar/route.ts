import { isAdmin } from "@/lib/admin";
import { getProducts } from "@/lib/catalog";
import { categoryMeta } from "@/lib/products";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

// Descarga el catálogo completo (una fila por opción) como CSV para revisarlo en Excel.
export async function GET() {
  if (!(await isAdmin())) return new Response("No autorizado", { status: 401 });
  const products = await getProducts({ includeHidden: true });
  const head = ["Publicación ML", "SKU", "Nombre", "Opción", "Precio", "Stock", "Categoría", "Marca vehículo", "Modelo", "Desde", "Hasta", "Visible", "Activo en ML", "Envío gratis", "Destacado", "Foto", "Dirección"];
  const lines = products.flatMap((p) =>
    p.variants.map((v) =>
      [p.mlId, p.sku, p.name, v.label, v.price, v.stock ?? "", categoryMeta[p.category].name, p.make, p.model, p.yearFrom ?? "", p.yearTo ?? "",
        p.visible ? "sí" : "no", p.active ? "sí" : "no", p.freeShipping ? "sí" : "no", p.featured ? "sí" : "no", p.imageUrl ?? "", `/productos/${p.slug}`].map(cell).join(";"),
    ),
  );
  const csv = "﻿" + [head.map(cell).join(";"), ...lines].join("\r\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="catalogo-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
