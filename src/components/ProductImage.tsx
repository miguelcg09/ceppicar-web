import type { Product } from "@/lib/products";
import { PartIcon } from "./PartIcon";

// Foto del producto si existe; si no, la ilustración de su categoría.
export function ProductImage({ product, className = "" }: { product: Product; className?: string }) {
  if (product.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={product.imageUrl} alt={product.name} className={`object-contain ${className}`} loading="lazy" />;
  }
  return <PartIcon category={product.category} color={product.color} className={className} />;
}
