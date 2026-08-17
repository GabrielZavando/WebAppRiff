import type { CategoryOption } from '@/lib/types/search-form';

/**
 * Build-time data source for the SearchForm category `<select>`.
 *
 * The public site is statically generated (SSG): this module is imported from
 * `Layout.astro` frontmatter during `astro build`, fetches the active
 * categories once, and bakes the options into the static HTML. There is NO
 * per-page-load API call at runtime. The backend notifies a deploy webhook on
 * category changes so the site rebuilds and re-runs this fetch.
 */

const DEFAULT_CATEGORY_OPTION: CategoryOption = {
  id: '',
  label: 'Todas las categorías',
};

/** Fallback used when the API is unreachable at build time. */
export const FALLBACK_CATEGORY_OPTIONS: readonly CategoryOption[] = [
  DEFAULT_CATEGORY_OPTION,
];

/** Shape of a category as returned by `GET /api/v1/categories`. */
interface CategoriaApi {
  readonly id: string;
  readonly nombre: string;
  readonly slug: string;
  readonly orden: number;
  readonly activa: boolean;
}

/**
 * Reads the backend base URL. Resolved lazily (not at module load) so tests and
 * builds can inject `NESTJS_API_URL` without re-importing the module.
 */
function getApiBaseUrl(): string {
  return process.env.NESTJS_API_URL ?? 'http://localhost:3000/api/v1';
}

/**
 * Maps active categories to `<select>` options: the default "Todas las
 * categorías" first, then the rest ordered by `orden` and then `nombre`.
 */
export function toCategoryOptions(categorias: readonly CategoriaApi[]): CategoryOption[] {
  const options = [...categorias]
    .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es'))
    .map((categoria) => ({ id: categoria.id, label: categoria.nombre }));
  return [DEFAULT_CATEGORY_OPTION, ...options];
}

async function fetchActiveCategories(): Promise<CategoriaApi[]> {
  const response = await fetch(`${getApiBaseUrl()}/categories?activa=true`, {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Categories API responded with ${response.status}`);
  }
  const body = (await response.json()) as { data: CategoriaApi[] };
  return body.data;
}

// Module-level cache: Layout.astro is used by every page, but the build runs in
// a single Node process, so caching here means exactly one fetch per build.
let cached: readonly CategoryOption[] | null = null;

// Separate cache for the full category list consumed by the catalog sidebar
// (ProductsFiltersSidebar expects the raw CategoriaApi shape, not options).
let cachedCategorias: CategoriaApi[] | null = null;

/**
 * Returns the full active category list for the catalog sidebar. Fetches from
 * the backend at build time, caches the result, and falls back to an empty list
 * (the sidebar then shows only "Todas las categorías") if the API is
 * unreachable so the static build never fails.
 */
export async function getCategorias(): Promise<CategoriaApi[]> {
  if (cachedCategorias) {
    return cachedCategorias;
  }
  try {
    cachedCategorias = await fetchActiveCategories();
  } catch (error) {
    console.warn('Failed to load categories from API; falling back to empty list.', error);
    cachedCategorias = [];
  }
  return cachedCategorias;
}

/**
 * Returns the category options for the SearchForm. Fetches from the backend at
 * build time, caches the result, and falls back to only the default option if
 * the API is unreachable so the static build never fails.
 */
export async function getSearchFormCategories(): Promise<readonly CategoryOption[]> {
  if (cached) {
    return cached;
  }
  try {
    const categorias = await fetchActiveCategories();
    cached = toCategoryOptions(categorias);
  } catch (error) {
    console.warn(
      'Failed to load categories from API; falling back to default option only.',
      error,
    );
    cached = FALLBACK_CATEGORY_OPTIONS;
  }
  return cached;
}
