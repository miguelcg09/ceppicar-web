import { notFound } from "next/navigation";
import { getProduct } from "@/lib/catalog";
import { categories, categoryMeta, type Product } from "@/lib/products";
import { ProductImage } from "@/components/ProductImage";
import { saveProduct } from "../../actions";

export const dynamic = "force-dynamic";

const empty: Product = {
  slug: "",
  name: "",
  category: "suspension",
  mlCategory: "",
  short: "",
  description: "",
  brand: "",
  origin: "",
  warranty: "3 meses",
  make: "",
  model: "",
  yearFrom: null,
  yearTo: null,
  sku: "",
  mlId: "",
  color: "#0b3d91",
  variants: [],
  featured: false,
  visible: true,
  active: true,
  freeShipping: true,
  sort: 0,
};

export default async function EditarProducto({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const isNew = slug === "nuevo";
  const product = isNew ? empty : await getProduct(slug, { includeHidden: true });
  if (!product) notFound();
  const canUpload = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const rows = [...product.variants, ...Array.from({ length: Math.max(1, 3 - product.variants.length) }, () => null)];

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-bold uppercase">{isNew ? "Nuevo producto" : "Editar producto"}</h1>
      {!isNew && <p className="mt-1 text-sm text-muted">{product.name}</p>}

      <form action={saveProduct} className="mt-8 space-y-8">
        {!isNew && <input type="hidden" name="originalSlug" value={product.slug} />}
        <input type="hidden" name="currentImageUrl" value={product.imageUrl ?? ""} />

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 font-semibold">Datos principales</legend>
          <label className="text-sm sm:col-span-2">Nombre (título de la publicación)<input name="name" required defaultValue={product.name} className="field" /></label>
          <label className="text-sm">Categoría
            <select name="category" defaultValue={product.category} className="field">
              {categories.map((c) => <option key={c} value={c} className="bg-surface">{categoryMeta[c].name}</option>)}
            </select>
          </label>
          <label className="text-sm">Categoría en Mercado Libre<input name="mlCategory" defaultValue={product.mlCategory} placeholder="Amortiguadores para autos y camionetas" className="field" /></label>
          <label className="text-sm sm:col-span-2">Descripción<textarea name="description" rows={4} defaultValue={product.description} className="field" /></label>
          <label className="text-sm">Marca del repuesto<input name="brand" defaultValue={product.brand} placeholder="Ej: GMB, Nissens" className="field" /></label>
          <label className="text-sm">Origen<input name="origin" defaultValue={product.origin} placeholder="Ej: Taiwán, Corea" className="field" /></label>
          <label className="text-sm">Garantía<input name="warranty" defaultValue={product.warranty} className="field" /></label>
          <label className="text-sm">Código / SKU<input name="sku" defaultValue={product.sku} className="field" /></label>
          <label className="text-sm">Publicación en Mercado Libre (MLC…)<input name="mlId" defaultValue={product.mlId} placeholder="MLC626187100" className="field font-mono" /></label>
          <label className="text-sm">Orden en el catálogo<input name="sort" type="number" defaultValue={product.sort} className="field" /></label>
          {isNew && <label className="text-sm sm:col-span-2">Dirección (opcional, se genera del nombre)<input name="slug" placeholder="amortiguadores-traseros-sail" className="field" /></label>}
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-4">
          <legend className="mb-2 font-semibold">Vehículo compatible</legend>
          <label className="text-sm">Marca<input name="make" defaultValue={product.make} placeholder="Chevrolet" className="field" /></label>
          <label className="text-sm">Modelo<input name="model" defaultValue={product.model} placeholder="Sail" className="field" /></label>
          <label className="text-sm">Desde<input name="yearFrom" type="number" defaultValue={product.yearFrom ?? ""} placeholder="2011" className="field" /></label>
          <label className="text-sm">Hasta<input name="yearTo" type="number" defaultValue={product.yearTo ?? ""} placeholder="2020" className="field" /></label>
          <p className="text-xs text-muted sm:col-span-4">Deja la marca vacía si el producto es universal. Escribe la marca y el modelo igual que en otros productos para que aparezcan juntos en el buscador.</p>
          <label className="text-sm sm:col-span-4">Resumen (aparece en la tarjeta; si lo dejas vacío se usa el vehículo)<input name="short" defaultValue={product.short} className="field" /></label>
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-[120px_1fr]">
          <legend className="mb-2 font-semibold">Foto</legend>
          <div className="grid h-32 w-full place-items-center rounded-2xl border bg-surface-2 p-3">
            <ProductImage product={product} className="h-full w-full" />
          </div>
          <div className="space-y-3 text-sm">
            {canUpload ? (
              <label className="block">Subir foto (JPG, PNG o WebP)<input name="imagen" type="file" accept="image/*" className="field" /></label>
            ) : (
              <p className="rounded-lg bg-amber-400/10 p-3 text-xs text-amber-800 dark:text-amber-200">
                Para subir fotos desde aquí, en Vercel ve a Storage &gt; Create Database &gt; Blob y vuelve a desplegar. Mientras tanto pega un enlace (por ejemplo, la foto de la publicación en Mercado Libre).
              </p>
            )}
            <label className="block">Enlace a la foto<input name="imageUrl" defaultValue={product.imageUrl ?? ""} placeholder="https://…" className="field" /></label>
            <label className="flex items-center gap-2">Color de la ilustración (si no hay foto)<input name="color" type="color" defaultValue={product.color} className="h-8 w-12 rounded border" /></label>
            {product.imageUrl && <label className="flex items-center gap-2"><input type="checkbox" name="quitarImagen" /> Quitar la foto y volver a la ilustración</label>}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 font-semibold">Precio y stock</legend>
          <p className="mb-3 text-xs text-muted">Una fila por opción (Unidad, Derecho, Izquierdo…). Deja el stock vacío para no controlarlo; con 0 aparece como agotado.</p>
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_120px_100px] gap-2 text-xs text-muted"><span>Opción</span><span>Precio CLP</span><span>Stock</span></div>
            {rows.map((v, i) => (
              <div key={v?.id ?? `n${i}`} className="grid grid-cols-[1fr_120px_100px] gap-2">
                <input type="hidden" name="v_id" value={v?.id ?? ""} />
                <input name="v_label" defaultValue={v?.label ?? (i === 0 && isNew ? "Unidad" : "")} placeholder="Unidad" className="field mt-0" />
                <input name="v_price" type="number" min={0} defaultValue={v?.price ?? ""} placeholder="29990" className="field mt-0" />
                <input name="v_stock" type="number" min={0} defaultValue={v?.stock ?? ""} placeholder="—" className="field mt-0" />
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-wrap gap-6 text-sm">
          <legend className="mb-2 font-semibold">Visibilidad y envío</legend>
          <label className="flex items-center gap-2"><input type="checkbox" name="visible" defaultChecked={product.visible} /> Visible en la tienda</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={product.active} /> Activo en Mercado Libre</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={product.featured} /> Destacado en el inicio</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="freeShipping" defaultChecked={product.freeShipping} /> Envío gratis</label>
        </fieldset>

        <div className="flex gap-3">
          <button className="btn-primary">Guardar</button>
          <a href="/admin/productos" className="btn-ghost">Cancelar</a>
        </div>
      </form>
    </div>
  );
}
