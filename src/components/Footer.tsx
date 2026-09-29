import Link from "next/link";
import type { Settings } from "@/lib/config";
import { categories, categoryMeta } from "@/lib/products";
import { MLLogo } from "./MLLogo";

export function Footer({ settings }: { settings: Settings }) {
  return (
    <footer className="mt-20 bg-navy text-on-navy">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-bold">CEPPI<span className="text-cta">CAR</span></p>
          <p className="mt-2 text-sm text-white/70">{settings.tagline}</p>
          {settings.mlUrl && (
            <a href={settings.mlUrl} target="_blank" rel="noopener" className="mt-4 inline-flex items-center gap-3 rounded-lg bg-white/10 p-2 pr-4 text-sm font-semibold hover:bg-white/15">
              <MLLogo className="h-9" />
              <span>Repuestos Ceppicar<br /><span className="text-xs font-normal text-white/70">Tienda oficial en Mercado Libre ↗</span></span>
            </a>
          )}
        </div>
        <div className="text-sm">
          <p className="font-semibold">Categorías</p>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-white/70 md:grid-cols-1">
            {categories.filter((c) => c !== "otros").map((c) => (
              <li key={c}><Link href={`/productos?categoria=${c}`} className="hover:text-cta">{categoryMeta[c].name}</Link></li>
            ))}
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Tienda</p>
          <ul className="mt-3 space-y-2 text-white/70">
            <li><Link href="/productos" className="hover:text-cta">Catálogo completo</Link></li>
            <li><Link href="/carrito" className="hover:text-cta">Carrito</Link></li>
            <li><Link href="/#como-comprar" className="hover:text-cta">Cómo comprar</Link></li>
            <li><Link href="/#faq" className="hover:text-cta">Preguntas frecuentes</Link></li>
            <li><Link href="/terminos" className="hover:text-cta">Términos y garantía</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Contacto</p>
          <p className="mt-3 text-white/70">{settings.email}</p>
          <p className="text-white/70">WhatsApp {settings.whatsapp}</p>
          <p className="mt-2 text-white/70">{settings.address}</p>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-6 text-center text-xs text-white/60">
        <p className="mx-auto max-w-3xl">{settings.warranty}</p>
        <p className="mt-2">© {new Date().getFullYear()} {settings.name} · Repuestos automotrices</p>
      </div>
    </footer>
  );
}
