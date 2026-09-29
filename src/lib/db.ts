import "server-only";

// Acceso a la base de datos con una sola función `query`.
// - Producción: Postgres (Neon, Supabase, Vercel Postgres…) vía DATABASE_URL.
// - Desarrollo: PGlite, un Postgres embebido que guarda los datos en .data/pglite.
// El SQL es el mismo en ambos casos.

type Row = Record<string, unknown>;
type Runner = (text: string, params: unknown[]) => Promise<Row[]>;

const globalForDb = globalThis as unknown as { __runner?: Promise<Runner> };

// Nombres que usan las integraciones de Vercel (Neon, Supabase, Vercel Postgres).
const URL_VARS = ["DATABASE_URL", "POSTGRES_URL", "DATABASE_URL_UNPOOLED", "POSTGRES_PRISMA_URL"] as const;

export function databaseUrlVar() {
  return URL_VARS.find((k) => process.env[k]);
}

async function createRunner(): Promise<Runner> {
  const urlVar = databaseUrlVar();
  const url = urlVar && process.env[urlVar];
  if (url) {
    const { default: postgres } = await import("postgres");
    const sql = postgres(url, { max: 5, prepare: false });
    return async (text, params) => (await sql.unsafe(text, params as never[])) as unknown as Row[];
  }
  if (process.env.VERCEL) {
    throw new Error("Falta DATABASE_URL: conecta una base Postgres (Storage > Neon) y vuelve a desplegar.");
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdirSync } = await import("node:fs");
  const dir = process.env.PGLITE_DIR ?? ".data/pglite";
  mkdirSync(dir, { recursive: true });
  const db = new PGlite(dir);
  return async (text, params) => (await db.query<Row>(text, params)).rows;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS orders (
  id            TEXT PRIMARY KEY,
  status        TEXT NOT NULL DEFAULT 'pendiente',
  customer      JSONB NOT NULL,
  items         JSONB NOT NULL,
  subtotal      INTEGER NOT NULL,
  shipping      INTEGER NOT NULL,
  total         INTEGER NOT NULL,
  payment_ref   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at       TIMESTAMPTZ,
  tracking      TEXT,
  shipped_at    TIMESTAMPTZ,
  note          TEXT
);
CREATE INDEX IF NOT EXISTS orders_created_at ON orders (created_at DESC);
CREATE TABLE IF NOT EXISTS products (
  slug          TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,
  ml_category   TEXT NOT NULL DEFAULT '',
  short         TEXT NOT NULL DEFAULT '',
  description   TEXT NOT NULL DEFAULT '',
  brand         TEXT NOT NULL DEFAULT '',
  origin        TEXT NOT NULL DEFAULT '',
  warranty      TEXT NOT NULL DEFAULT '',
  make          TEXT NOT NULL DEFAULT '',
  model         TEXT NOT NULL DEFAULT '',
  year_from     INTEGER,
  year_to       INTEGER,
  sku           TEXT NOT NULL DEFAULT '',
  ml_id         TEXT NOT NULL DEFAULT '',
  color         TEXT NOT NULL DEFAULT '#0b3d91',
  image_url     TEXT,
  featured      BOOLEAN NOT NULL DEFAULT false,
  visible       BOOLEAN NOT NULL DEFAULT true,
  active        BOOLEAN NOT NULL DEFAULT true,
  free_shipping BOOLEAN NOT NULL DEFAULT false,
  sort          INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_make_model ON products (make, model);
CREATE TABLE IF NOT EXISTS variants (
  id           TEXT PRIMARY KEY,
  product_slug TEXT NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  label        TEXT NOT NULL,
  price        INTEGER NOT NULL,
  stock        INTEGER,
  sort         INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS variants_product ON variants (product_slug);
ALTER TABLE products ADD COLUMN IF NOT EXISTS photo_checked_at TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS kv (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL
);
`;

async function getRunner() {
  if (!globalForDb.__runner) {
    globalForDb.__runner = createRunner()
      .then(async (run) => {
        for (const stmt of SCHEMA.split(";").map((s) => s.trim()).filter(Boolean)) await run(stmt, []);
        return run;
      })
      .catch((err) => {
        globalForDb.__runner = undefined;
        throw err;
      });
  }
  return globalForDb.__runner;
}

export async function query<T extends Row = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  const run = await getRunner();
  return (await run(text, params)) as T[];
}
