import { describe, it, expect, vi, afterEach } from 'vitest';

interface ProductoApi {
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
    expect(result[0].id).toBe('p1');
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
    process.env.NESTJS_API_URL = 'https://api.example.com/v1';
    const { getPublicProducts } = await load();
    const fetchMock = mockFetch({ data: [] });
    await getPublicProducts();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/v1/products',
      expect.anything(),
    );
  });
});
