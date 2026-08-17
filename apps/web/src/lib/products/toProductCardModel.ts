import type { CategoriaApi, ProductCardModel, ProductoApi } from '@/lib/types/products-page';

export interface ToProductCardModelContext {
  readonly categories: readonly CategoriaApi[];
}

/**
 * Maps a `ProductoApi` to the `ProductCardModel` consumed by the presentational
 * card components.
 *
 * The category name is resolved server-side (build time) from the cached
 * categories list — no client lookup, no runtime fetch. When the category is
 * not found (e.g. the protected `sin-categoria`), `categoriaNombre` is `''` and
 * the card omits the chip. When `galeria` is empty, `imageUrl` is `''` and the
 * card renders a placeholder.
 *
 * Pure and deterministic.
 */
export function toProductCardModel(
  product: ProductoApi,
  context: ToProductCardModelContext,
): ProductCardModel {
  const galeriaItem = product.galeria[0];
  const imageUrl = galeriaItem?.url ?? '';
  const imageAlt = galeriaItem?.alt ?? product.titulo;
  const category = context.categories.find((c) => c.id === product.categoriaId);
  const categoriaNombre = category ? category.nombre : '';
  const slug = product.slug;

  return {
    slug,
    titulo: product.titulo,
    categoriaId: product.categoriaId,
    subcategoriaId: product.subcategoriaId,
    categoriaNombre,
    descripcionBreve: product.descripcionBreve,
    imageUrl,
    imageAlt,
    cotizarHref: `/cotizacion?producto=${encodeURIComponent(slug)}`,
    detalleHref: `/productos/${slug}`,
  };
}
