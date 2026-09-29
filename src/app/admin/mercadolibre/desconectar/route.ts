import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { saveMlAuth } from "@/lib/ml-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await isAdmin())) return new Response("No autorizado", { status: 401 });
  await saveMlAuth(null);
  return NextResponse.redirect(new URL("/admin/mercadolibre", req.url), 303);
}
