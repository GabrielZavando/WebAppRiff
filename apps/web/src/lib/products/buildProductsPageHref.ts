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
  const filters: ProductsPageHrefFilters = {
    q: (params.q ?? '').trim(),
    categoriaId: params.categoriaId ?? '',
    subcategoriaIds: params.subcategoriaIds ?? [],
    view: params.view ?? 'grid',
    page: params.page ?? 1,
  };

  const queryString = buildProductsPageQuery(filters);
  return queryString === '' ? '/productos' : `/productos?${queryString}`;
}

interface ProductsPageHrefFilters {
  readonly q: string;
  readonly categoriaId: string;
  readonly subcategoriaIds: readonly string[];
  readonly view: ViewMode;
  readonly page: number;
}

function buildProductsPageQuery(filters: ProductsPageHrefFilters): string {
  const search = new URLSearchParams();
  if (filters.q !== '') search.set('q', filters.q);
  if (filters.categoriaId !== '') {
    search.set('categoriaId', filters.categoriaId);
  }
  for (const id of filters.subcategoriaIds) {
    if (id !== '') search.append('subcategoriaId', id);
  }
  if (filters.view !== 'grid') search.set('view', filters.view);
  if (filters.page !== 1) search.set('page', String(filters.page));

  return search.toString();
}
