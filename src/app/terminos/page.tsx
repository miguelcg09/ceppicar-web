import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Términos y condiciones" };

// El texto se edita en /admin/ajustes. Debe revisarlo un abogado antes de publicar.
export default async function Terminos() {
  const { terminos } = await getSettings();
  const blocks = terminos.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 text-fg/80">
      <h1 className="font-display text-3xl font-bold text-fg md:text-4xl">Términos y condiciones</h1>
      {blocks.map((b, i) =>
        b.startsWith("## ") ? (
          <h2 key={i} className="mt-8 text-xl font-semibold text-fg">{b.slice(3)}</h2>
        ) : (
          <p key={i} className="mt-3 whitespace-pre-line">{b}</p>
        ),
      )}
    </article>
  );
}
