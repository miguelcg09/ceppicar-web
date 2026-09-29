import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdmin } from "@/lib/admin";
import { exchangeCode } from "@/lib/ml-auth";

export const dynamic = "force-dynamic";

// Mercado Libre vuelve aquí con el código de autorización; lo cambiamos por los tokens y los guardamos.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const back = (msg: string, ok = false) => NextResponse.redirect(new URL(`/admin/mercadolibre?${ok ? "conectado" : "error"}=${encodeURIComponent(msg)}`, req.url));
  if (!(await isAdmin())) return back("Entra al panel antes de conectar Mercado Libre");
  const jar = await cookies();
  const state = jar.get("ml_state")?.value;
  jar.delete("ml_state");
  if (!state || state !== url.searchParams.get("state")) return back("La autorización no coincide; inténtalo de nuevo");
  const code = url.searchParams.get("code");
  if (!code) return back(url.searchParams.get("error_description") || "Mercado Libre no devolvió el código");
  try {
    const auth = await exchangeCode(code);
    return back(auth.nickname || String(auth.userId), true);
  } catch (e) {
    return back(e instanceof Error ? e.message : "No se pudo completar la conexión");
  }
}
