import { describe, it, expect } from 'vitest';
import { applyProductFilters } from '@/lib/products/applyProductFilters';
import type { ProductoApi, ProductsPageFilters } from '@/lib/types/products-page';

function makeProduct(overrides: Partial<ProductoApi>): ProductoApi {
  return {
    id: overrides.id ?? 'p1',
    sku: overrides.sku ?? 'SKU-1',
    titulo: overrides.titulo ?? 'Producto Uno',
    slug: overrides.slug ?? 'producto-uno',
    descripcionBreve: overrides.descripcionBreve ?? 'Descripción corta.',
    categoriaId: overrides.categoriaId ?? 'cat-a',
    subcategoriaId: overrides.subcategoriaId ?? null,
    galeria: overrides.galeria ?? [],
    precio: overrides.precio ?? { valor: 1000, visible: true },
    creadoEn: overrides.creadoEn ?? '2026-01-01T00:00:00.000Z',
  };
}

function baseFilters(overrides: Partial<ProductsPageFilters> = {}): ProductsPageFilters {
  return {
    q: '',
    categoriaId: '',
    subcategoriaIds: [],
    sortBy: 'creadoEn',
    sortDir: 'desc',
    view: 'grid',
    page: 1,
    pageSize: 9,
    ...overrides,
  };
}

const PRODUCTS: ProductoApi[] = [
  makeProduct({ id: '1', titulo: 'Flujometro Alpha', sku: 'FLJ-001', categoriaId: 'cat-fluidos', subcategoriaId: 'sub-caudal', creadoEn: '2026-03-01T00:00:00.000Z' }),
  makeProduct({ id: '2', titulo: 'Manometro Beta', sku: 'MAN-002', categoriaId: 'cat-fluidos', subcategoriaId: 'sub-presion', creadoEn: '2026-02-01T00:00:00.000Z' }),
  makeProduct({ id: '3', titulo: 'Bomba Gamma', sku: 'BOM-003', categoriaId: 'cat-bombas', subcategoriaId: null, creadoEn: '2026-01-01T00:00:00.000Z' }),
];

describe('applyProductFilters — query', () => {
  it('returns all products when no filter is set', () => {
    const { items, pagination } = applyProductFilters(PRODUCTS, baseFilters());
    expect(items).toHaveLength(3);
    expect(pagination.total).toBe(3);
  });

  it('matches q case-insensitively across titulo/sku/descripcion/slug', () => {
    const { items } = applyProductFilters(PRODUCTS, baseFilters({ q: '  flujometro ' }));
    expect(items.map((p) => p.id)).toEqual(['1']);
  });

  it('matches q against sku', () => {
    const { items } = applyProductFilters(PRODUCTS, baseFilters({ q: 'man-002' }));
    expect(items.map((p) => p.id)).toEqual(['2']);
  });

  it('returns empty result set when nothing matches', () => {
    const { items, pagination } = applyProductFilters(PRODUCTS, baseFilters({ q: 'zzz' }));
    expect(items).toHaveLength(0);
    expect(pagination.total).toBe(0);
    expect(pagination.totalPages).toBe(0);
    expect(pagination.page).toBe(1);
  });
});

describe('applyProductFilters — category / subcategory', () => {
  it('filters by exact categoriaId', () => {
    const { items } = applyProductFilters(PRODUCTS, baseFilters({ categoriaId: 'cat-fluidos' }));
    expect(items.map((p) => p.id).sort()).toEqual(['1', '2']);
  });

  it('filters by a single subcategoriaId', () => {
    const { items } = applyProductFilters(
      PRODUCTS,
      baseFilters({ categoriaId: 'cat-fluidos', subcategoriaIds: ['sub-caudal'] }),
    );
    expect(items.map((p) => p.id)).toEqual(['1']);
  });

  it('filters by multiple subcategoriaIds (any-of)', () => {
    const { items } = applyProductFilters(
      PRODUCTS,
      baseFilters({
        categoriaId: 'cat-fluidos',
        subcategoriaIds: ['sub-caudal', 'sub-presion'],
      }),
    );
    expect(items.map((p) => p.id).sort()).toEqual(['1', '2']);
  });

  it('excludes products with null subcategoriaId when a subcategory filter is set', () => {
    const { items } = applyProductFilters(
      PRODUCTS,
      baseFilters({ categoriaId: 'cat-bombas', subcategoriaIds: ['sub-x'] }),
    );
    expect(items).toHaveLength(0);
  });
});

describe('applyProductFilters — sort', () => {
  it('sorts by titulo asc', () => {
    const { items } = applyProductFilters(
      PRODUCTS,
      baseFilters({ sortBy: 'titulo', sortDir: 'asc' }),
    );
    expect(items.map((p) => p.titulo)).toEqual([
      'Bomba Gamma',
      'Flujometro Alpha',
      'Manometro Beta',
    ]);
  });

  it('sorts by precio.valor desc', () => {
    const priced = [
      makeProduct({ id: 'a', precio: { valor: 100, visible: true } }),
      makeProduct({ id: 'b', precio: { valor: 300, visible: true } }),
      makeProduct({ id: 'c', precio: { valor: 200, visible: true } }),
    ];
    const { items } = applyProductFilters(priced, baseFilters({ sortBy: 'precio.valor', sortDir: 'desc' }));
    expect(items.map((p) => p.id)).toEqual(['b', 'c', 'a']);
  });

  it('defaults to creadoEn desc (newest first)', () => {
    const { items } = applyProductFilters(PRODUCTS, baseFilters());
    expect(items.map((p) => p.id)).toEqual(['1', '2', '3']);
  });
});

describe('applyProductFilters — pagination', () => {
  const many = Array.from({ length: 25 }, (_, i) =>
    makeProduct({ id: String(i), titulo: `Item ${i}`, creadoEn: `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z` }),
  );

  it('slices the current page and reports totalPages', () => {
    const { items, pagination } = applyProductFilters(many, baseFilters({ pageSize: 9 }));
    expect(items).toHaveLength(9);
    expect(pagination.total).toBe(25);
    expect(pagination.totalPages).toBe(3);
    expect(pagination.page).toBe(1);
  });

  it('returns the correct slice for page 2', () => {
    const { items, pagination } = applyProductFilters(many, baseFilters({ pageSize: 9, page: 2 }));
    expect(items).toHaveLength(9);
    // Default sort is creadoEn desc, so page 2 starts at the 10th newest
    // (id '15' has the 10th-latest date in the fixture).
    expect(items[0].id).toBe('15');
    expect(pagination.page).toBe(2);
  });

  it('clamps an out-of-range page to the last page', () => {
    const { items, pagination } = applyProductFilters(many, baseFilters({ pageSize: 9, page: 99 }));
    expect(pagination.page).toBe(3);
    expect(items).toHaveLength(25 - 18); // 25 - 2*9 = 7
  });
});
