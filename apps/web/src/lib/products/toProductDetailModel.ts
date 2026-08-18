import type {
  CategoriaApi,
  ProductDetailPage,
  ProductoApi,
} from '@/lib/types/products-page';
import { sanitizeRichHtml, stripHtmlToText } from '@riff/html-sanitize';

export interface ToProductDetailModelContext {
  readonly categories: readonly CategoriaApi[];
}

/**
 * Maps a `ProductoApi` to the `ProductDetailPage` view-model consumed by the
 * product detail page (`/productos/[slug].astro`).
 *
 * The category name is resolved server-side (build time) from the cached
 * categories list — no client lookup, no runtime fetch. When the category is
 * not found (e.g. the protected `sin-categoria`), `categoriaNombre` is `''`.
 * Gallery, attributes and technical document are passed through unchanged.
 *
 * Pure and deterministic.
 */
export function toProductDetailModel(
  product: ProductoApi,
  context: ToProductDetailModelContext,
): ProductDetailPage {
  const category = context.categories.find((c) => c.id === product.categoriaId);
  const categoriaNombre = category ? category.nombre : '';
  const slug = product.slug;

  return {
    id: product.id,
    sku: product.sku,
    slug,
    titulo: product.titulo,
    descripcionBreve: stripHtmlToText(product.descripcionBreve ?? ''),
    descripcionLarga: sanitizeRichHtml(product.descripcionLarga ?? ''),
    categoriaId: product.categoriaId,
    categoriaNombre,
    galeria: product.galeria,
    atributos: product.atributos,
    fichaTecnica: product.fichaTecnica,
    cotizarHref: `/cotizacion?producto=${encodeURIComponent(slug)}`,
  };
}
