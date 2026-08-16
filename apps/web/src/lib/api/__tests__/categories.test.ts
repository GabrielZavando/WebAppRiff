import { describe, it, expect, vi, afterEach } from 'vitest';

interface CategoriaApi {
  readonly id: string;
  readonly nombre: string;
  readonly slug: string;
  readonly orden: number;
  readonly activa: boolean;
}

const SAMPLE: CategoriaApi[] = [
  { id: 'seg', nombre: 'Seguridad', slug: 'seguridad', orden: 2, activa: true },
  { id: 'her', nombre: 'Herramientas', slug: 'herramientas', orden: 1, activa: true },
];

async function load() {
  vi.resetModules();
  return import('@/lib/api/categories');
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

describe('toCategoryOptions', () => {
  it('prepends the default option and maps label = nombre', async () => {
    const { toCategoryOptions } = await load();
    const result = toCategoryOptions(SAMPLE);
    expect(result[0]).toEqual({ id: '', label: 'Todas las categorías' });
    expect(result[1]).toEqual({ id: 'her', label: 'Herramientas' });
    expect(result[2]).toEqual({ id: 'seg', label: 'Seguridad' });
  });

  it('sorts by orden then nombre', async () => {
    const { toCategoryOptions } = await load();
    const sameOrden: CategoriaApi[] = [
      { id: 'b', nombre: 'Beta', slug: 'beta', orden: 1, activa: true },
      { id: 'a', nombre: 'Alpha', slug: 'alpha', orden: 1, activa: true },
    ];
    const result = toCategoryOptions(sameOrden);
    expect(result[1].id).toBe('a');
    expect(result[2].id).toBe('b');
  });
});

describe('getSearchFormCategories', () => {
  it('maps and prepends on success', async () => {
    const { getSearchFormCategories } = await load();
    const fetchMock = mockFetch({ data: SAMPLE });
    const result = await getSearchFormCategories();
    expect(result[0]).toEqual({ id: '', label: 'Todas las categorías' });
    expect(result).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/categories?activa=true'),
      expect.objectContaining({ headers: { accept: 'application/json' } }),
    );
  });

  it('caches so fetch is called only once across calls', async () => {
    const { getSearchFormCategories } = await load();
    const fetchMock = mockFetch({ data: SAMPLE });
    await getSearchFormCategories();
    await getSearchFormCategories();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to default-only when the API fails', async () => {
    const { getSearchFormCategories } = await load();
    const fetchMock = vi.fn().mockRejectedValue(new Error('network'));
    (globalThis as unknown as { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;
    const result = await getSearchFormCategories();
    expect(result).toEqual([{ id: '', label: 'Todas las categorías' }]);
  });

  it('uses the configured base URL from NESTJS_API_URL', async () => {
    process.env.NESTJS_API_URL = 'https://api.example.com/v1';
    const { getSearchFormCategories } = await load();
    const fetchMock = mockFetch({ data: [] });
    await getSearchFormCategories();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/v1/categories?activa=true',
      expect.anything(),
    );
  });
});
