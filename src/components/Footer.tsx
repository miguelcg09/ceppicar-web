import Link from "next/link";
import type { Settings } from "@/lib/config";
import { categories, categoryMeta } from "@/lib/products";

export function Footer({ settings }: { settings: Settings }) {
  return (
    <footer className="relative mt-28 overflow-hidden border-t-4 border-accent bg-surface-2">
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-extrabold uppercase tracking-wide">CEPPI<span className="text-accent-2">CAR</span></p>
          <p className="mt-2 text-sm text-muted">{settings.tagline}</p>
          {settings.mlUrl && (
            <a href={settings.mlUrl} target="_blank" rel="noopener" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
              Nuestra tienda en Mercado Libre ↗
            </a>
          )}
        </div>
        <div className="text-sm">
          <p className="font-semibold">Categorías</p>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-muted md:grid-cols-1">
            {categories.filter((c) => c !== "otros").map((c) => (
              <li key={c}><Link href={`/productos?categoria=${c}`} className="hover:text-accent">{categoryMeta[c].name}</Link></li>
            ))}
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Tienda</p>
          <ul className="mt-3 space-y-2 text-muted">
            <li><Link href="/productos" className="hover:text-accent">Catálogo completo</Link></li>
            <li><Link href="/carrito" className="hover:text-accent">Carrito</Link></li>
            <li><Link href="/#como-comprar" className="hover:text-accent">Cómo comprar</Link></li>
            <li><Link href="/terminos" className="hover:text-accent">Términos y garantía</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Contacto</p>
          <p className="mt-3 text-muted">{settings.email}</p>
          <p className="text-muted">WhatsApp {settings.whatsapp}</p>
          <p className="mt-2 text-muted">{settings.address}</p>
        </div>
      </div>
      <div className="relative border-t px-4 py-6 text-center text-xs text-muted">
        <p className="mx-auto max-w-3xl">{settings.warranty}</p>
        <p className="mt-2">© {new Date().getFullYear()} {settings.name} · Repuestos automotrices</p>
      </div>
    </footer>
  );
}
