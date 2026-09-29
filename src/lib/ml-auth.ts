import "server-only";
import { query } from "./db";

// Conexión OAuth con Mercado Libre. Requiere una aplicación creada en developers.mercadolibre.cl
// con ML_CLIENT_ID y ML_CLIENT_SECRET en Vercel y la URL de retorno /admin/mercadolibre/callback.
// El token de acceso dura 6 horas; se renueva solo con el refresh token guardado en la tabla kv.

export type MlAuth = { accessToken: string; refreshToken: string; expiresAt: number; userId: number; nickname: string };

const KEY = "ml_auth";

export function mlAppConfigured() {
  return Boolean(process.env.ML_CLIENT_ID && process.env.ML_CLIENT_SECRET);
}

export function mlRedirectUri() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")).replace(/\/$/, "");
  return `${base}/admin/mercadolibre/callback`;
}

export function mlAuthorizeUrl(state: string) {
  const q = new URLSearchParams({ response_type: "code", client_id: process.env.ML_CLIENT_ID ?? "", redirect_uri: mlRedirectUri(), state });
  return `https://auth.mercadolibre.cl/authorization?${q}`;
}

export async function getMlAuth(): Promise<MlAuth | null> {
  const [row] = await query<{ value: MlAuth | string }>("SELECT value FROM kv WHERE key = $1", [KEY]);
  if (!row) return null;
  return typeof row.value === "string" ? (JSON.parse(row.value) as MlAuth) : row.value;
}

export async function saveMlAuth(auth: MlAuth | null) {
  if (!auth) { await query("DELETE FROM kv WHERE key = $1", [KEY]); return; }
  await query("INSERT INTO kv (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [KEY, JSON.stringify(auth)]);
}

type TokenResponse = { access_token: string; refresh_token: string; expires_in: number; user_id: number; error?: string; message?: string };

async function tokenRequest(body: Record<string, string>): Promise<MlAuth> {
  const res = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({ client_id: process.env.ML_CLIENT_ID ?? "", client_secret: process.env.ML_CLIENT_SECRET ?? "", ...body }),
    cache: "no-store",
  });
  const data = (await res.json()) as TokenResponse;
  if (!res.ok || !data.access_token) throw new Error(`Mercado Libre respondió ${res.status}: ${data.message ?? data.error ?? "sin detalle"}`);
  let nickname = "";
  try {
    const me = await fetch("https://api.mercadolibre.com/users/me", { headers: { Authorization: `Bearer ${data.access_token}` }, cache: "no-store" });
    if (me.ok) nickname = String(((await me.json()) as { nickname?: string }).nickname ?? "");
  } catch { /* el apodo es solo informativo */ }
  return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt: Date.now() + (data.expires_in - 300) * 1000, userId: data.user_id, nickname };
}

export async function exchangeCode(code: string) {
  const auth = await tokenRequest({ grant_type: "authorization_code", code, redirect_uri: mlRedirectUri() });
  await saveMlAuth(auth);
  return auth;
}

// Devuelve un token vigente: el guardado, o uno renovado si ya venció. null si la tienda no está conectada.
export async function getMlAccessToken(): Promise<string | null> {
  if (process.env.ML_ACCESS_TOKEN) return process.env.ML_ACCESS_TOKEN;
  const auth = await getMlAuth();
  if (!auth) return null;
  if (Date.now() < auth.expiresAt) return auth.accessToken;
  if (!mlAppConfigured()) return null;
  const renewed = await tokenRequest({ grant_type: "refresh_token", refresh_token: auth.refreshToken });
  await saveMlAuth({ ...renewed, nickname: renewed.nickname || auth.nickname });
  return renewed.accessToken;
}
