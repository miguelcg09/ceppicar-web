import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Paquetes nativos/WASM que deben cargarse en Node, no empaquetarse.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
};

export default nextConfig;
