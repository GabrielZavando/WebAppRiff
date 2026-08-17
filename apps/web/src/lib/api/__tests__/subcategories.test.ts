import { describe, it, expect, vi, afterEach } from 'vitest';

interface SubcategoriaApi {
  readonly id: string;
  readonly categoriaId: string;
  readonly nombre: string;
  readonly slug: string;
  readonly orden: number;
  readonly activa: boolean;
}

const SAMPLE: SubcategoriaApi[] = [
  { id: 'sub-caudal', categoriaId: 'cat-fluidos', nombre: 'Caudal', slug: 'caudal', orden: 1, activa: true },
  { id: 'sub-presion', categoriaId: 'cat-fluidos', nombre: 'Presión', slug: 'presion', orden: 2, activa: true },
  { id: 'sub-bomba', categoriaId: 'cat-bombas', nombre: 'Bomba', slug: 'bomba', orden: 1, activa: true },
];

async function load() {
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
  vi.restoreAllMocks();
  delete process.env.NESTJS_API_URL;
});

describe('getActiveSubcategories', () => {
  it('returns the full active list on success', async () => {
    const { getActiveSubcategories } = await load();
    const fetchMock = mockFetch({ data: SAMPLE });
    const result = await getActiveSubcategories();
    expect(result).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/subcategories?activa=true'),
      expect.objectContaining({ headers: { accept: 'application/json' } }),
    );
  });

  it('caches so fetch is called only once across calls', async () => {
    const { getActiveSubcategories } = await load();
    const fetchMock = mockFetch({ data: SAMPLE });
    await getActiveSubcategories();
    await getActiveSubcategories('cat-fluidos');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('filters by categoriaId from the cached list (no extra fetch)', async () => {
    const { getActiveSubcategories } = await load();
    const fetchMock = mockFetch({ data: SAMPLE });
    const result = await getActiveSubcategories('cat-fluidos');
    expect(result.map((s) => s.id).sort()).toEqual(['sub-caudal', 'sub-presion']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns [] when no subcategory matches the category', async () => {
    const { getActiveSubcategories } = await load();
    mockFetch({ data: SAMPLE });
    const result = await getActiveSubcategories('cat-inexistente');
    expect(result).toEqual([]);
  });

  it('falls back to [] on API error', async () => {
    const { getActiveSubcategories } = await load();
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    (globalThis as unknown as { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;
    const result = await getActiveSubcategories();
    expect(result).toEqual([]);
  });

  it('uses the configured base URL from NESTJS_API_URL', async () => {
    process.env.NESTJS_API_URL = 'https://api.example.com/v1';
    const { getActiveSubcategories } = await load();
    const fetchMock = mockFetch({ data: [] });
    await getActiveSubcategories();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/v1/subcategories?activa=true',
      expect.anything(),
    );
  });
});
