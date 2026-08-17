import { describe, it, expect } from 'vitest';
import { buildProductsPageHref } from '@/lib/products/buildProductsPageHref';

describe('buildProductsPageHref', () => {
  it('returns the bare path when every value is default/empty', () => {
    expect(buildProductsPageHref({})).toBe('/productos');
  });

  it('encodes the search query', () => {
    expect(buildProductsPageHref({ q: 'flujometro' })).toBe('/productos?q=flujometro');
  });

  it('preserves categoriaId and page, omitting the default view', () => {
    const href = buildProductsPageHref({
      q: 'flujometro',
      categoriaId: 'cat-fluidos',
      page: 3,
    });
    expect(href).toBe('/productos?q=flujometro&categoriaId=cat-fluidos&page=3');
  });

  it('appends subcategoriaId once per selected value (repeated param)', () => {
    const href = buildProductsPageHref({
      categoriaId: 'cat-fluidos',
      subcategoriaIds: ['sub-caudal', 'sub-presion'],
    });
    expect(href).toBe(
      '/productos?categoriaId=cat-fluidos&subcategoriaId=sub-caudal&subcategoriaId=sub-presion',
    );
  });

  it('encodes special characters in the query', () => {
    const href = buildProductsPageHref({ q: 'agua & aceite' });
    // URLSearchParams uses form-encoding (space -> '+'), consistent with the
    // existing buildSearchHref helper; the page decodes it back to a space.
    expect(href).toBe('/productos?q=agua+%26+aceite');
  });

  it('includes the view param only when it is not the default grid', () => {
    expect(buildProductsPageHref({ view: 'grid' })).toBe('/productos');
    expect(buildProductsPageHref({ view: 'list' })).toBe('/productos?view=list');
  });

  it('omits page=1', () => {
    expect(buildProductsPageHref({ page: 1 })).toBe('/productos');
  });
});
