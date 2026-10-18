import { describe, it, expect, vi, afterEach } from 'vitest';

interface ProductoApi {
  readonly id: string;
  readonly sku: string;
  readonly titulo: string;
  readonly slug: string;
  readonly descripcionBreve: string;
  readonly descripcionLarga?: string;
  readonly categoriaId: string;
  readonly subcategoriaId: string | null;
  readonly galeria: readonly { readonly url: string; readonly alt: string }[];
  readonly atributos?: readonly { readonly etiqueta: string; readonly valor: string }[];
  readonly fichaTecnica?: { readonly url: string; readonly nombreArchivo: string } | null;
  readonly precio: { readonly valor: number; readonly visible: boolean };
  readonly creadoEn: string;
}

const SAMPLE: ProductoApi[] = [
  {
    id: 'p1',
    sku: 'FLJ-001',
    titulo: 'Flujómetro Universal',
    slug: 'flujometro-universal',
    descripcionBreve: 'Medidor electromagnético.',
    categoriaId: 'cat-fluidos',
    subcategoriaId: 'sub-caudal',
    galeria: [],
    precio: { valor: 125000, visible: true },
    creadoEn: '2026-01-15T12:00:00.000Z',
  },
  {
    id: 'p2',
    sku: 'MAN-002',
    titulo: 'Manómetro Beta',
    slug: 'manometro-beta',
    descripcionBreve: 'Control de presión.',
    categoriaId: 'cat-fluidos',
    subcategoriaId: 'sub-presion',
    galeria: [],
    precio: { valor: 80000, visible: true },
    creadoEn: '2026-01-10T12:00:00.000Z',
  },
];

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
  vi.restoreAllMocks();
  delete process.env.NESTJS_API_URL;
});

describe('getPublicProducts', () => {
  it('returns the data array on success', async () => {
    const { getPublicProducts } = await load();
    const fetchMock = mockFetch({ data: SAMPLE });
    const result = await getPublicProducts();
    expect(result).toHaveLength(2);
    expect(result[0]!.id).toBe('p1');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/products'),
      expect.objectContaining({ headers: { accept: 'application/json' } }),
    );
  });

  it('caches so fetch is called only once across calls', async () => {
    const { getPublicProducts } = await load();
    const fetchMock = mockFetch({ data: SAMPLE });
    await getPublicProducts();
    await getPublicProducts();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to [] when the API returns non-2xx', async () => {
    const { getPublicProducts } = await load();
    const fetchMock = mockFetch({ message: 'boom' }, false, 500);
    const result = await getPublicProducts();
    expect(result).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to [] on network error', async () => {
    const { getPublicProducts } = await load();
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    (globalThis as unknown as { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;
    const result = await getPublicProducts();
    expect(result).toEqual([]);
  });

  it('uses the configured base URL from NESTJS_API_URL', async () => {
    process.env.NESTJS_API_URL = 'https://api.example.com/api/v1';
    const { getPublicProducts } = await load();
    const fetchMock = mockFetch({ data: [] });
    await getPublicProducts();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('https://api.example.com/api/v1/products'),
      expect.anything(),
    );
  });
});

