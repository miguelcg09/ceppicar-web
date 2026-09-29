import Link from "next/link";
import { categories, categoryMeta, formatCLP } from "@/lib/products";
import { getProducts } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { ProductCard } from "@/components/ProductCard";
import { PartIcon } from "@/components/PartIcon";
import { Reveal } from "@/components/Reveal";
import { VehicleFinder } from "@/components/VehicleFinder";

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

export default async function Home() {
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);
  const featured = products.filter((p) => p.featured).slice(0, 6);
  const active = products.filter((p) => p.active);
  const freeCount = active.filter((p) => p.freeShipping).length;
  const counts = Object.fromEntries(categories.map((c) => [c, products.filter((p) => p.category === c).length])) as Record<string, number>;
  const makes = Object.entries(
    products.reduce<Record<string, number>>((acc, p) => (p.make ? ((acc[p.make] = (acc[p.make] ?? 0) + 1), acc) : acc), {}),
  ).sort((a, b) => b[1] - a[1]);

  return (
    <>
      {/* Portada: titular, cifras y buscador por vehículo */}
      <section className="hero">
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-14 md:pt-20">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-2">Repuestos automotrices · La Cisterna</p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-4 max-w-4xl font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-wide md:text-7xl">
              Repuestos para tu auto, <span className="text-gradient">directo a tu puerta</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <ul className="mt-6 flex flex-wrap gap-2 text-sm">
              {[
                [String(active.length), "repuestos listos"],
                [String(freeCount), "con envío gratis"],
                ["Platinum", "MercadoLíder"],
                ["3 meses", "de garantía"],
              ].map(([n, t]) => (
                <li key={t} className="flex items-baseline gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5">
                  <b className="font-display text-xl text-accent-2">{n}</b> {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-8 max-w-3xl rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-2xl font-bold uppercase">Mi auto</h2>
                <p className="text-sm text-white/70">Elige tu vehículo y te mostramos lo que le sirve</p>
              </div>
              <VehicleFinder />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Cinta de marcas */}
      <div className="overflow-hidden border-b bg-accent py-2 text-on-accent">
        <div className="flex w-max animate-marquee gap-2 whitespace-nowrap">
          {Array.from({ length: 2 }).flatMap((_, k) =>
            makes.map(([m, n]) => (
              <Link key={`${k}-${m}`} href={`/productos?marca=${encodeURIComponent(m)}`} className="border-r border-white/30 px-4 font-display text-lg font-bold uppercase tracking-wide hover:underline">
                {m} <small className="font-sans text-xs font-medium opacity-80">{n}</small>
              </Link>
            )),
          )}
        </div>
      </div>

      {/* Categorías */}
      <section id="categorias" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-14">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Categorías</p>
            <h2 className="mt-2 font-display text-3xl font-bold uppercase md:text-4xl">¿Qué necesita tu auto?</h2>
          </div>
          <Link href="/productos" className="btn-ghost text-sm">Ver todo el catálogo</Link>
        </Reveal>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
          {categories.filter((c) => counts[c] > 0).map((c, i) => (
            <Reveal key={c} delay={i * 40} className="h-full">
              <Link
                href={`/productos?categoria=${c}`}
                className="group flex h-full flex-col gap-3 rounded-2xl border bg-surface p-4 transition-all hover:-translate-y-1 hover:border-accent/50 hover:shadow-lg"
              >
                <PartIcon category={c} color={categoryMeta[c].color} className="h-12 w-12 transition-transform group-hover:scale-110" />
                <div>
                  <p className="font-semibold">{categoryMeta[c].name}</p>
                  <p className="mt-0.5 text-xs text-muted">{categoryMeta[c].blurb}</p>
                  <p className="mt-2 text-xs font-medium text-accent">{counts[c]} productos</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Destacados */}
      {featured.length > 0 && (
        <section className="band py-14">
          <div className="mx-auto max-w-6xl px-4">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Destacados</p>
              <h2 className="mt-2 font-display text-3xl font-bold uppercase md:text-4xl">Los más pedidos esta semana</h2>
            </Reveal>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
              {featured.map((p, i) => (
                <Reveal key={p.slug} delay={i * 60} className="h-full"><ProductCard product={p} /></Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Cómo comprar */}
      <section id="como-comprar" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-16">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Cómo comprar</p>
          <h2 className="mt-2 font-display text-3xl font-bold uppercase md:text-4xl">Tres pasos y listo</h2>
        </Reveal>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {buySteps.map((s, i) => (
            <Reveal key={s.title} delay={i * 90}>
              <li className="flex gap-4 rounded-2xl border bg-surface p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2 font-display text-lg font-bold text-on-accent">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold">{s.title}</p>
                  <p className="mt-1 text-sm text-muted">{s.text}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
        <Reveal delay={200}>
          <div className="mt-6 grid gap-4 rounded-2xl border bg-surface-2 p-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="font-semibold">¿Prefieres comprar por Mercado Libre?</p>
              <p className="mt-1 text-sm text-muted">
                Somos MercadoLíder Platinum. Cada ficha tiene el enlace a su publicación, con Mercado Envíos y la protección al comprador de siempre.
              </p>
            </div>
            {settings.mlUrl && <a href={settings.mlUrl} target="_blank" rel="noopener" className="btn-ml">Ver tienda en Mercado Libre ↗</a>}
          </div>
        </Reveal>
      </section>

      {/* Garantía y confianza */}
      <section className="band py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Garantía</p>
            <h2 className="mt-2 font-display text-3xl font-bold uppercase md:text-4xl">Compra tranquilo</h2>
            <p className="mt-4 text-muted">{settings.warranty}</p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Repuestos nuevos, alternativos de primera calidad y originales",
                "Envío gratis en la mayoría de los productos sobre " + formatCLP(settings.freeShippingFrom),
                "Retiro en tienda en La Cisterna coordinando antes",
                "Boleta o factura con cada compra",
              ].map((c) => (
                <li key={c} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ok/15 text-xs text-ok">✓</span>
                  {c}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120}>
            <div className="rounded-2xl border bg-surface p-6 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">¿Dudas de compatibilidad?</p>
              <h3 className="mt-2 font-display text-2xl font-bold uppercase">Envíanos tu VIN</h3>
              <p className="mt-3 text-sm text-muted">
                El VIN o número de chasis tiene 17 dígitos y está en el padrón de tu vehículo. Con él confirmamos el repuesto exacto antes de que compres.
              </p>
              <p className="mt-4 rounded-xl bg-surface-2 p-3 font-mono text-sm">WhatsApp {settings.whatsapp}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Preguntas */}
      <section id="faq" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-16">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Antes de comprar</p>
          <h2 className="mt-2 font-display text-3xl font-bold uppercase md:text-4xl">Lo que más nos preguntan</h2>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={i * 50} className="h-full">
              <div className="h-full rounded-2xl border bg-surface p-5">
                <p className="font-semibold">{f.q}</p>
                <p className="mt-2 text-sm text-muted">{f.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
