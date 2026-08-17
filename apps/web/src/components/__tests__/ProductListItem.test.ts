import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ProductListItem from '@/components/ProductListItem.astro';
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
  return container.renderToString(ProductListItem, {
    props: { product: toProductCardModel(product, { categories: CATEGORIES }) },
  });
}

describe('ProductListItem', () => {
  it('renders an <article> with a horizontal (flex gap) layout', async () => {
    const html = await render();
    expect(html).toContain('<article');
    // The fixed-size thumbnail column is the list-specific marker.
    expect(html).toContain('h-24 w-24');
  });

  it('renders the product title and both CTAs', async () => {
    const html = await render();
    expect(html).toContain('Flujómetro Universal');
    expect(html).toContain('href="/cotizacion?producto=flujometro-universal"');
    expect(html).toContain('href="/productos/flujometro-universal"');
    expect(html).toContain('Cotizar');
    expect(html).toContain('Ver detalles');
  });

  it('renders the category chip when available', async () => {
    const html = await render();
    expect(html).toContain('Medición de Fluidos');
  });

  it('renders an <img> when galeria has a url, placeholder otherwise', async () => {
    const withImg = await render(
      makeProduct({ galeria: [{ url: 'https://cdn/x.webp', alt: 'Flujo' }] }),
    );
    expect(withImg).toContain('<img');
    expect(withImg).toContain('src="https://cdn/x.webp"');

    const without = await render(makeProduct({ galeria: [] }));
    expect(without).not.toContain('<img');
  });

  it('uses flat-design tokens and no rounded* utility', async () => {
    const html = await render();
    expect(html).toContain('border-border');
    expect(html).toContain('bg-white');
    expect(html).not.toMatch(/rounded(?:-(?:sm|md|lg|xl|2xl|3xl|full|none|t|b|l|r|tl|tr|bl|br))?/);
  });
});
