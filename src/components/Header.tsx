"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatCLP } from "@/lib/products";
import { useCart } from "./CartProvider";
import { VehicleChip } from "./VehicleFinder";

const links = [
  { href: "/productos", label: "Catálogo" },
  { href: "/#categorias", label: "Categorías" },
  { href: "/#como-comprar", label: "Cómo comprar" },
  { href: "/#faq", label: "Preguntas" },
];

export function Header() {
  const { count, setOpen, settings } = useCart();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [bump, setBump] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Pequeño rebote del contador al agregar productos
  useEffect(() => {
    if (count === 0) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 300);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <header className={`sticky top-0 z-30 transition-colors duration-300 ${scrolled ? "border-b bg-bg/85 backdrop-blur-xl" : "bg-transparent"}`}>
      <div className="overflow-hidden border-b bg-accent py-1.5 text-xs text-on-accent">
        <div className="flex w-max animate-marquee gap-12 whitespace-nowrap">
          {Array.from({ length: 2 }).flatMap((_, k) =>
            [
              `Envío a todo Chile · gratis sobre ${formatCLP(settings.freeShippingFrom)}`,
              "Retiro en La Cisterna coordinando antes",
              "Garantía legal de 3 meses",
              "MercadoLíder Platinum en Mercado Libre",
              "Boleta o factura",
            ].map((t) => <span key={`${k}-${t}`}>{t}</span>),
          )}
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="group flex items-baseline gap-1.5 font-display text-2xl font-extrabold uppercase tracking-wide">
          CEPPI<span className="text-accent-2">CAR</span>
        </Link>
        <form
          role="search"
          onSubmit={(e) => { e.preventDefault(); router.push(`/productos?q=${encodeURIComponent(q.trim())}`); }}
          className="order-last flex w-full md:order-none md:w-auto md:flex-1"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            placeholder="Busca por repuesto, modelo o código"
            aria-label="Buscar repuestos"
            className="field mt-0 rounded-r-none py-2 text-sm"
          />
          <button className="rounded-r-xl bg-accent px-4 text-sm font-semibold text-on-accent">Buscar</button>
        </form>
        <nav className="hidden gap-6 text-sm text-muted lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="relative transition-colors hover:text-fg after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-accent after:transition-all hover:after:w-full">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <VehicleChip />
          <button
            onClick={() => setOpen(true)}
            className="glass relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition hover:border-accent/60"
            aria-label="Abrir carrito"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2" /><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" />
            </svg>
            Carrito
            {count > 0 && (
              <span className={`absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent-2 px-1 text-xs font-bold text-on-accent transition-transform ${bump ? "scale-125" : ""}`}>
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
      <nav className="flex gap-6 overflow-x-auto px-4 pb-3 text-sm text-muted lg:hidden">
        {links.map((l) => <Link key={l.href} href={l.href} className="shrink-0">{l.label}</Link>)}
      </nav>
    </header>
  );
}
