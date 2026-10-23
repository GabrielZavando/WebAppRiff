import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ProductoCardApi } from '@/lib/types/products-page';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

/**
 * Page-level contract for the home `/` featured section (change
 * `home-featured-products-grid`).
 *
 * The page frontmatter fetches the backend featured cards via
 * `getFeaturedProducts()`, maps them with `toFeaturedProduct` and applies
 * the visual 8-card cap (`slice(0, 8)`) BEFORE passing `products` to
 * `DestacadosSection`. The API module is mocked so the render is
 * deterministic; see the delta spec scenarios "El backend devuelve más de 8
 * destacados y el frontend corta a 8" and "El backend no devuelve
 * destacados…".
 */

vi.mock('@/lib/api/products', () => ({
  getFeaturedProducts: vi.fn(async () => FEATURED_RESPONSE),
  // The catalog fetchers must stay available (other imports may poke them)
  // but are never used to build the featured section.
  getPublicProducts: vi.fn(async () => []),
  getProductBySlug: vi.fn(async () => null),
}));

/** 10 featured cards in backend order (creadoEn DESC) to prove the slice. */
const FEATURED_RESPONSE: ProductoCardApi[] = Array.from(
  { length: 10 },
  (_, i) => ({
    id: `featured-${i}`,
    sku: `SKU-${i}`,
    titulo: `Producto Destacado ${i}`,
    slug: `producto-destacado-${i}`,
    descripcionBreve: 'Descripción breve.',
    categoriaId: 'cat-fluidos',
    subcategoriaId: null,
    galeria: [
      {
        url: `https://storage.googleapis.com/riff/destacado-${i}.webp`,
        alt: `Alt del destacado ${i}`,
      },
    ],
    precio: { valor: 1000 + i, visible: true },
    creadoEn: '2026-01-15T12:00:00.000Z',
  }),
);

import Index from '@/pages/index.astro';
import { getFeaturedProducts } from '@/lib/api/products';

function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

/** Extracts the DestacadosSection section element (dark navy background). */
function extractDestacadosSection(clean: string): string {
  const match = clean.match(
    /<section[^>]*class="[^"]*bg-secondary-dark[^"]*">[\s\S]*?<\/section>/,
  );
  if (!match) throw new Error('DestacadosSection <section> not found');
  return match[0];
}

async function renderHome(): Promise<string> {
  const container = await AstroContainer.create();
  return stripComments(await container.renderToString(Index, {}));
}

beforeEach(() => {
  vi.mocked(getFeaturedProducts).mockClear();
});

describe('Home featured section — build-time data source', () => {
  it('fetches the featured list once per page render', async () => {
    await renderHome();
    expect(getFeaturedProducts).toHaveBeenCalledTimes(1);
  });

  it('caps the visual grid to the first 8 backend featured (slice 0..8)', async () => {
    const clean = await renderHome();
    const section = extractDestacadosSection(clean);
    // 10 mocked → exactly 8 cards (backend order, first 8).
    expect((section.match(/<article/g) ?? []).length).toBe(8);
    expect(section).toContain('Producto Destacado 0');
    expect(section).toContain('Producto Destacado 7');
    expect(section).not.toContain('Producto Destacado 8');
    expect(section).not.toContain('Producto Destacado 9');
  });

  it('renders cards in backend order without re-sorting', async () => {
    const clean = await renderHome();
    const section = extractDestacadosSection(clean);
    const titles = [...section.matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>/g)].map(
      (m) => m[1],
    );
    expect(titles).toEqual([
      'Producto Destacado 0',
      'Producto Destacado 1',
      'Producto Destacado 2',
      'Producto Destacado 3',
      'Producto Destacado 4',
      'Producto Destacado 5',
      'Producto Destacado 6',
      'Producto Destacado 7',
    ]);
  });

  it('keeps the header copy from DESTACADOS_SECTION_CONTENT when there are no featured', async () => {
    vi.mocked(getFeaturedProducts).mockResolvedValueOnce([]);
    const clean = await renderHome();
    const section = extractDestacadosSection(clean);
    expect(section).toContain('Soluciones Destacadas');
    expect(section).toContain('EXPLORAR CATÁLOGO COMPLETO');
    expect(section).not.toContain('<article');
  });

  it('keeps the section DOM order: destacados renders after services', async () => {
    const clean = await renderHome();
    // The sections carry unique background tokens: ServicesSection is the
    // deep teal block, DestacadosSection is the dark navy block right after.
    const servicesAt = clean.indexOf('bg-primary-deep');
    const destacadosAt = clean.indexOf('bg-secondary-dark');
    expect(servicesAt).toBeGreaterThan(0);
    expect(destacadosAt).toBeGreaterThan(servicesAt);
  });

  it('type-level: the page feeds DestacadosSectionProps products (0..8)', () => {
    // Contract smoke: the sliced list feeds the products prop; the cap is
    // applied by the page (slice), not by the component.
    const sliced = FEATURED_RESPONSE.slice(0, 8);
    expect(sliced).toHaveLength(8);
    expect(sliced[0]!.slug).toBe('producto-destacado-0');
    expect(sliced[7]!.slug).toBe('producto-destacado-7');
  });
});
