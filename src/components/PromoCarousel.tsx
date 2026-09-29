"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type Slide = { kicker: string; title: string; text: string; cta: string; href: string; tone: "navy" | "blue" | "yellow"; badge?: React.ReactNode };

const tones: Record<Slide["tone"], string> = {
  navy: "bg-navy text-white",
  blue: "bg-accent text-white",
  yellow: "bg-cta text-on-cta",
};

// Carrusel de promociones con puntos, flechas y pausa, como en las tiendas de repuestos.
export function PromoCarousel({ slides, external }: { slides: Slide[]; external?: boolean }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  const go = (n: number) => setI((n + slides.length) % slides.length);

  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="overflow-hidden rounded-lg">
        <div className="slides" style={{ transform: `translateX(-${i * 100}%)` }}>
          {slides.map((s) => (
            <div key={s.title} className={`slide ${tones[s.tone]}`}>
              <div className="flex min-h-56 flex-col justify-center gap-3 px-8 py-10 md:px-14">
                <div className="flex items-center gap-3">
                  {s.badge}
                  <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">{s.kicker}</p>
                </div>
                <p className="max-w-2xl font-display text-3xl font-bold leading-tight md:text-5xl">{s.title}</p>
                <p className="max-w-xl opacity-85">{s.text}</p>
                {external && s.href.startsWith("http") ? (
                  <a href={s.href} target="_blank" rel="noopener" className={`${s.tone === "yellow" ? "btn-primary" : "btn-cta"} mt-2 w-fit`}>{s.cta}</a>
                ) : (
                  <Link href={s.href} className={`${s.tone === "yellow" ? "btn-primary" : "btn-cta"} mt-2 w-fit`}>{s.cta}</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-3">
        <button type="button" onClick={() => go(i - 1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface-2" aria-label="Anterior">‹</button>
        <button type="button" onClick={() => setPaused((p) => !p)} className="grid h-8 w-8 place-items-center rounded-full text-sm hover:bg-surface-2" aria-label={paused ? "Reanudar" : "Pausar"}>
          {paused ? "▶" : "❚❚"}
        </button>
        {slides.map((s, n) => (
          <button key={s.title} type="button" onClick={() => setI(n)} className="dot" aria-current={n === i} aria-label={`Ir a ${n + 1}`} />
        ))}
        <button type="button" onClick={() => go(i + 1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface-2" aria-label="Siguiente">›</button>
      </div>
    </div>
  );
}
