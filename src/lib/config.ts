// Valores por defecto de la tienda. Los reales se editan en /admin/ajustes y se guardan en la base de datos.
export type Settings = {
  name: string;
  tagline: string;
  email: string;
  whatsapp: string;
  address: string; // dirección de retiro
  mlUrl: string; // tienda oficial "Repuestos Ceppicar" en Mercado Libre
  lowStock: number; // desde cuántas unidades (o menos) se avisa "stock bajo" en el panel
  shippingCost: number; // CLP
  freeShippingFrom: number; // CLP
  warranty: string; // texto de garantía (fichas, checkout, correos y pie de página)
  terminos: string; // texto plano; las líneas en blanco separan párrafos, "## " inicia un título
};

export const defaultSettings: Settings = {
  name: "CEPPICAR",
  tagline: "Repuestos automotrices en La Cisterna, con despacho a todo Chile",
  email: "contacto@ceppicar.cl",
  whatsapp: "+56 9 0000 0000",
  address: "La Cisterna, Santiago (retiro con previa coordinación)",
  mlUrl: "https://www.mercadolibre.cl/pagina/repuestosceppicar",
  lowStock: 2,
  shippingCost: 5990,
  freeShippingFrom: 40000,
  warranty:
    "Todos nuestros repuestos son nuevos y tienen garantía legal de 3 meses desde la compra. Cubre fallas de fabricación y compatibilidad; el producto y su empaque deben estar en óptimas condiciones para el cambio.",
  terminos: `## 1. Productos
Vendemos repuestos automotrices nuevos, alternativos y originales, según se indica en cada ficha. Las imágenes corresponden al producto ofrecido.

## 2. Compatibilidad
La marca, el modelo y los años indicados en cada ficha son referenciales. Antes de comprar, confirma la compatibilidad enviándonos el VIN (17 dígitos, en el padrón de tu vehículo) o consultando por WhatsApp.

## 3. Precios y pagos
Los precios están expresados en pesos chilenos (CLP) e incluyen IVA. Los pagos se procesan mediante una pasarela de pago externa; la tienda no almacena datos de tarjetas. Emitimos boleta; si necesitas factura, indícalo al finalizar la compra.

## 4. Despacho y retiro
Realizamos envíos a todo Chile con empresas de transporte; los plazos son referenciales. También puedes retirar en nuestra tienda de La Cisterna coordinando previamente.

## 5. Garantía, cambios y devoluciones
Todos los productos tienen garantía legal de tres meses desde la fecha de compra por fallas de fabricación o de compatibilidad, conforme a la Ley 19.496. El producto y su empaque deben estar en óptimas condiciones para el cambio. No se aceptan devoluciones de productos instalados o dañados por mala instalación.`,
};