function makeProducts(count: number, offset = 0): ProductoApi[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${offset + i}`,
    sku: `SKU-${offset + i}`,
    titulo: `Producto ${offset + i}`,
    slug: `producto-${offset + i}`,
    descripcionBreve: 'Descripción corta.',
    categoriaId: 'cat-fluidos',
    subcategoriaId: null,
    galeria: [],
    precio: { valor: 1000 + offset + i, visible: true },
    creadoEn: '2026-01-15T12:00:00.000Z',
  }));
}

function mockPagedFetch(pages: readonly (readonly ProductoApi[])[]): ReturnType<typeof vi.fn> {
  const total = pages.reduce((acc, page) => acc + page.length, 0);
  const fetchMock = vi.fn(async (input: unknown) => {
    const url = new URL(String(input));
    const page = Number(url.searchParams.get('page') ?? '1');
    const limit = Number(url.searchParams.get('limit') ?? '100');
    const data = pages[page - 1] ?? [];
    return { ok: true, status: 200, json: async () => ({ data, meta: { page, limit, total } }) };
  });
  (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe('getPublicProducts pagination', () => {
  it('paginates with limit=100 until meta.total is reached', async () => {
    const fetchMock = mockPagedFetch([makeProducts(100, 0), makeProducts(30, 100)]);
    const { getPublicProducts } = await load();
    const result = await getPublicProducts();
    expect(result).toHaveLength(130);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstUrl = new URL(String(fetchMock.mock.calls[0]![0]));
    expect(firstUrl.searchParams.get('page')).toBe('1');
    expect(firstUrl.searchParams.get('limit')).toBe('100');
    const secondUrl = new URL(String(fetchMock.mock.calls[1]![0]));
    expect(secondUrl.searchParams.get('page')).toBe('2');
  });

  it('returns products beyond the API default limit of 24', async () => {
    mockPagedFetch([makeProducts(70, 0)]);
    const { getPublicProducts } = await load();
    const result = await getPublicProducts();
    expect(result).toHaveLength(70);
    expect(result[69]!.id).toBe('p69');
  });

  it('stops after a single page when meta.total is absent (back-compat)', async () => {
    const fetchMock = mockFetch({ data: SAMPLE });
    const { getPublicProducts } = await load();
    const result = await getPublicProducts();
    expect(result).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to [] and warns when a later page fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    let call = 0;
    const fetchMock = vi.fn(async () => {
      call += 1;
      if (call === 1) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: makeProducts(100, 0), meta: { page: 1, limit: 100, total: 130 } }),
        };
      }
      return { ok: false, status: 500, json: async () => ({ message: 'boom' }) };
    });
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
    const { getPublicProducts } = await load();
    const result = await getPublicProducts();
    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

const SINGLE: ProductoApi = {
  id: 'p1',
  sku: 'FLJ-001',
  titulo: 'Flujómetro Universal',
  slug: 'flujometro-universal',
  descripcionBreve: 'Medidor electromagnético.',
  descripcionLarga: '<p>Desc larga.</p>',
  categoriaId: 'cat-fluidos',
  subcategoriaId: 'sub-caudal',
  galeria: [],
  atributos: [],
  fichaTecnica: null,
  precio: { valor: 125000, visible: true },
  creadoEn: '2026-01-15T12:00:00.000Z',
};

describe('getProductBySlug', () => {
  it('returns the product on success', async () => {
    const { getProductBySlug } = await load();
    const fetchMock = mockFetch({ data: SINGLE });
    const result = await getProductBySlug('flujometro-universal');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('p1');
    expect(result?.slug).toBe('flujometro-universal');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/products/slug/flujometro-universal'),
      expect.objectContaining({ headers: { accept: 'application/json' } }),
    );
  });

  it('caches so fetch is called only once across calls for the same slug', async () => {
    const { getProductBySlug } = await load();
    const fetchMock = mockFetch({ data: SINGLE });
    await getProductBySlug('flujometro-universal');
    await getProductBySlug('flujometro-universal');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns null when the API returns non-2xx', async () => {
    const { getProductBySlug } = await load();
    mockFetch({ message: 'boom' }, false, 404);
    const result = await getProductBySlug('missing');
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    const { getProductBySlug } = await load();
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    (globalThis as unknown as { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;
    const result = await getProductBySlug('flujometro-universal');
    expect(result).toBeNull();
  });

  it('uses the configured base URL from NESTJS_API_URL', async () => {
    process.env.NESTJS_API_URL = 'https://api.example.com/api/v1';
    const { getProductBySlug } = await load();
    const fetchMock = mockFetch({ data: SINGLE });
    await getProductBySlug('flujometro-universal');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/products/slug/flujometro-universal',
      expect.anything(),
    );
  });

  it('always fetches from the API by slug (does not reuse catalog cache)', async () => {
    const mod = await load();
    // Prime the catalog cache via getPublicProducts
    mockFetch({ data: SAMPLE });
    await mod.getPublicProducts();

    // Now call getProductBySlug — it should issue its own fetch, NOT reuse the cache
    const fetchMock = mockFetch({ data: SINGLE });
    const result = await mod.getProductBySlug('flujometro-universal');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('p1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/products/slug/flujometro-universal'),
      expect.objectContaining({ headers: { accept: 'application/json' } }),
    );
  });
});
