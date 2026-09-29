// Distintivo de Mercado Libre dibujado en SVG (óvalo amarillo con el apretón de manos y el nombre).
export function MLLogo({ className = "h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 150 44" className={className} role="img" aria-label="Mercado Libre">
      <rect width="150" height="44" rx="22" fill="#ffe600" />
      <ellipse cx="24" cy="22" rx="16" ry="12.5" fill="none" stroke="#2d3277" strokeWidth="2" />
      <path
        d="M11 20c3-4 6-5 9-4l4 3M37 20c-3-4-6-5-9-4l-4 3M14 22c2 2 4 3 6 3l4-2 4 2c2 0 4-1 6-3M20 25l-2 2M26 25l2 2"
        fill="none"
        stroke="#2d3277"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x="46" y="19" fontFamily="Arial, Helvetica, sans-serif" fontSize="13" fontWeight="700" fill="#2d3277">mercado</text>
      <text x="46" y="34" fontFamily="Arial, Helvetica, sans-serif" fontSize="13" fontWeight="700" fill="#2d3277">libre</text>
    </svg>
  );
}
