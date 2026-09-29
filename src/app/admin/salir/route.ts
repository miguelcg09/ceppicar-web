import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/admin/pedidos", req.url), 303);
  res.cookies.delete({ name: "admin", path: "/admin" });
  return res;
}
