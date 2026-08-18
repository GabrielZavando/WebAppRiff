import { describe, it, expect } from 'vitest';
import { toProductCardModel } from '@/lib/products/toProductCardModel';
import type { CategoriaApi, ProductoApi } from '@/lib/types/products-page';

const CATEGORIES: CategoriaApi[] = [
  { id: 'cat-fluidos', nombre: 'Medición de Fluidos', slug: 'medicion-de-fluidos', orden: 1, activa: true },
];

function makeProduct(overrides: Partial<ProductoApi> = {}): ProductoApi {
  return {
    id: overrides.id ?? 'p1',
    sku: overrides.sku ?? 'FLJ-001',
    titulo: overrides.titulo ?? 'Flujómetro Universal',
    slug: overrides.slug ?? 'flujometro-universal',
    descripcionBreve: overrides.descripcionBreve ?? 'Medidor electromagnético.',
    descripcionLarga: overrides.descripcionLarga ?? '<p>Descripción completa.</p>',
    categoriaId: overrides.categoriaId ?? 'cat-fluidos',
    subcategoriaId: overrides.subcategoriaId ?? null,
    galeria: overrides.galeria ?? [],
    atributos: overrides.atributos ?? [],
    fichaTecnica: overrides.fichaTecnica ?? null,
    precio: { valor: 125000, visible: true },
    creadoEn: '2026-01-15T12:00:00.000Z',
    ...overrides,
  };
}

describe('toProductCardModel', () => {
  it('maps a full product with galeria and resolved category', () => {
    const product = makeProduct({
      galeria: [{ url: 'https://cdn.example.com/flj-001.webp', alt: 'Flujómetro' }],
    });
    const model = toProductCardModel(product, { categories: CATEGORIES });
    expect(model.titulo).toBe('Flujómetro Universal');
    expect(model.categoriaId).toBe('cat-fluidos');
    expect(model.subcategoriaId).toBeNull();
    expect(model.categoriaNombre).toBe('Medición de Fluidos');
    expect(model.imageUrl).toBe('https://cdn.example.com/flj-001.webp');
    expect(model.imageAlt).toBe('Flujómetro');
    expect(model.descripcionBreve).toBe('Medidor electromagnético.');
    expect(model.cotizarHref).toBe('/cotizacion?producto=flujometro-universal');
    expect(model.detalleHref).toBe('/productos/flujometro-universal');
  });

  it('falls back to an empty image when galeria is empty', () => {
    const model = toProductCardModel(makeProduct({ galeria: [] }), { categories: CATEGORIES });
    expect(model.imageUrl).toBe('');
    expect(model.imageAlt).toBe('Flujómetro Universal'); // falls back to titulo
  });

  it('returns an empty categoriaNombre when the category is not found', () => {
    const model = toProductCardModel(makeProduct({ categoriaId: 'sin-categoria' }), {
      categories: CATEGORIES,
    });
    expect(model.categoriaNombre).toBe('');
  });

  it('encodes the slug in the cotizar href', () => {
    const model = toProductCardModel(makeProduct({ slug: 'flujo raro' }), { categories: CATEGORIES });
    expect(model.cotizarHref).toBe('/cotizacion?producto=flujo%20raro');
  });

  it('does not emit attribute pairs, COD badge, price or stock', () => {
    const model = toProductCardModel(makeProduct(), { categories: CATEGORIES });
    // The model carries only display fields — no sku, no precio, no atributos.
    expect(model).not.toHaveProperty('sku');
    expect(model).not.toHaveProperty('precio');
    expect(model).not.toHaveProperty('atributos');
  });

  it('strips HTML from descripcionBreve to plain text', () => {
    const model = toProductCardModel(
      makeProduct({ descripcionBreve: '<p>Bold <strong>text</strong> &amp; more</p>' }),
      { categories: CATEGORIES },
    );
    expect(model.descripcionBreve).toBe('Bold text & more');
  });

  it('keeps a plain descripcionBreve unchanged', () => {
    const model = toProductCardModel(makeProduct({ descripcionBreve: 'Medidor simple.' }), {
      categories: CATEGORIES,
    });
    expect(model.descripcionBreve).toBe('Medidor simple.');
  });
});
