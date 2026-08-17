import type {
  ProductsPageFilters,
  ViewMode,
  SortBy,
  SortDir,
} from '@/lib/types/products-page';

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
  const q = (params.get('q') ?? '').trim();
  const categoriaId = (params.get('categoriaId') ?? '').trim();
  const subcategoriaIds = params
    .getAll('subcategoriaId')
    .map((value) => value.trim())
    .filter((value) => value !== '');

  const viewRaw = params.get('view');
  const view: ViewMode = viewRaw === 'list' ? 'list' : 'grid';

  const sortByRaw = params.get('sortBy');
  const sortBy: SortBy =
    sortByRaw === 'titulo' || sortByRaw === 'precio.valor' ? sortByRaw : 'creadoEn';

  const sortDirRaw = params.get('sortDir');
  const sortDir: SortDir = sortDirRaw === 'asc' ? 'asc' : 'desc';

  const pageRaw = Number(params.get('page'));
  const page =
    Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const pageSizeRaw = Number(params.get('pageSize'));
  const pageSize =
    Number.isFinite(pageSizeRaw) && pageSizeRaw > 0 ? Math.floor(pageSizeRaw) : defaultPageSize;

  return { q, categoriaId, subcategoriaIds, sortBy, sortDir, view, page, pageSize };
}
