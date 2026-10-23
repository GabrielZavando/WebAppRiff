import type { ProductoApi, ProductoCardApi } from '@/lib/types/products-page';
import type { CategoriaApi } from '@/lib/types/products-page';
import {
  assertCatalogSourceAvailable,
  mustFailOnCatalogError,
  resolveApiBaseUrl,
  warnCatalogFallback,
} from '@/lib/api/apiBaseUrl';

/**
 * Build-time data source for the public product catalog.
 *
 * The public site is statically generated (SSG): this module is imported from
 * `pages/productos/index.astro` frontmatter during `astro build`, fetches the
 * complete public catalog (paginating until `meta.total` is covered), and bakes
 * it into the static HTML. There is NO per-page-load API call at runtime. The
 * backend returns only `publicado: true` products for unauthenticated requests.
 * If the API is unreachable the page degrades to an empty catalog so the build
 * never fails.
 *
 * Mirrors `lib/api/categories.ts` (module-level cache + safe fallback).
 */

let cached: readonly ProductoApi[] | null = null;
/** Module-level cache for the featured cards (one HTTP call per build). */
let featuredCached: readonly ProductoCardApi[] | null = null;

/** Transport page size used to walk the catalog until `meta.total` is covered. */
const PAGE_LIMIT = 100;
/** Safety cap so a misbehaving API can never spin the build forever. */
const MAX_PAGES = 100;

interface ProductsListResponse<T = ProductoApi> {
  readonly data: T[];
  readonly meta?: {
    readonly page?: number;
    readonly limit?: number;
    readonly total?: number;
  };
}

/**
 * Returns the public product list baked into the static site. Fetches from the
 * backend at build time, walking every page (`limit=100`) until `meta.total`
 * published products are collected — the API's default limit is 24, so a single
 * unpaginated call would silently drop the rest. Caches the full result at module
 * scope and falls back to `[]` if the API is unreachable so `astro build` never
 * fails.
 */
export async function getPublicProducts(): Promise<readonly ProductoApi[]> {
  if (cached) {
    return cached;
  }
  try {
    const collected: ProductoApi[] = [];
    let page = 1;
    for (;;) {
      const response = await fetch(
        `${resolveApiBaseUrl()}/products?page=${page}&limit=${PAGE_LIMIT}`,
        { headers: { accept: 'application/json' } },
      );
      if (!response.ok) {
        throw new Error(`Products API responded with ${response.status}`);
      }
      const body = (await response.json()) as ProductsListResponse;
      const batch = body.data ?? [];
      if (mustFailOnCatalogError() && page === 1 && batch.length === 0) {
        throw new Error('Products API returned an empty catalog (SC-env-04).');
      }
      collected.push(...batch);

      const total = body.meta?.total;
      const hasTotal = typeof total === 'number';
      const reachedTotal = hasTotal && collected.length >= total;
      const lastShortPage = batch.length < PAGE_LIMIT;
      // Without a total we cannot safely page further: stop after the first page.
      if (!hasTotal || reachedTotal || lastShortPage || page >= MAX_PAGES) {
        break;
      }
      page += 1;
    }
    cached = collected;
  } catch (error) {
    assertCatalogSourceAvailable('products', error);
    warnCatalogFallback('products', error);
    cached = [];
  }
  return cached;
}

/**
 * Returns the featured product cards for the home "Soluciones Destacadas"
 * section. Fetches from the backend at build time with the server-side
 * `destacado=true` filter (panel-managed flag; the read service forces
 * `publicado: true` for anonymous requests, so only published products are
 * returned). A single `limit=100` page is enough: the featured subset can
 * never exceed the catalog's `MAX_LIMIT` page size, so no pagination walk
 * is needed (unlike `getPublicProducts`).
 *
 * Caches the result at module scope and falls back to `[]` if the API is
 * unreachable so `astro build` never fails (same SC-env policy as the
 * catalog). The visual 8-card cap applied by the home page (`.slice(0, 8)`)
 * is independent of this limit.
 */
export async function getFeaturedProducts(): Promise<readonly ProductoCardApi[]> {
  if (featuredCached) {
    return featuredCached;
  }
  try {
    const response = await fetch(
      `${resolveApiBaseUrl()}/products?destacado=true&page=1&limit=100`,
      { headers: { accept: 'application/json' } },
    );
    if (!response.ok) {
      throw new Error(`Featured products API responded with ${response.status}`);
    }
    const body = (await response.json()) as ProductsListResponse<ProductoCardApi>;
    featuredCached = body.data ?? [];
  } catch (error) {
    assertCatalogSourceAvailable('featured products', error);
    warnCatalogFallback('featured products', error);
    featuredCached = [];
  }
  return featuredCached;
}

interface ProductDetailResponse {
  readonly data: ProductoApi;
}

// Per-slug cache: each product is fetched at most once per build. Keyed by slug
// because the detail page is reached via `getStaticPaths` (one render per slug),
// and the same slug can be re-rendered (e.g. HMR, multiple route renders in one
// build). The cache mirrors `cached` above but is keyed, not single-value.
const detailCache = new Map<string, ProductoApi | null>();

/**
 * Returns a single public product by slug, baked into the static site at build
 * time. Fetches from the backend, caches the result per slug, and falls back to
 * `null` if the product is missing or the API is unreachable so `astro build`
 * never fails (the page simply renders a 404).
 */
export async function getProductBySlug(slug: string): Promise<ProductoApi | null> {
  if (detailCache.has(slug)) {
    return detailCache.get(slug) ?? null;
  }
  let product: ProductoApi | null = null;
  try {
    const response = await fetch(`${resolveApiBaseUrl()}/products/slug/${slug}`, {
      headers: { accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Product detail API responded with ${response.status}`);
    }
    const body = (await response.json()) as ProductDetailResponse;
    product = body.data;
  } catch (error) {
    console.warn(
      `Failed to load product "${slug}" from API; rendering 404.`,
      error,
    );
    product = null;
  }
  detailCache.set(slug, product);
  return product;
}

// Re-export the category type so consumers can build the card model without a
// second import line.
export type { CategoriaApi };
