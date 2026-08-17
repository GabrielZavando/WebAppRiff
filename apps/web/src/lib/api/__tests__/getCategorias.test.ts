import { describe, it, expect, vi, afterEach } from 'vitest';

interface CategoriaApi {
  readonly id: string;
  readonly nombre: string;
  readonly slug: string;
  readonly orden: number;
  readonly activa: boolean;
}

const SAMPLE: CategoriaApi[] = [
  { id: 'cat-fluidos', nombre: 'Medición de Fluidos', slug: 'medicion-de-fluidos', orden: 1, activa: true },
  { id: 'cat-bombas', nombre: 'Bombas', slug: 'bombas', orden: 2, activa: true },
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
  (globalThis as unknown as { fetch: typeof fetch }).fetch =
    fetchMock as unknown as typeof fetch;
  return fetchMock;
}

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.NESTJS_API_URL;
});

describe('getCategorias', () => {
  it('returns the data array on success', async () => {
    const { getCategorias } = await load();
    mockFetch({ data: SAMPLE });
    const result = await getCategorias();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('cat-fluidos');
  });

  it('caches so fetch is called only once across calls', async () => {
    const { getCategorias } = await load();
    const fetchMock = mockFetch({ data: SAMPLE });
    await getCategorias();
    await getCategorias();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to [] when the API returns non-2xx', async () => {
    const { getCategorias } = await load();
    mockFetch({ message: 'boom' }, false, 500);
    const result = await getCategorias();
    expect(result).toEqual([]);
  });

  it('falls back to [] on network error', async () => {
    const { getCategorias } = await load();
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    (globalThis as unknown as { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;
    const result = await getCategorias();
    expect(result).toEqual([]);
  });

  it('uses the configured base URL from NESTJS_API_URL', async () => {
    process.env.NESTJS_API_URL = 'https://api.example.com/v1';
    const { getCategorias } = await load();
    const fetchMock = mockFetch(SAMPLE);
    await getCategorias();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/v1/categories?activa=true',
      expect.anything(),
    );
  });
});
