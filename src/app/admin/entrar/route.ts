import { NextResponse } from "next/server";

// Recibe la clave del formulario y, si es correcta, deja una cookie por 30 días.
export async function POST(req: Request) {
  const form = await req.formData();
  const clave = String(form.get("clave") ?? "");
  const url = new URL("/admin/pedidos", req.url);
  if (!process.env.ADMIN_PASSWORD || clave !== process.env.ADMIN_PASSWORD) {
    url.searchParams.set("error", "1");
    return NextResponse.redirect(url, 303);
  }
  const res = NextResponse.redirect(url, 303);
  res.cookies.set("admin", clave, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
