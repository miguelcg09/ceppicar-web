"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { categories, categoryMeta, formatCLP } from "@/lib/products";
import { useCart, useStore } from "./CartProvider";
import { VehicleFinder } from "./VehicleFinder";

const Icon = {
  car: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 13l2-5.5A2 2 0 0 1 6.9 6h10.2a2 2 0 0 1 1.9 1.5L21 13" /><path d="M3 13h18v5a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1h-11v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><circle cx="7.5" cy="15.5" r="1" fill="currentColor" /><circle cx="16.5" cy="15.5" r="1" fill="currentColor" /></svg>,
  search: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>,
  pin: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z" /><circle cx="12" cy="10" r="2.2" /></svg>,
  chat: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 5h16v11H8l-4 4z" /><path d="M8 9h8M8 12h5" /></svg>,
  cart: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2" /><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /></svg>,
  menu: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M4 7h16M4 12h16M4 17h16" /></svg>,
  chevron: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m6 9 6 6 6-6" /></svg>,
};

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`} aria-label="CEPPICAR, inicio">
      <span className="grid h-9 w-9 place-items-center rounded-md bg-accent text-on-accent">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.1-2.1z" /></svg>
      </span>
      <span className="font-display text-2xl font-bold leading-none tracking-tight">
        CEPPI<span className="text-accent">CAR</span><span className="text-cta">.</span>
      </span>
    </Link>
  );
}

// Botón "Mi vehículo" con el selector desplegable, como en las tiendas de repuestos.
function VehicleButton() {
  const { vehicle } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const text = vehicle.make ? [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" ") : "Agregar vehículo";

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-12 items-center gap-2 rounded-md border bg-surface-2 px-3 text-left text-sm font-semibold transition hover:border-accent"
        aria-expanded={open}
      >
        <span className="relative text-accent">
          {Icon.car}
          {!vehicle.make && <span className="absolute -right-1.5 -top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-cta text-[10px] font-bold text-on-cta">+</span>}
        </span>
        <span className="max-w-[10rem] truncate">{text}</span>
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>{Icon.chevron}</span>
      </button>
      {open && (
        <div className="animate-fade absolute left-0 top-[calc(100%+8px)] z-40 w-[min(92vw,42rem)] rounded-lg border bg-surface p-4 shadow-2xl">
          <p className="font-semibold">Elige tu vehículo</p>
          <p className="mb-3 text-xs text-muted">Te mostramos solo los repuestos que le sirven.</p>
          <VehicleFinder onDone={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { count, setOpen, settings } = useCart();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [bump, setBump] = useState(false);
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (count === 0) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 400);
    return () => clearTimeout(t);
  }, [count]);

  const wa = settings.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}` : undefined;

  return (
    <header className={`sticky top-0 z-30 bg-surface transition-shadow ${scrolled ? "shadow-md" : ""}`}>
      {/* Franja superior con los beneficios */}
      <div className={`overflow-hidden bg-navy text-on-navy transition-[max-height] duration-300 ${scrolled ? "max-h-0" : "max-h-10"}`}>
        <ul className="mx-auto flex max-w-7xl justify-center gap-8 px-4 py-1.5 text-xs font-medium">
          <li>Envío a todo Chile · gratis sobre {formatCLP(settings.freeShippingFrom)}</li>
          <li className="hidden sm:block">Retiro en La Cisterna</li>
          <li className="hidden md:block">Garantía legal de 3 meses</li>
          <li className="hidden lg:block">MercadoLíder Platinum</li>
        </ul>
      </div>

      {/* Fila principal: logo, vehículo, buscador, accesos */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
        <button type="button" onClick={() => setMenu((m) => !m)} className="grid h-11 w-11 place-items-center rounded-md hover:bg-surface-2 lg:hidden" aria-label="Menú">
          {Icon.menu}
        </button>
        <Logo />
        <div className="hidden md:block"><VehicleButton /></div>
        <form
          role="search"
          onSubmit={(e) => { e.preventDefault(); router.push(`/productos?q=${encodeURIComponent(q.trim())}`); }}
          className="order-last flex h-12 w-full overflow-hidden rounded-md border-2 border-fg/25 bg-surface transition focus-within:border-accent md:order-none md:w-auto md:flex-1"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            placeholder="Busca por repuesto, vehículo, marca o código"
            aria-label="Buscar repuestos"
            className="min-w-0 flex-1 bg-transparent px-4 text-base outline-none placeholder:text-muted"
          />
          <button className="grid w-14 place-items-center bg-cta text-on-cta transition hover:brightness-105" aria-label="Buscar">{Icon.search}</button>
        </form>
        <div className="ml-auto flex items-center gap-1 text-xs font-medium">
          <span className="hidden flex-col items-center px-3 text-muted sm:flex">
            {Icon.pin}
            La Cisterna
          </span>
          {wa && (
            <a href={wa} target="_blank" rel="noopener" className="hidden flex-col items-center rounded-md px-3 py-1 hover:bg-surface-2 sm:flex">
              {Icon.chat}
              Ayuda
            </a>
          )}
          <button onClick={() => setOpen(true)} className="relative flex flex-col items-center rounded-md px-3 py-1 hover:bg-surface-2" aria-label="Abrir carrito">
            <span className="relative">
              {Icon.cart}
              {count > 0 && (
                <span className={`absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-cta px-1 text-[11px] font-bold text-on-cta ${bump ? "animate-pop" : ""}`}>
                  {count}
                </span>
              )}
            </span>
            Carrito
          </button>
        </div>
      </div>

      {/* Barra de categorías */}
      <nav className="bg-navy text-on-navy" aria-label="Categorías">
        <ul className="mx-auto hidden max-w-7xl items-center px-2 text-[15px] font-semibold lg:flex">
          {categories.filter((c) => c !== "otros").map((c) => (
            <li key={c}>
              <Link href={`/productos?categoria=${c}`} className="block border-b-[3px] border-transparent px-3 py-3 transition hover:border-cta hover:bg-white/5">
                {categoryMeta[c].name}
              </Link>
            </li>
          ))}
          <li className="ml-auto">
            <Link href="/productos" className="block border-b-[3px] border-transparent px-3 py-3 text-cta transition hover:border-cta">Todo el catálogo</Link>
          </li>
        </ul>
        <div className="flex gap-1 overflow-x-auto px-2 py-2 text-sm font-semibold lg:hidden">
          {categories.filter((c) => c !== "otros").map((c) => (
            <Link key={c} href={`/productos?categoria=${c}`} className="shrink-0 rounded-md px-3 py-1.5 hover:bg-white/10">{categoryMeta[c].name}</Link>
          ))}
        </div>
      </nav>

      {/* Menú móvil: vehículo y accesos */}
      {menu && (
        <div className="animate-fade border-t bg-surface p-4 lg:hidden">
          <p className="mb-2 font-semibold">Mi vehículo</p>
          <VehicleFinder compact onDone={() => setMenu(false)} />
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
            <Link href="/productos" onClick={() => setMenu(false)}>Catálogo</Link>
            <Link href="/#como-comprar" onClick={() => setMenu(false)}>Cómo comprar</Link>
            <Link href="/#faq" onClick={() => setMenu(false)}>Preguntas</Link>
            {wa && <a href={wa} target="_blank" rel="noopener">WhatsApp</a>}
          </div>
        </div>
      )}
    </header>
  );
}
