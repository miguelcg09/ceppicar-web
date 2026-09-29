import Link from "next/link";
import { categories, formatCLP } from "@/lib/products";
import { getProducts } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { ProductCard } from "@/components/ProductCard";
import { CategoryRail } from "@/components/CategoryRail";
import { HeroFinder } from "@/components/HeroFinder";
import { PromoCarousel, type Slide } from "@/components/PromoCarousel";
import { Reveal } from "@/components/Reveal";
import { MLLogo } from "@/components/MLLogo";

const buySteps = [
  { title: "Elige tu auto", text: "Marca, modelo y año. Te mostramos solo lo que le sirve." },
  { title: "Agrega al carrito y paga", text: "Tarjeta, débito o Mercado Pago, en pesos chilenos." },
  { title: "Recíbelo o retíralo", text: "Envío a todo Chile con seguimiento, o retiro en La Cisterna." },
];

const faqs = [
  { q: "¿Cómo sé si el repuesto le sirve a mi auto?", a: "Cada ficha indica marca, modelo y años. Si tienes dudas, envíanos el VIN de 17 dígitos que aparece en tu padrón y lo confirmamos antes de que compres." },
  { q: "¿Los repuestos son originales?", a: "Trabajamos con repuestos alternativos de primera calidad y originales según se indique en cada ficha. Todos son nuevos y con garantía." },
  { q: "¿Cuánto demora el envío?", a: "Despachamos dentro de 1 día hábil desde Santiago. En regiones, el plazo depende de la empresa de transporte; te enviamos el número de seguimiento por correo." },
  { q: "¿Puedo retirar en la tienda?", a: "Sí, en La Cisterna, coordinando antes por WhatsApp. Al elegir retiro en el checkout no se cobra envío." },
  { q: "¿Qué garantía tienen?", a: "Garantía legal de 3 meses por fallas de fabricación y compatibilidad. El producto y su empaque deben estar en óptimas condiciones para el cambio." },
  { q: "¿Emiten factura?", a: "Sí. Al finalizar la compra marca “Necesito factura” y escribe la razón social, RUT y giro." },
];

