# CEPPICAR · tienda de repuestos automotrices

Tienda online en Next.js con catálogo por vehículo, carrito y checkout en CLP, pensada para el mercado chileno y conectada con la tienda de CEPPICAR en Mercado Libre.

## Desarrollo

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre http://localhost:3000. La primera vez se carga el catálogo de `src/lib/seed.json` en una base Postgres embebida (`.data/`).

## Qué incluye

- Inicio con buscador **Mi auto** (marca → modelo → año), categorías, destacados, cómo comprar, garantía y preguntas frecuentes.
- Catálogo con filtros por vehículo, categoría, búsqueda por texto y orden por precio. Cada ficha muestra compatibilidad, especificaciones, opciones (lado piloto/copiloto) y el enlace a la publicación en Mercado Libre.
- Carrito lateral y página de carrito (se guarda en el navegador). El vehículo elegido también se recuerda.
- Checkout con validación de RUT, envío a domicilio (región y comuna) o retiro en tienda, campo para vehículo o VIN, y opción de factura.
- Capa de pagos intercambiable (`src/lib/payments.ts`):
  - `mock`: modo de prueba, no cobra.
  - `mercadopago`: Checkout Pro de Mercado Pago (tarjetas, débito, dinero en cuenta). Webhook en `/api/webhooks/mercadopago`.
  - `dlocalgo`: dLocal Go, para liquidar en USD en el extranjero.
- Pedidos en Postgres (`src/lib/orders.ts`) y correos de confirmación y despacho vía Resend (`src/lib/email.ts`).
- Panel de administración en `/admin` (clave `ADMIN_PASSWORD`, sesión de 30 días):
  - **Productos**: buscar, crear, editar (vehículo compatible, precio, stock por opción, foto, MLC), destacar, ocultar o borrar.
  - **Pedidos**: ver detalle, marcar despachado o listo para retiro (avisa por correo), notas internas.
  - **Ajustes**: nombre, contacto, dirección de retiro, perfil de Mercado Libre, envío, garantía y términos.

## Catálogo desde Mercado Libre

El catálogo inicial (`src/lib/seed.json`) se genera desde el Excel que Mercado Libre exporta en **Ventas › Publicaciones › Descargar**:

```bash
pip install openpyxl
python3 scripts/importar_ml.py Publicaciones.xlsx
```

El script lee título, precio, stock, variantes, envío gratis y estado de cada publicación, y deduce marca, modelo y años desde el título. Las publicaciones activas quedan visibles; las pausadas con stock quedan ocultas y se pueden mostrar desde `/admin/productos`. Solo se carga en la base de datos la primera vez (cuando está vacía); después, el catálogo se edita desde el panel.

El Excel no trae fotos. Se pueden pegar los enlaces de las fotos de Mercado Libre en cada producto o subirlas desde el panel con Vercel Blob. Para sincronización automática con Mercado Libre haría falta una aplicación en `developers.mercadolibre.cl` autorizada por la cuenta del vendedor.

## Qué hacer antes de vender

- Desde `/admin/ajustes`: correo, WhatsApp, dirección de retiro, costo de envío y términos (revisar los términos con un abogado).
- Desde `/admin/productos`: revisar los productos activos, subir fotos y corregir marca, modelo y años donde el título no fue claro.
- Crear las credenciales de producción en Mercado Pago y configurar `PAYMENT_PROVIDER=mercadopago` y `MP_ACCESS_TOKEN`. En el panel de Mercado Pago, configurar el webhook apuntando a `https://tu-dominio/api/webhooks/mercadopago` (evento **Pagos**).

## Despliegue

Pensado para Vercel: importar el repositorio y configurar las variables de `.env.example`.
Servicios necesarios en producción: una base Postgres (por ejemplo Neon, gratis) para `DATABASE_URL`,
una cuenta en Resend con un dominio verificado para los correos, y las credenciales de Mercado Pago.
`/api/salud` muestra qué piezas están configuradas.
