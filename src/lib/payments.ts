import "server-only";

// Capa de pagos intercambiable. Para cambiar de procesador se agrega un
// proveedor nuevo que implemente PaymentProvider y se elige con PAYMENT_PROVIDER.

export type CheckoutRequest = {
  orderId: string;
  amount: number; // CLP
  description: string;
  items: { name: string; qty: number; unitPrice: number }[];
  customer: { name: string; email: string; rut: string };
};

export type CheckoutResult = { redirectUrl: string };

interface PaymentProvider {
  createPayment(req: CheckoutRequest): Promise<CheckoutResult>;
}

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

// Proveedor de pruebas: no cobra nada, redirige directo a la página de éxito.
const mockProvider: PaymentProvider = {
  async createPayment(req) {
    return { redirectUrl: `/checkout/exito?orden=${req.orderId}&modo=prueba` };
  },
};

// Mercado Pago (Checkout Pro): el cliente paga con tarjetas, débito o dinero en cuenta
// y vuelve a la tienda. El pago se confirma por webhook (src/app/api/webhooks/mercadopago).
// Credenciales en https://www.mercadopago.cl/developers/panel/app
const mercadoPagoProvider: PaymentProvider = {
  async createPayment(req) {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) throw new Error("Falta MP_ACCESS_TOKEN");
    const [first, ...rest] = req.customer.name.split(" ");
    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        external_reference: req.orderId,
        items: req.items.map((i, n) => ({
          id: `${req.orderId}-${n + 1}`,
          title: i.name.slice(0, 250),
          quantity: i.qty,
          unit_price: i.unitPrice,
          currency_id: "CLP",
        })),
        payer: {
          name: first,
          surname: rest.join(" ") || undefined,
          email: req.customer.email,
          identification: { type: "RUT", number: req.customer.rut.replace(/[.\s]/g, "") },
        },
        back_urls: {
          success: `${siteUrl()}/checkout/exito?orden=${req.orderId}`,
          pending: `${siteUrl()}/checkout/exito?orden=${req.orderId}`,
          failure: `${siteUrl()}/carrito?pago=fallido`,
        },
        auto_return: "approved",
        notification_url: `${siteUrl()}/api/webhooks/mercadopago`,
        statement_descriptor: "CEPPICAR",
      }),
    });
    if (!res.ok) throw new Error(`Mercado Pago respondió ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { init_point: string; sandbox_init_point?: string };
    const sandbox = process.env.MP_SANDBOX === "true" && data.sandbox_init_point;
    return { redirectUrl: sandbox || data.init_point };
  },
};

// dLocal Go: el cliente paga en CLP con medios chilenos y el comercio recibe la liquidación en USD.
// Verificar campos contra la documentación vigente: https://docs.dlocalgo.com
const dlocalGoProvider: PaymentProvider = {
  async createPayment(req) {
    const apiKey = process.env.DLOCALGO_API_KEY;
    const secretKey = process.env.DLOCALGO_SECRET_KEY;
    if (!apiKey || !secretKey) throw new Error("Faltan DLOCALGO_API_KEY / DLOCALGO_SECRET_KEY");

    const base =
      process.env.DLOCALGO_SANDBOX === "false" ? "https://api.dlocalgo.com" : "https://api-sbx.dlocalgo.com";

    const res = await fetch(`${base}/v1/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}:${secretKey}` },
      body: JSON.stringify({
        amount: req.amount,
        currency: "CLP",
        country: "CL",
        order_id: req.orderId,
        description: req.description,
        success_url: `${siteUrl()}/checkout/exito?orden=${req.orderId}`,
        back_url: `${siteUrl()}/carrito`,
        notification_url: `${siteUrl()}/api/webhooks/dlocalgo`,
      }),
    });
    if (!res.ok) throw new Error(`dLocal Go respondió ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { redirect_url: string };
    return { redirectUrl: data.redirect_url };
  },
};

const providers: Record<string, PaymentProvider> = {
  mock: mockProvider,
  mercadopago: mercadoPagoProvider,
  dlocalgo: dlocalGoProvider,
};

export function getPaymentProvider(): PaymentProvider {
  const name = process.env.PAYMENT_PROVIDER ?? "mock";
  const provider = providers[name];
  if (!provider) throw new Error(`Proveedor de pago desconocido: ${name}`);
  return provider;
}
