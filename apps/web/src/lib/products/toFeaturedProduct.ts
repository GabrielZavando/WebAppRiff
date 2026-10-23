import type { FeaturedProduct } from '@/lib/types/destacados-section';
import type { ProductoCardApi } from '@/lib/types/products-page';

/**
 * Maps a backend featured card (`ProductoCardApi`) to the card model
 * consumed by `DestacadosSection.astro`.
 *
 * The image URL and alt text come from the first gallery entry of the
 * product (`galeria[0].url` / `galeria[0].alt`, public Firebase Storage
 * URLs managed by the panel). When the gallery is empty `imageUrl` is `''`
 * and `imagenAlt` falls back to the product title, so the alt is never
 * empty (accessibility) while the card renders an image-less mat.
 *
 * Pure and deterministic — mirrors `toProductCardModel.ts`.
 */
export function toFeaturedProduct(
  product: ProductoCardApi,
): FeaturedProduct {
  const galeriaItem = product.galeria[0];
  const imageUrl = galeriaItem?.url ?? '';
  const imagenAlt = galeriaItem?.alt || product.titulo;
  return {
    id: product.id,
    titulo: product.titulo,
    slug: product.slug,
    imageUrl,
    imagenAlt,
  };
}
