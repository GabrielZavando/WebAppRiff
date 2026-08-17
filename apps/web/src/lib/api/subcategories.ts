import type { SubcategoriaApi } from '@/lib/types/products-page';

/**
 * Build-time data source for active subcategories.
 *
 * The public site is statically generated (SSG): this module is imported from
 * `pages/productos/index.astro` frontmatter during `astro build`, fetches the
 * active subcategories once, and bakes them into the static HTML. There is NO
 * per-page-load API call at runtime. If the API is unreachable the page
 * degrades to an empty list so the build never fails.
 *
 * Mirrors `lib/api/categories.ts` / `lib/api/products.ts` (module-level cache +
 * safe fallback). The optional `categoriaId` argument filters the cached list
 * in memory — no extra HTTP call.
 */

let cached: readonly SubcategoriaApi[] | null = null;

function getApiBaseUrl(): string {
  return process.env.NESTJS_API_URL ?? 'http://localhost:3000/api/v1';
}

interface SubcategoriaListResponse {
  readonly data: SubcategoriaApi[];
}

async function fetchAll(): Promise<readonly SubcategoriaApi[]> {
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(`${getApiBaseUrl()}/subcategories?activa=true`, {
      headers: { accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Subcategories API responded with ${response.status}`);
    }
    const body = (await response.json()) as SubcategoriaListResponse;
    cached = body.data;
  } catch (error) {
    console.warn(
      'Failed to load subcategories from API; falling back to an empty list.',
      error,
    );
    cached = [];
  }
  return cached;
}

/**
 * Returns the active subcategories. When `categoriaId` is provided, only the
 * subcategories of that category are returned (computed from the cached list).
 * Falls back to `[]` if the API is unreachable.
 */
export async function getActiveSubcategories(
  categoriaId?: string,
): Promise<readonly SubcategoriaApi[]> {
  const all = await fetchAll();
  if (!categoriaId || categoriaId === '') {
    return all;
  }
  return all.filter((sub) => sub.categoriaId === categoriaId);
}
