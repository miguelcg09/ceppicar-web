import "server-only";
import { query } from "./db";
import { defaultSettings, type Settings } from "./config";

export async function getSettings(): Promise<Settings> {
  const rows = await query<{ key: string; value: unknown }>("SELECT key, value FROM settings");
  const saved: Partial<Settings> = {};
  for (const r of rows) {
    // Cada valor se guarda envuelto en { v } para que texto y números vuelvan sin ambigüedad.
    const wrapped = (typeof r.value === "string" ? JSON.parse(r.value) : r.value) as { v: unknown };
    (saved as Record<string, unknown>)[r.key] = wrapped.v;
  }
  const settings = { ...defaultSettings, ...saved };
  // Si en el panel quedó guardado el antiguo enlace al perfil, usamos la tienda oficial.
  if (settings.mlUrl === "https://www.mercadolibre.cl/perfil/CEPPICAR") settings.mlUrl = defaultSettings.mlUrl;
  return settings;
}

export async function saveSettings(patch: Partial<Settings>) {
  for (const [key, value] of Object.entries(patch)) {
    await query(
      "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [key, JSON.stringify({ v: value })],
    );
  }
}
