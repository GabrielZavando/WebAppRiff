import { describe, it, expect, vi, afterEach } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import type { CategoriaApi, ProductoApi, SubcategoriaApi } from '@/lib/types/products-page';

const CATEGORIES: CategoriaApi[] = [
  { id: 'cat-fluidos', nombre: 'Medición de Fluidos', slug: 'medicion-de-fluidos', orden: 1, activa: true },
  { id: 'cat-bombas', nombre: 'Bombas', slug: 'bombas', orden: 2, activa: true },
];

const SUBS: SubcategoriaApi[] = [
  { id: 'sub-caudal', categoriaId: 'cat-fluidos', nombre: 'Caudal', slug: 'caudal', orden: 1, activa: true },
  { id: 'sub-presion', categoriaId: 'cat-fluidos', nombre: 'Presión', slug: 'presion', orden: 2, activa: true },
];

function makeProducts(count: number): ProductoApi[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    sku: `SKU-${i}`,
    titulo: `Producto ${i}`,
    slug: `producto-${i}`,
    descripcionBreve: 'Descripción corta.',
    descripcionLarga: '<p>Descripción larga.</p>',
    categoriaId: i % 2 === 0 ? 'cat-fluidos' : 'cat-bombas',
    subcategoriaId: i % 2 === 0 ? 'sub-caudal' : 'sub-presion',
    galeria: [],
    atributos: [],
    fichaTecnica: null,
    precio: { valor: 1000 + i, visible: true },
    creadoEn: `2026-01-${String((i % 28) + 1).padStart(2, '0')}T00:00:00.000Z`,
  }));
}

function mockFetch(products: ProductoApi[]) {
  const fetchMock = vi.fn(async (input: unknown) => {
    const url = String(input);
    if (url.includes('/products')) {
      return { ok: true, status: 200, json: async () => ({ data: products }) };
    }
    if (url.includes('/subcategories')) {
      return { ok: true, status: 200, json: async () => ({ data: SUBS }) };
    }
    if (url.includes('/categories')) {
      return { ok: true, status: 200, json: async () => ({ data: CATEGORIES }) };
    }
    return { ok: true, status: 200, json: async () => ({ data: [] }) };
  });
  (globalThis as unknown as { fetch: typeof fetch }).fetch =
    fetchMock as unknown as typeof fetch;
  return fetchMock;
}

async function render(url = 'http://localhost/productos') {
  vi.resetModules();
  const pageMod = await import('@/pages/productos/index.astro');
  const container = await AstroContainer.create();
  return container.renderToString(pageMod.default, { request: new Request(url) });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Products catalog page (/productos)', () => {
  it('renders the page title and a category filter sidebar', async () => {
    mockFetch(makeProducts(12));
    const html = await render();
    expect(html).toContain('Catálogo de Productos');
    expect(html).toContain('name="categoriaId"');
  });

  it('bakes EVERY product card server-side (progressive enhancement, no server filtering)', async () => {
    mockFetch(makeProducts(12));
    const html = await render();
    const productIds = [
      ...html.matchAll(/data-product-id="([^"]+)"/g),
    ].map((m) => m[1]);
    expect(productIds.length).toBe(12);
    expect(productIds).toContain('producto-0');
    expect(productIds).toContain('producto-11');
    // cotizar links: one per baked card.
    const cotizarLinks = [...html.matchAll(/href="\/cotizacion\?producto=/g)].length;
    expect(cotizarLinks).toBe(12);
    // Grid marker present.
    expect(html).toContain('xl:grid-cols-3');
  });

  it('embeds the catalog data as JSON and includes the client runtime', async () => {
    mockFetch(makeProducts(5));
    const html = await render();
    expect(html).toContain('id="catalog-data"');
    expect(html).toContain('"products"');
    expect(html).toContain('"subcategorias"');
    // The baked JSON carries every product slug.
    expect(html).toContain('producto-0');
    expect(html).toContain('producto-4');
    // The client runtime entrypoint is wired as a module script.
    expect(html).toContain('<script type="module"');
    // Static targets for the runtime.
    expect(html).toContain('id="catalog-grid"');
    expect(html).toContain('id="catalog-pagination"');
    expect(html).toContain('id="catalog-empty"');
  });

  it('renders the empty-state element (hidden) even with products baked', async () => {
    mockFetch(makeProducts(12));
    const html = await render();
    const empty = html.match(/<div id="catalog-empty"[\s\S]*?<\/div>/)?.[0] ?? '';
    expect(empty).toContain('hidden');
    expect(empty).toContain('No se encontraron productos');
  });

  it('shows the empty state message with no products at all', async () => {
    mockFetch([]);
    const html = await render();
    const cotizarLinks = [...html.matchAll(/href="\/cotizacion\?producto=/g)].length;
    expect(cotizarLinks).toBe(0);
    expect(html).toContain('No se encontraron productos que coincidan con tu búsqueda.');
  });

  it('renders the view toggle links (grid / list)', async () => {
    mockFetch(makeProducts(12));
    const html = await render();
    expect(html).toContain('data-view-toggle="grid"');
    expect(html).toContain('data-view-toggle="list"');
    expect(html).toContain('href="/productos?view=list"');
  });
});
