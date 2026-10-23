import { describe, it, expect, expectTypeOf } from 'vitest';
import type { FeaturedProduct } from '@/lib/types/destacados-section';
import type { ProductoCardApi } from '@/lib/types/products-page';
import { toFeaturedProduct } from '@/lib/products/toFeaturedProduct';

/**
 * Pure mapping from a backend featured card (`ProductoCardApi`) to the
 * section card model (`FeaturedProduct`). See the delta spec of
 * `home-featured-products-grid` (ADDED requirement "Los productos destacados
 * del backend se mapean al modelo de tarjeta de la sección") and design.md
 * § Decision 3.
 */

/** Minimal card fixture with a gallery entry carrying url + alt. */
const CARD_WITH_GALLERY: ProductoCardApi = {
  id: 'medidor-electromagnetico-fullmag-ha',
  sku: 'FHM-100',
  titulo: 'Medidor Electromagnético Fullmag HA',
  slug: 'medidor-electromagnetico-fullmag-ha',
  descripcionBreve: 'Medidor electromagnético para caudal.',
  categoriaId: 'cat-fluidos',
  subcategoriaId: 'sub-caudal',
  galeria: [
    {
      url: 'https://storage.googleapis.com/riff/fullmag-ha.webp',
      alt: 'Medidor Fullmag HA sobre fondo blanco',
    },
  ],
  precio: { valor: 1000, visible: false },
  creadoEn: '2026-03-01T10:00:00.000Z',
};

describe('toFeaturedProduct', () => {
  it('maps id, titulo and slug verbatim from the backend card', () => {
    const model = toFeaturedProduct(CARD_WITH_GALLERY);
    expect(model.id).toBe('medidor-electromagnetico-fullmag-ha');
    expect(model.titulo).toBe('Medidor Electromagnético Fullmag HA');
    expect(model.slug).toBe('medidor-electromagnetico-fullmag-ha');
  });

  it('takes imageUrl and imagenAlt from the first gallery entry', () => {
    const model = toFeaturedProduct(CARD_WITH_GALLERY);
    expect(model.imageUrl).toBe(
      'https://storage.googleapis.com/riff/fullmag-ha.webp',
    );
    expect(model.imagenAlt).toBe('Medidor Fullmag HA sobre fondo blanco');
  });

  it('falls back to imageUrl="" and imagenAlt=titulo when the gallery is empty', () => {
    const model = toFeaturedProduct({ ...CARD_WITH_GALLERY, galeria: [] });
    expect(model.imageUrl).toBe('');
    expect(model.imagenAlt).toBe('Medidor Electromagnético Fullmag HA');
  });

  it('falls back to imagenAlt=titulo when the gallery alt is empty', () => {
    const model = toFeaturedProduct({
      ...CARD_WITH_GALLERY,
      galeria: [{ url: 'https://storage.googleapis.com/riff/fullmag-ha.webp', alt: '' }],
    });
    expect(model.imageUrl).toBe(
      'https://storage.googleapis.com/riff/fullmag-ha.webp',
    );
    expect(model.imagenAlt).toBe('Medidor Electromagnético Fullmag HA');
  });

  it('exposes NO price fields and NO local assets reference', () => {
    const model: FeaturedProduct = toFeaturedProduct(CARD_WITH_GALLERY);
    expect(model).not.toHaveProperty('precio');
    expect(model).not.toHaveProperty('price');
    expect(model).not.toHaveProperty('precioVisible');
    expect(model).not.toHaveProperty('imagen');
    expectTypeOf<FeaturedProduct>().toEqualTypeOf<{
      readonly id: string;
      readonly titulo: string;
      readonly slug: string;
      readonly imageUrl: string;
      readonly imagenAlt: string;
    }>();
  });
});
