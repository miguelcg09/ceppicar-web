"use client";

import Link from "next/link";
import { useRef } from "react";
import { categoryMeta, type Category } from "@/lib/products";
import { PartIcon } from "./PartIcon";

// Fila de categorías con imagen sobre celeste y flechas para desplazarla.
export function CategoryRail({ items }: { items: { category: Category; count: number }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div className="relative">
      <div ref={ref} className="rail">
        {items.map(({ category, count }) => (
          <Link
            key={category}
            href={`/productos?categoria=${category}`}
            className="group w-[46%] shrink-0 sm:w-[30%] md:w-[23%] lg:w-[18.5%]"
          >
            <div className="tile grid aspect-[4/3] place-items-center overflow-hidden rounded-lg transition group-hover:shadow-lg">
              <PartIcon category={category} color={categoryMeta[category].color} className="h-1/2 w-1/2 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <p className="mt-3 text-center text-base font-medium group-hover:text-accent">{categoryMeta[category].name}</p>
            <p className="text-center text-xs text-muted">{count} producto{count === 1 ? "" : "s"}</p>
          </Link>
        ))}
      </div>
      <button type="button" onClick={() => scroll(-1)} className="absolute -left-3 top-[38%] hidden h-10 w-10 place-items-center rounded-full border bg-surface shadow-md hover:bg-surface-2 md:grid" aria-label="Anterior">‹</button>
      <button type="button" onClick={() => scroll(1)} className="absolute -right-3 top-[38%] hidden h-10 w-10 place-items-center rounded-full border bg-surface shadow-md hover:bg-surface-2 md:grid" aria-label="Siguiente">›</button>
    </div>
  );
}
