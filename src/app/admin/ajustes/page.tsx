import { getSettings } from "@/lib/settings";
import { saveSettingsAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function Ajustes({ searchParams }: { searchParams: Promise<{ guardado?: string }> }) {
  const { guardado } = await searchParams;
  const s = await getSettings();

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-bold">Ajustes</h1>
      {guardado && <p className="mt-4 rounded-lg bg-accent/10 p-3 text-sm text-accent">Cambios guardados.</p>}

      <form action={saveSettingsAction} className="mt-8 space-y-8">
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 font-semibold">Tienda</legend>
          <label className="text-sm">Nombre<input name="name" required defaultValue={s.name} className="field" /></label>
          <label className="text-sm">Lema (bajo el nombre)<input name="tagline" defaultValue={s.tagline} className="field" /></label>
          <label className="text-sm">Correo de contacto<input name="email" type="email" defaultValue={s.email} className="field" /></label>
          <label className="text-sm">WhatsApp<input name="whatsapp" defaultValue={s.whatsapp} className="field" /></label>
          <label className="text-sm sm:col-span-2">Dirección de retiro<input name="address" defaultValue={s.address} className="field" /></label>
          <label className="text-sm sm:col-span-2">Tienda en Mercado Libre<input name="mlUrl" defaultValue={s.mlUrl} className="field" /></label>
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 font-semibold">Envío</legend>
          <label className="text-sm">Costo de envío (CLP)<input name="shippingCost" type="number" min={0} defaultValue={s.shippingCost} className="field" /></label>
          <label className="text-sm">Envío gratis desde (CLP)<input name="freeShippingFrom" type="number" min={0} defaultValue={s.freeShippingFrom} className="field" /></label>
          <p className="text-xs text-muted sm:col-span-2">Los productos marcados con “Envío gratis” no cobran envío aunque el pedido no llegue al mínimo. El retiro en tienda siempre es gratis.</p>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-2 font-semibold">Textos legales</legend>
          <label className="block text-sm">Garantía (aparece en fichas, correos y pie de página)
            <textarea name="warranty" rows={3} defaultValue={s.warranty} className="field" />
          </label>
          <label className="block text-sm">Términos y condiciones. Una línea que empieza con "## " es un título; una línea en blanco separa párrafos.
            <textarea name="terminos" rows={18} defaultValue={s.terminos} className="field font-mono text-xs" />
          </label>
        </fieldset>

        <button className="btn-primary">Guardar ajustes</button>
      </form>
    </div>
  );
}
