import { describe, it, expect, vi } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

const product = {
  id: 'prod-041',
  sku: 'SKU-PEND-041',
  titulo: 'Ablandador para Agua',
  slug: 'ablandador-para-agua',
  categoriaId: 'tratamiento-de-agua',
  subcategoriaId: 'tratamiento-de-agua--ablandadores-de-agua',
  galeria: [
    {
      url: 'https://storage.googleapis.com/webappriff.firebasestorage.app/productos/prod-041/1.webp',
      storagePath: 'productos/prod-041/1.webp',
      alt: 'Ablandador para Agua',
      orden: 1,
    },
  ],
  atributos: [{ nombre: 'Precisión', valor: '±2%' }],
  fichaTecnica: null,
  precio: { valor: 0, visible: false },
  creadoEn: '2026-08-16T03:22:27.174Z',
  actualizadoEn: '2026-08-16T20:44:00.388Z',
  idExterno: null,
  descripcionBreve: 'Uso COMERCIAL E INDUSTRIAL, SOLICITAR ASESORIA.',
};

const categories = [
  { id: 'tratamiento-de-agua', nombre: 'Medición de Fluidos', slug: 'tratamiento-de-agua', esDefault: false },
];

// Deterministic API mocks: the page must not depend on the live backend.
vi.mock('@/lib/api/products', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/products')>();
  return {
    ...actual,
    getPublicProducts: vi.fn(async () => [product]),
    getProductBySlug: vi.fn(async (slug: string) => (slug === product.slug ? product : null)),
  };
});

vi.mock('@/lib/api/categories', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/categories')>();
  return {
    ...actual,
    getCategorias: vi.fn(async () => categories),
  };
});

async function render(slug = product.slug): Promise<string> {
  const container = await AstroContainer.create();
  const pageMod = await import('@/pages/productos/[slug].astro');
  return container.renderToString(pageMod.default, {
    params: { slug },
    response: new Response(null),
  });
}

describe('Product detail page', () => {
  it('renders the product title as an h1', async () => {
    const html = await render();
    expect(html).toContain('Ablandador para Agua');
  });

  it('renders the SEO <title> in the "{titulo} — Riff" format', async () => {
    const html = await render();
    expect(html).toMatch(/<title>Ablandador para Agua — Riff<\/title>/);
  });

  it('renders the category chip', async () => {
    const html = await render();
    expect(html).toContain('Medición de Fluidos');
  });

  it('renders the short description', async () => {
    const html = await render();
    expect(html).toContain('Uso COMERCIAL E INDUSTRIAL, SOLICITAR ASESORIA.');
  });

  it('renders the specifications box with the attribute', async () => {
    const html = await render();
    expect(html).toContain('ESPECIFICACIONES CLAVE');
    expect(html).toContain('Precisión');
    expect(html).toContain('±2%');
  });

  it('renders the technical documentation section with the contact CTA (no fichaTecnica)', async () => {
    const html = await render();
    expect(html).toContain('Documentación Técnica');
    expect(html).toContain('Solicitar ficha técnica');
    expect(html).toContain('href="/contacto"');
    expect(html).not.toContain('Catálogo Técnico');
  });

  it('renders the industrial applications section', async () => {
    const html = await render();
    expect(html).toContain('Aplicaciones Industriales');
    expect(html).toContain('Minería');
  });

  it('renders both CTAs with correct hrefs', async () => {
    const html = await render();
    expect(html).toContain('SOLICITAR COTIZACIÓN');
    expect(html).toContain('CONTACTAR ASESOR');
    expect(html).toContain('href="/cotizacion?producto=ablandador-para-agua"');
    expect(html).toContain('href="mailto:contacto@riff.cl"');
  });

  it('renders the product gallery with the main image', async () => {
    const html = await render();
    expect(html).toContain('data-main-image');
    expect(html).toContain('https://storage.googleapis.com/webappriff.firebasestorage.app/productos/prod-041/1.webp');
  });

  it('returns a 404 when the product does not exist', async () => {
    const container = await AstroContainer.create();
    const pageMod = await import('@/pages/productos/[slug].astro');
    const response = await container.renderToResponse(pageMod.default, {
      params: { slug: 'no-existe' },
      request: new Request('http://localhost/productos/no-existe'),
    });
    expect(response.status).toBe(404);
    const resultText = await response.text();
    expect(resultText).toContain('Producto no encontrado');
  });
});