const trust = [
  { title: "Envío a todo Chile", text: "Con seguimiento. Gratis en la mayoría de los repuestos.", icon: <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM6 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" /> },
  { title: "Retiro en tienda", text: "En La Cisterna, coordinando antes. Sin costo.", icon: <path d="M4 10l1.5-5h13L20 10M4 10v10h16V10M4 10h16M9 20v-6h6v6" /> },
  { title: "Garantía legal", text: "3 meses por fallas de fabricación y compatibilidad.", icon: <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6zM9 12l2 2 4-4" /> },
  { title: "MercadoLíder Platinum", text: "Miles de ventas y reputación verificada en Mercado Libre.", icon: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /> },
];

export default async function Home() {
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);
  const active = products.filter((p) => p.active);
  const featured = products.filter((p) => p.featured).slice(0, 6);
  const best = (featured.length >= 4 ? featured : active.slice(0, 6)).slice(0, 6);
  const freeCount = active.filter((p) => p.freeShipping).length;
  const rail = categories
    .map((c) => ({ category: c, count: products.filter((p) => p.category === c).length }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
  const makes = Object.entries(
    products.reduce<Record<string, number>>((acc, p) => (p.make ? ((acc[p.make] = (acc[p.make] ?? 0) + 1), acc) : acc), {}),
  ).sort((a, b) => b[1] - a[1]);

  const slides: Slide[] = [
    { kicker: "Envío gratis", title: `${freeCount} repuestos con envío gratis a todo Chile`, text: "Sin mínimo de compra en los productos marcados. El resto, gratis sobre " + formatCLP(settings.freeShippingFrom) + ".", cta: "Ver catálogo", href: "/productos", tone: "navy" },
    { kicker: "Retiro en tienda", title: "Retíralo hoy en La Cisterna", text: "Compra en línea, coordina por WhatsApp y pasa a buscarlo. Sin costo de envío.", cta: "Cómo comprar", href: "/#como-comprar", tone: "blue" },
    { kicker: "Tienda oficial en Mercado Libre", title: "Repuestos Ceppicar, MercadoLíder Platinum", text: "Si prefieres, compra la misma pieza en nuestra tienda de Mercado Libre con Mercado Envíos y la protección al comprador.", cta: "Ver tienda Repuestos Ceppicar", href: settings.mlUrl || "/productos", tone: "yellow", badge: <MLLogo className="h-9 rounded-full ring-2 ring-white" /> },
  ];

  return (
    <>
      {/* Portada: titular y buscador de vehículo con pestañas */}
      <section className="hero">
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-10 md:pb-14 md:pt-16">
          <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
            El repuesto <span className="text-cta">correcto</span>, justo cuando lo <span className="text-cta">necesitas</span>
          </h1>
          <p className="mt-3 max-w-2xl text-white/80 md:text-lg">
            {active.length} repuestos en stock para las marcas más vendidas en Chile. Elige tu auto y te mostramos solo lo que le sirve.
          </p>
          <div className="mt-8 max-w-4xl">
            <HeroFinder whatsapp={settings.whatsapp} />
          </div>
        </div>
      </section>

      {/* Categorías con desplazamiento */}
      <section id="categorias" className="mx-auto max-w-7xl scroll-mt-40 px-4 pt-10">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Compra por categoría</h2>
          <Link href="/productos" className="text-sm font-semibold text-accent hover:underline">Ver todo el catálogo ›</Link>
        </div>
        <div className="mt-6"><CategoryRail items={rail} /></div>
      </section>

      {/* Más vendidos */}
      <section className="mx-auto max-w-7xl px-4 pt-14">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Los más vendidos</h2>
          <Link href="/productos" className="text-sm font-semibold text-accent hover:underline">Ver más ›</Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {best.map((p, i) => (
            <Reveal key={p.slug} delay={i * 50} className="h-full"><ProductCard product={p} /></Reveal>
          ))}
        </div>
      </section>

      {/* Promociones */}
      <section className="mx-auto max-w-7xl px-4 pt-14">
        <PromoCarousel slides={slides} external />
      </section>

      {/* Marcas */}
      <section className="mx-auto max-w-7xl px-4 pt-14">
        <h2 className="font-display text-2xl font-bold md:text-3xl">Compra por marca</h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {makes.map(([m, n]) => (
            <Link key={m} href={`/productos?marca=${encodeURIComponent(m)}`} className="card card-hover px-4 py-2 text-sm font-semibold">
              {m} <span className="ml-1 text-xs font-normal text-muted">{n}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Confianza */}
      <section className="band mt-14 py-10">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-4">
          {trust.map((t) => (
            <div key={t.title} className="flex gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-tile text-accent">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{t.icon}</svg>
              </span>
              <div>
                <p className="font-semibold">{t.title}</p>
                <p className="mt-0.5 text-sm text-muted">{t.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo comprar */}
      <section id="como-comprar" className="mx-auto max-w-7xl scroll-mt-40 px-4 pt-14">
        <h2 className="font-display text-2xl font-bold md:text-3xl">Cómo comprar</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {buySteps.map((s, i) => (
            <li key={s.title} className="card flex gap-4 p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent font-display text-lg font-bold text-on-accent">{i + 1}</span>
              <div>
                <p className="font-semibold">{s.title}</p>
                <p className="mt-1 text-sm text-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Preguntas */}
      <section id="faq" className="mx-auto max-w-7xl scroll-mt-40 px-4 pt-14">
        <h2 className="font-display text-2xl font-bold md:text-3xl">Preguntas frecuentes</h2>
        <div className="card mt-6 divide-y">
          {faqs.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {f.q}
                <span className="text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
