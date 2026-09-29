import Link from "next/link";
import type { Metadata } from "next";
import { isAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Administración", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/mercadolibre", label: "Mercado Libre" },
  { href: "/admin/ajustes", label: "Ajustes" },
];

// Todo lo que cuelga de /admin pide la clave (ADMIN_PASSWORD) y la recuerda 30 días.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Acceso privado</h1>
        <p className="mt-3 text-sm text-muted">
          {process.env.ADMIN_PASSWORD
            ? "Escribe la clave de administrador."
            : "Configura ADMIN_PASSWORD para habilitar la administración."}
        </p>
        <form method="post" action="/admin/entrar" className="mt-6 flex gap-2">
          <input name="clave" type="password" placeholder="Clave" autoFocus className="field mt-0" />
          <button className="btn-primary text-sm">Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center gap-2 border-b pb-4">
        <span className="mr-2 text-xs font-semibold uppercase tracking-widest text-accent">Administración</span>
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className="rounded-full border px-4 py-1.5 text-sm hover:border-accent">
            {n.label}
          </Link>
        ))}
        <div className="ml-auto flex items-center gap-3">
          <Link href="/" target="_blank" className="text-sm text-muted hover:text-fg">Ver tienda ↗</Link>
          <form method="post" action="/admin/salir">
            <button className="text-sm text-muted hover:text-fg">Salir</button>
          </form>
        </div>
      </div>
      {children}
    </div>
  );
}
