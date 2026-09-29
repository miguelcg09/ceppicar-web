import Link from "next/link";
import { stockSummary } from "@/lib/catalog";
import { countNeedingPhoto } from "@/lib/ml-fotos";
import { getMlAuth, mlAppConfigured, mlRedirectUri } from "@/lib/ml-auth";
import { getSettings } from "@/lib/settings";
import { fetchMlPhotosAction, importMlAction } from "../actions";

export const dynamic = "force-dynamic";
// Traer fotos consulta Mercado Libre para 20 productos por vez; damos tiempo de sobra.
export const maxDuration = 60;

type Params = { resultado?: string; error?: string; fotos?: string; alcance?: string; conectado?: string };
type Resultado = { filas: number; publicaciones: number; actualizados: number; creados: number; omitidos: number; pausados: number; reactivados: number; nuevos: { slug: string; name: string }[] };
type Fotos = { intentados: number; encontradas: number; fallidos: string[] };

const parse = <T,>(s?: string): T | null => { try { return s ? (JSON.parse(s) as T) : null; } catch { return null; } };

export default async function MercadoLibre({ searchParams }: { searchParams: Promise<Params> }) {
  const { resultado, error, fotos, alcance = "visibles", conectado } = await searchParams;
  const settings = await getSettings();
  const [stock, fotosVisibles, fotosTodos, auth] = await Promise.all([stockSummary(settings.lowStock), countNeedingPhoto(true), countNeedingPhoto(false), getMlAuth()]);
  const appOk = mlAppConfigured();
  const res = parse<Resultado>(resultado);
  const fot = parse<Fotos>(fotos);
  const hasToken = Boolean(process.env.ML_ACCESS_TOKEN) || Boolean(auth);

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl font-bold">Mercado Libre</h1>
      <p className="mt-1 text-sm text-muted">
        Tu tienda oficial: <a href={settings.mlUrl} target="_blank" rel="noopener" className="font-semibold text-accent hover:underline">{settings.mlUrl.replace(/^https?:\/\/(www\.)?/, "")} ↗</a>
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="card p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted">Activas en ML</p><p className="mt-1 font-display text-3xl font-bold">{stock.activosMl}</p><p className="text-xs text-muted">publicaciones activas según la última importación</p></div>
        <div className="card p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted">Visibles en la web</p><p className="mt-1 font-display text-3xl font-bold">{stock.visibles}</p><p className="text-xs text-muted">{stock.ocultos} ocultas (pausadas)</p></div>
        <div className="card p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted">Visibles sin foto</p><p className="mt-1 font-display text-3xl font-bold">{fotosVisibles.sinFoto}</p><p className="text-xs text-muted">{fotosTodos.sinFoto} contando las ocultas</p></div>
      </div>

      {error && <p className="mt-6 rounded-lg bg-red-500/10 p-3 text-sm text-red-700">{error}</p>}
      {conectado && <p className="mt-6 rounded-lg bg-ok/10 p-3 text-sm text-ok">Tienda conectada: {conectado}.</p>}

      {/* Conexión con la cuenta de Mercado Libre */}
      <section className="card mt-8 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Conexión con tu cuenta</h2>
            <p className="mt-1 text-sm text-muted">
              {auth
                ? `Conectada como ${auth.nickname || auth.userId}. Con esto las fotos se traen por la API oficial y queda lista la base para sincronizar stock.`
                : appOk
                  ? "La aplicación está configurada. Autoriza el acceso con tu cuenta vendedora para usar la API oficial."
                  : "Sin conectar. Opcional: se usa para traer fotos con seguridad y, más adelante, sincronizar stock y ventas."}
            </p>
          </div>
          {auth ? (
            <form method="post" action="/admin/mercadolibre/desconectar"><button className="btn-ghost text-sm">Desconectar</button></form>
          ) : appOk ? (
            <a href="/admin/mercadolibre/conectar" className="btn-ml">Conectar con Mercado Libre</a>
          ) : null}
        </div>
        {!auth && !appOk && (
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-semibold text-accent">Cómo conectarla (una sola vez)</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
              <li>Entra a <a href="https://developers.mercadolibre.cl/devcenter" target="_blank" rel="noopener" className="underline">developers.mercadolibre.cl › Mis aplicaciones</a> con tu cuenta vendedora y crea una aplicación.</li>
              <li>En “URI de redirect” pega exactamente: <code className="rounded bg-surface-2 px-1">{mlRedirectUri()}</code>. En permisos marca lectura de ítems y usuarios (read).</li>
              <li>Copia el <strong>App ID</strong> y la <strong>Secret Key</strong> y guárdalos en Vercel como <code className="rounded bg-surface-2 px-1">ML_CLIENT_ID</code> y <code className="rounded bg-surface-2 px-1">ML_CLIENT_SECRET</code> (Production). Vuelve a desplegar.</li>
              <li>Vuelve a esta página y pulsa “Conectar con Mercado Libre”.</li>
            </ol>
          </details>
        )}
      </section>

      {/* Importar Excel */}
      <section className="card mt-8 p-5">
        <h2 className="font-semibold">Actualizar precios, stock y estado desde el Excel de publicaciones</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>En Mercado Libre entra a <strong>Ventas › Publicaciones</strong> y usa <strong>Descargar publicaciones</strong> (Excel).</li>
          <li>Sube aquí ese archivo .xlsx tal cual. Se actualizan las publicaciones que ya existen en la web por su número MLC.</li>
          <li>Las publicaciones nuevas con stock se crean con la categoría y el vehículo deducidos del título; revísalas después en Productos.</li>
        </ol>
        <form action={importMlAction} className="mt-4 flex flex-wrap items-end gap-3 text-sm">
          <label className="grow">Archivo de publicaciones (.xlsx)<input name="archivo" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required className="field" /></label>
          <label className="flex items-center gap-2"><input type="checkbox" name="visibilidad" defaultChecked /> Ocultar pausadas y mostrar activas</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="crear" defaultChecked /> Crear publicaciones nuevas</label>
          <button className="btn-primary">Importar</button>
        </form>
        {res && (
          <div className="mt-4 rounded-lg bg-accent/10 p-4 text-sm">
            <p className="font-semibold text-accent">Importación lista</p>
            <ul className="mt-1 grid gap-1 sm:grid-cols-2">
              <li>{res.publicaciones} publicaciones leídas ({res.filas} filas)</li>
              <li>{res.actualizados} actualizadas (precio, stock, estado)</li>
              <li>{res.creados} creadas nuevas</li>
              <li>{res.omitidos} omitidas (sin stock, sin precio o desactivada la creación)</li>
              <li>{res.pausados} ocultadas por estar pausadas</li>
              <li>{res.reactivados} mostradas por volver a estar activas</li>
            </ul>
            {res.nuevos.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-accent">Ver las nuevas ({res.creados})</summary>
                <ul className="mt-1 space-y-1">
                  {res.nuevos.map((n) => <li key={n.slug}><Link href={`/admin/productos/${n.slug}`} className="hover:underline">{n.name}</Link></li>)}
                  {res.creados > res.nuevos.length && <li className="text-muted">… y {res.creados - res.nuevos.length} más en Productos.</li>}
                </ul>
              </details>
            )}
          </div>
        )}
      </section>

      {/* Fotos */}
      <section className="card mt-6 p-5">
        <h2 className="font-semibold">Traer las fotos de las publicaciones</h2>
        <p className="mt-2 text-sm text-muted">
          Busca la foto principal de cada publicación en Mercado Libre y la usa en la web en lugar de la ilustración. Va de 20 en 20; repite hasta que no queden pendientes.
          {hasToken ? " La tienda está conectada, así que se consulta la API oficial." : " Sin conexión se intenta la API pública y, si no responde, la página de cada publicación."}
        </p>
        <form action={fetchMlPhotosAction} className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2"><input type="radio" name="alcance" value="visibles" defaultChecked={alcance !== "todos"} /> Solo visibles ({fotosVisibles.pendientes} pendientes)</label>
          <label className="flex items-center gap-2"><input type="radio" name="alcance" value="todos" defaultChecked={alcance === "todos"} /> Todas ({fotosTodos.pendientes} pendientes)</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="reintentar" /> Reintentar las que fallaron</label>
          <button className="btn-primary" disabled={fotosTodos.sinFoto === 0}>Traer 20 fotos</button>
        </form>
        {fot && (
          <div className={`mt-4 rounded-lg p-4 text-sm ${fot.encontradas ? "bg-accent/10" : "bg-amber-400/10"}`}>
            <p className="font-semibold">{fot.encontradas} fotos encontradas de {fot.intentados} intentadas.</p>
            {fot.fallidos.length > 0 && (
              <>
                <p className="mt-1 text-muted">No se pudo obtener la foto de estas publicaciones (se reintentarán en 7 días):</p>
                <ul className="mt-1 font-mono text-xs text-muted">{fot.fallidos.map((f) => <li key={f}>{f}</li>)}</ul>
                {fot.encontradas === 0 && (
                  <p className="mt-2 text-muted">
                    Si todas fallan con “API 403” o “página 403”, Mercado Libre está bloqueando las consultas anónimas: conecta tu cuenta (sección de arriba) y vuelve a intentarlo
                    marcando “Reintentar las que fallaron”. También puedes pegar el enlace de la foto en cada producto.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </section>

      <section className="card mt-6 p-5 text-sm">
        <h2 className="font-semibold">Cómo se relacionan la web y Mercado Libre</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
          <li>Cada producto guarda su número de publicación (MLC…). Con él se arma el botón “Comprar en Mercado Libre” y se cruzan las importaciones.</li>
          <li>Las ventas de la web descuentan stock aquí, no en Mercado Libre. Mientras no haya sincronización automática, ajusta el stock en ML cuando vendas por la web y vuelve a importar el Excel cuando vendas por ML.</li>
          <li>Los productos <Link href="/admin/productos?stock=sinml" className="text-accent hover:underline">sin publicación</Link> se venden solo en la web.</li>
        </ul>
      </section>
    </div>
  );
}
