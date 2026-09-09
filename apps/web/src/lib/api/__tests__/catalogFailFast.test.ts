import { describe, it, expect, vi, afterEach } from 'vitest';

/**
 * Fail-fast contract for build-time catalog sources (SC-env-03/04/05).
 *
 * With `REQUIRE_API=true` a failing catalog source must fail the build with an
 * explicit error (and must not poison the module cache with the fallback). An
 * empty catalog response is also a hard failure for the products source.
 * Without `REQUIRE_API` the warn-and-fallback behavior is preserved even on a
 * production build (`import.meta.env.PROD` alone never enables the gate).
 */

async function loadProducts() {
  vi.resetModules();
  return import('@/lib/api/products');
}

async function loadCategories() {
  vi.resetModules();
  return import('@/lib/api/categories');
}

async function loadSubcategories() {
  vi.resetModules();
  return import('@/lib/api/subcategories');
}

function mockFetch(body: unknown, ok = true, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  });
  (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  delete process.env.REQUIRE_API;
});

describe('SC-env-03 — REQUIRE_API=true fails the build when a catalog source fails', () => {
  it('products: rejects when the API is unreachable', async () => {
    vi.stubEnv('REQUIRE_API', 'true');
    mockFetch({}, false, 503);
    const { getPublicProducts } = await loadProducts();
    await expect(getPublicProducts()).rejects.toThrow(/REQUIRE_API=true/);
  });

  it('categories: rejects when the API is unreachable', async () => {
    vi.stubEnv('REQUIRE_API', 'true');
    mockFetch({}, false, 503);
    const { getCategorias } = await loadCategories();
    await expect(getCategorias()).rejects.toThrow(/REQUIRE_API=true/);
  });

  it('categories options: rejects when the API is unreachable', async () => {
    vi.stubEnv('REQUIRE_API', 'true');
    mockFetch({}, false, 503);
    const { getSearchFormCategories } = await loadCategories();
    await expect(getSearchFormCategories()).rejects.toThrow(/REQUIRE_API=true/);
  });

  it('subcategories: rejects when the API is unreachable', async () => {
    vi.stubEnv('REQUIRE_API', 'true');
    mockFetch({}, false, 503);
    const { getActiveSubcategories } = await loadSubcategories();
    await expect(getActiveSubcategories()).rejects.toThrow(/REQUIRE_API=true/);
  });

  it('products: does not cache the fallback after a rejected build-time fetch', async () => {
    vi.stubEnv('REQUIRE_API', 'true');
    mockFetch({}, false, 503);
    const { getPublicProducts } = await loadProducts();
    await expect(getPublicProducts()).rejects.toThrow(/REQUIRE_API=true/);
    await expect(getPublicProducts()).rejects.toThrow(/REQUIRE_API=true/);
  });
});

describe('SC-env-04 — empty catalog with REQUIRE_API=true is a hard failure', () => {
  it('products: rejects on a successful response with an empty catalog', async () => {
    vi.stubEnv('REQUIRE_API', 'true');
    mockFetch({ data: [] });
    const { getPublicProducts } = await loadProducts();
    await expect(getPublicProducts()).rejects.toThrow(/empty catalog/);
  });
});

describe('SC-env-05 — without REQUIRE_API the warn-and-fallback is preserved', () => {
  it('products: resolves to an empty catalog with a warning even on a production build', async () => {
    vi.stubEnv('PROD', true);
    delete process.env.REQUIRE_API;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockFetch({}, false, 503);
    const { getPublicProducts } = await loadProducts();
    await expect(getPublicProducts()).resolves.toEqual([]);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('categories: resolves to the default-only option list on failure', async () => {
    delete process.env.REQUIRE_API;
    mockFetch({}, false, 503);
    const { getSearchFormCategories } = await loadCategories();
    await expect(getSearchFormCategories()).resolves.toEqual([
      { id: '', label: 'Todas las categorías' },
    ]);
  });

  it('subcategories: resolves to an empty list on failure', async () => {
    delete process.env.REQUIRE_API;
    mockFetch({}, false, 503);
    const { getActiveSubcategories } = await loadSubcategories();
    await expect(getActiveSubcategories()).resolves.toEqual([]);
  });
});
