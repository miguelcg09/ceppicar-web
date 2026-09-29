import "server-only";
import { cookies } from "next/headers";

export async function isAdmin() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const cookie = (await cookies()).get("admin")?.value;
  return cookie === password;
}

export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("No autorizado");
}
