import type { Category } from "@/lib/products";

// Ilustración por categoría, usada cuando el producto no tiene foto.
const paths: Record<Category, React.ReactNode> = {
  suspension: (
    <>
      <circle cx="24" cy="5" r="2.5" />
      <path d="M24 7.5V20" />
      <path d="M14 11h20M14 38h20" />
      <path d="M15 14.5c6 2 12 2 18 0M15 20c6 2 12 2 18 0M15 25.5c6 2 12 2 18 0M15 31c6 2 12 2 18 0" opacity=".6" />
      <rect x="19" y="20" width="10" height="20" rx="2" />
      <circle cx="24" cy="43" r="2.5" />
    </>
  ),
  frenos: (
    <>
      <circle cx="24" cy="24" r="19" />
      <circle cx="24" cy="24" r="7" />
      <circle cx="24" cy="12" r="1.6" fill="currentColor" />
      <circle cx="35" cy="27" r="1.6" fill="currentColor" />
      <circle cx="13" cy="27" r="1.6" fill="currentColor" />
      <path d="M7 16c4-8 12-11 19-11" strokeWidth="5" opacity=".55" />
    </>
  ),
  direccion: (
    <>
      <circle cx="24" cy="24" r="19" />
      <circle cx="24" cy="24" r="5" />
      <path d="M5.5 21h13.5M29 21h13.5M24 29v14" />
    </>
  ),
  refrigeracion: (
    <>
      <rect x="6" y="9" width="36" height="30" rx="2" />
      <path d="M12 9v30M18 9v30M24 9v30M30 9v30M36 9v30" opacity=".55" />
      <path d="M42 15h4M2 33h4" />
    </>
  ),
  motor: (
    <>
      <path d="M6 20h5v-5h9v-4h10v4h6l4 5h3v14h-3l-4 5H18l-4-5H6z" />
      <path d="M2 24v6M24 20v10" />
    </>
  ),
  embrague: (
    <>
      <circle cx="24" cy="24" r="19" />
      <circle cx="24" cy="24" r="12" opacity=".55" />
      <circle cx="24" cy="24" r="4" />
      <path d="M24 5v7M24 36v7M5 24h7M36 24h7" />
    </>
  ),
  encendido: (
    <>
      <path d="M21 3h6v7h-6zM17 10h14v6H17zM19 16h10v14H19zM20 30h8l-2 7h-4z" />
      <path d="M24 37v5M20 45l4-3 4 3" />
    </>
  ),
  carroceria: (
    <>
      <path d="M4 30l4-10 8-5h14l8 6 6 2v7z" />
      <circle cx="14" cy="32" r="5" />
      <circle cx="36" cy="32" r="5" />
      <path d="M17 16l-2 6h10v-6z" opacity=".6" />
    </>
  ),
  filtros: (
    <>
      <ellipse cx="24" cy="10" rx="13" ry="4.5" />
      <path d="M11 10v28c0 2.5 5.8 4.5 13 4.5s13-2 13-4.5V10" />
      <path d="M15 16v22M20 17v23M28 17v23M33 16v22" opacity=".55" />
    </>
  ),
  otros: (
    <>
      <rect x="6" y="6" width="15" height="15" rx="2" />
      <rect x="27" y="6" width="15" height="15" rx="2" />
      <rect x="6" y="27" width="15" height="15" rx="2" />
      <rect x="27" y="27" width="15" height="15" rx="2" />
    </>
  ),
};

export function PartIcon({ category, color, className = "" }: { category: Category; color?: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`part-icon ${className}`}
      style={color ? { color } : undefined}
      aria-hidden
    >
      {paths[category] ?? paths.otros}
    </svg>
  );
}
