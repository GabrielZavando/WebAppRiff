import type { ViewMode } from '@/lib/types/products-page';

export interface ProductsPageHrefParams {
  readonly q?: string;
  readonly categoriaId?: string;
  readonly subcategoriaIds?: readonly string[];
  readonly view?: ViewMode;
  readonly page?: number;
}

/**
 * Builds a canonical `/productos` URL from the given filter state.
 *
 * Rules:
 * - Empty `q` is omitted; other empty values are omitted too.
 * - `subcategoriaIds` are appended as repeated `subcategoriaId` params (HTML
 *   form semantics) so multi-select survives a navigation.
 * - The default `view` (`grid`) and default `page` (`1`) are omitted so the
 *   URL stays clean; only meaningful deviations are encoded.
 * - `q` is URL-encoded via `encodeURIComponent`.
 *
 * Pure helper (no IO): testable without mounting any component.
 */
export function buildProductsPageHref(params: ProductsPageHrefParams): string {
  const q = (params.q ?? '').trim();
  const categoriaId = params.categoriaId ?? '';
  const subcategoriaIds = params.subcategoriaIds ?? [];
  const view = params.view ?? 'grid';
  const page = params.page ?? 1;

  const search = new URLSearchParams();
  if (q !== '') search.set('q', q);
  if (categoriaId !== '') search.set('categoriaId', categoriaId);
  for (const id of subcategoriaIds) {
    if (id !== '') search.append('subcategoriaId', id);
  }
  if (view !== 'grid') search.set('view', view);
  if (page !== 1) search.set('page', String(page));

  const queryString = search.toString();
  return queryString === '' ? '/productos' : `/productos?${queryString}`;
}
