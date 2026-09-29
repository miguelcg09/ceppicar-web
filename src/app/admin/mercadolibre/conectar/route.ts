import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdmin } from "@/lib/admin";
import { mlAppConfigured, mlAuthorizeUrl } from "@/lib/ml-auth";

export const dynamic = "force-dynamic";

// Inicia la conexión con Mercado Libre: manda al administrador a autorizar la aplicación.
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/admin", req.url));
  if (!mlAppConfigured()) return NextResponse.redirect(new URL("/admin/mercadolibre?error=" + encodeURIComponent("Faltan ML_CLIENT_ID y ML_CLIENT_SECRET en Vercel"), req.url));
  const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
  (await cookies()).set("ml_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/" });
  return NextResponse.redirect(mlAuthorizeUrl(state));
}
