import { describe, it, expect, vi, afterEach } from 'vitest';

/**
 * Build-time transport contract for `getFeaturedProducts()` — the featured
 * cards of the home "Soluciones Destacadas" section.
 *
 * Parity with `getPublicProducts()` (see `products.test.ts` and
 * `catalogFailFast.test.ts`):
 * - fetches `GET /products?destacado=true` (server-side filter, index-backed)
 * - module-level cache (one HTTP call per build)
 * - degrades to `[]` + warn without `REQUIRE_API` (SC-env-05)
 * - rejects with the `SC-env-04`-style fail-fast under `REQUIRE_API=true`
 */

interface FeaturedCard {
  readonly id: string;
  readonly sku: string;
  readonly titulo: string;
  readonly slug: string;
  readonly descripcionBreve: string;
  readonly categoriaId: string;
  readonly subcategoriaId: string | null;
  readonly galeria: readonly { readonly url: string; readonly alt: string }[];
  readonly precio: { readonly valor: number; readonly visible: boolean };
  readonly creadoEn: string;
}

function makeFeatured(count: number): FeaturedCard[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    sku: `SKU-${i}`,
    titulo: `Destacado ${i}`,
    slug: `destacado-${i}`,
    descripcionBreve: 'Descripción corta.',
    categoriaId: 'cat-fluidos',
    subcategoriaId: null,
    galeria: [],
    precio: { valor: 1000 + i, visible: true },
    creadoEn: '2026-01-15T12:00:00.000Z',
  }));
}

async function load() {
  vi.resetModules();
  return import('@/lib/api/products');
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
  delete process.env.NESTJS_API_URL;
});

describe('getFeaturedProducts — transport', () => {
  it('returns the featured list on success, requesting the destacado filter', async () => {
    const { getFeaturedProducts } = await load();
    const fetchMock = mockFetch({ data: makeFeatured(5) });
    const result = await getFeaturedProducts();
    expect(result).toHaveLength(5);
    expect(result[0]!.slug).toBe('destacado-0');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(String(fetchMock.mock.calls[0]![0]));
    expect(url.pathname).toMatch(/\/products$/);
    expect(url.searchParams.get('destacado')).toBe('true');
    expect(url.searchParams.get('page')).toBe('1');
    expect(url.searchParams.get('limit')).toBe('100');
  });

  it('caches so fetch is called only once across calls', async () => {
    const { getFeaturedProducts } = await load();
    const fetchMock = mockFetch({ data: makeFeatured(5) });
    await getFeaturedProducts();
    await getFeaturedProducts();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('getFeaturedProducts — fail-safe fallback (SC-env-05)', () => {
  it('falls back to [] and warns when the API returns non-2xx', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { getFeaturedProducts } = await load();
    mockFetch({}, false, 503);
    await expect(getFeaturedProducts()).resolves.toEqual([]);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('falls back to [] and warns on network error', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { getFeaturedProducts } = await load();
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    (globalThis as unknown as { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;
    await expect(getFeaturedProducts()).resolves.toEqual([]);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});

describe('getFeaturedProducts — fail-fast gate (REQUIRE_API=true)', () => {
  it('rejects with the REQUIRE_API build error when the API is unreachable', async () => {
    vi.stubEnv('REQUIRE_API', 'true');
    const { getFeaturedProducts } = await load();
    mockFetch({}, false, 503);
    await expect(getFeaturedProducts()).rejects.toThrow(/REQUIRE_API=true/);
  });

  it('does not poison the module cache with the fallback after a rejected fetch', async () => {
    vi.stubEnv('REQUIRE_API', 'true');
    const { getFeaturedProducts } = await load();
    mockFetch({}, false, 503);
    await expect(getFeaturedProducts()).rejects.toThrow(/REQUIRE_API=true/);
    await expect(getFeaturedProducts()).rejects.toThrow(/REQUIRE_API=true/);
  });
});

describe('getFeaturedProducts — base URL', () => {
  it('uses the configured base URL from NESTJS_API_URL', async () => {
    process.env.NESTJS_API_URL = 'https://api.example.com/api/v1';
    const { getFeaturedProducts } = await load();
    const fetchMock = mockFetch({ data: [] });
    await getFeaturedProducts();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('https://api.example.com/api/v1/products?'),
      expect.objectContaining({ headers: { accept: 'application/json' } }),
    );
  });
});
