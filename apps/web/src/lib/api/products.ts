import type { ProductoApi } from '@/lib/types/products-page';
import type { CategoriaApi } from '@/lib/types/products-page';

/**
 * Build-time data source for the public product catalog.
 *
 * The public site is statically generated (SSG): this module is imported from
 * `pages/productos/index.astro` frontmatter during `astro build`, fetches the
 * public products once, and bakes them into the static HTML. There is NO
 * per-page-load API call at runtime. The backend returns only `publicado: true`
 * products for unauthenticated requests. If the API is unreachable the page
 * degrades to an empty catalog so the build never fails.
 *
 * Mirrors `lib/api/categories.ts` (module-level cache + safe fallback).
 */

let cached: readonly ProductoApi[] | null = null;

function getApiBaseUrl(): string {
  return process.env.NESTJS_API_URL ?? 'http://localhost:3000/api/v1';
}

interface ProductsListResponse {
  readonly data: ProductoApi[];
}

/**
 * Returns the public product list baked into the static site. Fetches from the
 * backend at build time, caches the result, and falls back to `[]` if the API
 * is unreachable so `astro build` never fails.
 */
export async function getPublicProducts(): Promise<readonly ProductoApi[]> {
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(`${getApiBaseUrl()}/products`, {
      headers: { accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Products API responded with ${response.status}`);
    }
    const body = (await response.json()) as ProductsListResponse;
    cached = body.data;
  } catch (error) {
    console.warn(
      'Failed to load products from API; falling back to an empty catalog.',
      error,
    );
    cached = [];
  }
  return cached;
}

// Re-export the category type so consumers can build the card model without a
// second import line.
export type { CategoriaApi };
