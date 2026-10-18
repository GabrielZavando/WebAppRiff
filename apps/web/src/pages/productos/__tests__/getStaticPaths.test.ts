import { describe, it, expect, vi } from 'vitest';

const PRODUCTS = Array.from({ length: 70 }, (_, i) => ({
  id: `p${i}`,
  sku: `SKU-${i}`,
  titulo: `Producto ${i}`,
  slug: `producto-${i}`,
  descripcionBreve: 'Descripción corta.',
  descripcionLarga: '<p>Descripción larga.</p>',
  categoriaId: 'cat-fluidos',
  subcategoriaId: null,
  galeria: [],
  atributos: [],
  fichaTecnica: null,
  precio: { valor: 1000 + i, visible: true },
  creadoEn: '2026-01-15T12:00:00.000Z',
}));

vi.mock('@/lib/api/products', () => ({
  getPublicProducts: vi.fn(async () => PRODUCTS),
  getProductBySlug: vi.fn(async () => null),
}));

vi.mock('@/lib/api/categories', () => ({
  getCategorias: vi.fn(async () => []),
}));

import * as ProductPageModule from '@/pages/productos/[slug].astro';

type StaticPath = { params: { slug: string } };

// Astro's `*.astro` ambient module only declares the default component export, so
// reach the named `getStaticPaths` export through an explicit typed cast.
const getStaticPaths = (ProductPageModule as unknown as {
  getStaticPaths: () => Promise<StaticPath[]>;
}).getStaticPaths;

describe('product detail getStaticPaths', () => {
  it('generates one route per published product beyond the API default limit of 24', async () => {
    const paths = await getStaticPaths();
    const slugs = paths.map((path) => path.params.slug);
    expect(paths).toHaveLength(70);
    expect(slugs).toContain('producto-69');
  });
});
