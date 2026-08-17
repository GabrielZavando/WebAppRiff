import { describe, it, expect } from 'vitest';
import { toProductDetailModel } from '@/lib/products/toProductDetailModel';
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
    descripcionLarga: overrides.descripcionLarga ?? '<p>Descripción larga.</p>',
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

describe('toProductDetailModel', () => {
  it('maps a full product with gallery, attributes and technical doc', () => {
    const product = makeProduct({
      galeria: [{ url: 'https://cdn/x.webp', alt: 'Flujo' }],
      atributos: [{ nombre: 'Precisión', valor: '±2%' }],
      fichaTecnica: { url: 'https://cdn/c.pdf', storagePath: 'p/c.pdf', nombreArchivo: 'catalogo.pdf' },
    });
    const model = toProductDetailModel(product, { categories: CATEGORIES });
    expect(model.id).toBe('p1');
    expect(model.titulo).toBe('Flujómetro Universal');
    expect(model.descripcionLarga).toBe('<p>Descripción larga.</p>');
    expect(model.categoriaId).toBe('cat-fluidos');
    expect(model.categoriaNombre).toBe('Medición de Fluidos');
    expect(model.galeria).toHaveLength(1);
    expect(model.galeria[0]!.url).toBe('https://cdn/x.webp');
    expect(model.atributos).toHaveLength(1);
    expect(model.atributos[0]!.nombre).toBe('Precisión');
    expect(model.fichaTecnica?.nombreArchivo).toBe('catalogo.pdf');
    expect(model.cotizarHref).toBe('/cotizacion?producto=flujometro-universal');
  });

  it('resolves an empty categoriaNombre when the category is not found', () => {
    const model = toProductDetailModel(makeProduct({ categoriaId: 'sin-categoria' }), {
      categories: CATEGORIES,
    });
    expect(model.categoriaNombre).toBe('');
  });

  it('allows empty galeria, atributos and null fichaTecnica', () => {
    const model = toProductDetailModel(makeProduct({ galeria: [], atributos: [], fichaTecnica: null }), {
      categories: CATEGORIES,
    });
    expect(model.galeria).toHaveLength(0);
    expect(model.atributos).toHaveLength(0);
    expect(model.fichaTecnica).toBeNull();
  });

  it('encodes the slug in the cotizar href', () => {
    const model = toProductDetailModel(makeProduct({ slug: 'flujo raro' }), { categories: CATEGORIES });
    expect(model.cotizarHref).toBe('/cotizacion?producto=flujo%20raro');
  });
});
