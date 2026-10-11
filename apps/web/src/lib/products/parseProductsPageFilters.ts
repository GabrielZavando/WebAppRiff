import type { ProductsPageFilters } from '@/lib/types/products-page';

function parseTrimmedText(params: URLSearchParams, key: string): string {
  return (params.get(key) ?? '').trim();
}

function parsePositiveInt(raw: string | null, fallback: number): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

/**
 * Parses the catalog URL query params into a fully-typed `ProductsPageFilters`.
 *
 * Kept as a pure helper (no `URL`/Astro coupling beyond the `URLSearchParams`
 * input) so the page frontmatter stays declarative and this logic is unit
 * testable. Defaults mirror the build-time fallback when a param is missing or
 * malformed.
 */
export function parseProductsPageFilters(
  params: URLSearchParams,
  defaultPageSize = 9,
): ProductsPageFilters {
  const viewRaw = params.get('view');
  const sortByRaw = params.get('sortBy');
  const sortDirRaw = params.get('sortDir');

  return {
    q: parseTrimmedText(params, 'q'),
    categoriaId: parseTrimmedText(params, 'categoriaId'),
    subcategoriaIds: params
      .getAll('subcategoriaId')
      .map((value) => value.trim())
      .filter((value) => value !== ''),
    view: viewRaw === 'list' ? 'list' : 'grid',
    sortBy:
      sortByRaw === 'titulo' || sortByRaw === 'precio.valor'
        ? sortByRaw
        : 'creadoEn',
    sortDir: sortDirRaw === 'asc' ? 'asc' : 'desc',
    page: parsePositiveInt(params.get('page'), 1),
    pageSize: parsePositiveInt(params.get('pageSize'), defaultPageSize),
  };
}
