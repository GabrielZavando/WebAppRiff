import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ProductCard from '@/components/ProductCard.astro';
import { toProductCardModel } from '@/lib/products/toProductCardModel';
import type { CategoriaApi, ProductoApi } from '@/lib/types/products-page';

const CATEGORIES: CategoriaApi[] = [
  { id: 'cat-fluidos', nombre: 'Medición de Fluidos', slug: 'medicion-de-fluidos', orden: 1, activa: true },
];

function makeProduct(o: Partial<ProductoApi> = {}): ProductoApi {
  return {
    id: 'p1',
    sku: 'FLJ-001',
    titulo: 'Flujómetro Universal',
    slug: 'flujometro-universal',
    descripcionBreve: 'Medidor electromagnético.',
    categoriaId: 'cat-fluidos',
    subcategoriaId: null,
    galeria: [],
    precio: { valor: 125000, visible: true },
    creadoEn: '2026-01-15T12:00:00.000Z',
    ...o,
  };
}

async function render(product: ProductoApi = makeProduct()) {
  const container = await AstroContainer.create();
  return container.renderToString(ProductCard, {
    props: { product: toProductCardModel(product, { categories: CATEGORIES }) },
  });
}

describe('ProductCard', () => {
  it('renders an <article> containing the product title', async () => {
    const html = await render();
    expect(html).toContain('<article');
    expect(html).toContain('Flujómetro Universal');
  });

  it('exposes data-product-id / data-categoria-id / data-subcategoria-id for the client runtime', async () => {
    const html = await render(
      makeProduct({ slug: 'flujo-x', categoriaId: 'cat-fluidos', subcategoriaId: 'sub-caudal' }),
    );
    expect(html).toMatch(/data-product-id="flujo-x"/);
    expect(html).toMatch(/data-categoria-id="cat-fluidos"/);
    expect(html).toMatch(/data-subcategoria-id="sub-caudal"/);
  });

  it('emits an empty data-subcategoria-id when the product has no subcategory', async () => {
    const html = await render(makeProduct({ subcategoriaId: null }));
    const article = html.match(/<article[^>]*>/)?.[0] ?? '';
    expect(article).toContain('data-subcategoria-id');
    expect(article).not.toContain('data-subcategoria-id="sub-');
  });

  it('renders the category chip with the resolved category name', async () => {
    const html = await render();
    expect(html).toContain('Medición de Fluidos');
    expect(html).toContain('bg-primary-light');
    expect(html).toContain('text-primary-dark');
  });

  it('omits the category chip when categoriaNombre is empty', async () => {
    const html = await render(makeProduct({ categoriaId: 'sin-categoria' }));
    expect(html).not.toContain('bg-primary-light');
  });

  it('renders both CTAs with the correct hrefs', async () => {
    const html = await render();
    expect(html).toContain('href="/cotizacion?producto=flujometro-universal"');
    expect(html).toContain('href="/productos/flujometro-universal"');
    expect(html).toContain('Cotizar');
    expect(html).toContain('Ver detalles');
  });

  it('renders an <img> when galeria has a url', async () => {
    const html = await render(
      makeProduct({ galeria: [{ url: 'https://cdn/x.webp', alt: 'Flujo' }] }),
    );
    expect(html).toContain('<img');
    expect(html).toContain('src="https://cdn/x.webp"');
    expect(html).toContain('alt="Flujo"');
    expect(html).toContain('loading="lazy"');
  });

  it('renders a placeholder icon (no <img>) when galeria is empty', async () => {
    const html = await render(makeProduct({ galeria: [] }));
    expect(html).not.toContain('<img');
    expect(html).toContain('aria-hidden="true"');
  });

  it('uses flat-design tokens (border-border, bg-white) and no rounded* utility', async () => {
    const html = await render();
    expect(html).toContain('border-border');
    expect(html).toContain('bg-white');
    expect(html).not.toMatch(/rounded(?:-(?:sm|md|lg|xl|2xl|3xl|full|none|t|b|l|r|tl|tr|bl|br))?/);
  });

  it('the primary CTA uses bg-primary (not bg-accent)', async () => {
    const html = await render();
    const cotizar = html.match(/<a[^>]*href="\/cotizacion[^"]*"[\s\S]*?<\/a>/)?.[0] ?? '';
    expect(cotizar).toContain('bg-primary');
    expect(cotizar).not.toContain('bg-accent');
  });
});
