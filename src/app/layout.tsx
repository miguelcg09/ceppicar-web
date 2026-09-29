import type { Metadata } from "next";
import { Roboto, Roboto_Condensed } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { getProducts } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";

const sans = Roboto({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500", "700"] });
const display = Roboto_Condensed({ subsets: ["latin"], variable: "--font-display", weight: ["700"] });

// El catálogo y los ajustes viven en la base de datos, así que todo se renderiza por petición.
export const dynamic = "force-dynamic";

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0f2a4d" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1d22" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { default: `${s.name} · Repuestos automotrices`, template: `%s · ${s.name}` },
    description: s.tagline,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [catalog, settings] = await Promise.all([getProducts(), getSettings()]);
  return (
    <html lang="es-CL" className={`${sans.variable} ${display.variable}`}>
      <body className="font-sans antialiased">
        <StoreProvider catalog={catalog} settings={settings}>
          <Header />
          <main>{children}</main>
          <Footer settings={settings} />
          <CartDrawer />
        </StoreProvider>
      </body>
    </html>
  );
}
