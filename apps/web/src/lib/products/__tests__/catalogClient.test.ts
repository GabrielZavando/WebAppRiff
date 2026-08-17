import { describe, it, expect } from 'vitest';
import { computeCatalogState } from '@/lib/products/catalogClient';
import { parseProductsPageFilters } from '@/lib/products/parseProductsPageFilters';
import type { ProductoApi } from '@/lib/types/products-page';

function makeProduct(o: Partial<ProductoApi> & Pick<ProductoApi, 'slug' | 'categoriaId'>): ProductoApi {
  return {
    id: o.slug,
    sku: o.sku ?? 'SKU',
    titulo: o.titulo ?? o.slug,
    slug: o.slug,
    descripcionBreve: o.descripcionBreve ?? '',
    categoriaId: o.categoriaId,
    subcategoriaId: o.subcategoriaId ?? null,
    galeria: [],
    precio: { valor: 0, visible: false },
    creadoEn: o.creadoEn ?? '2026-01-01T00:00:00.000Z',
  };
}

const PRODUCTS: ProductoApi[] = [
  makeProduct({ slug: 'a', categoriaId: 'cat-fluidos', subcategoriaId: 'sub-caudal', titulo: 'Flujometro A' }),
  makeProduct({ slug: 'b', categoriaId: 'cat-fluidos', subcategoriaId: 'sub-caudal', titulo: 'Flujometro B' }),
  makeProduct({ slug: 'c', categoriaId: 'cat-fluidos', subcategoriaId: 'sub-presion', titulo: 'Manometro C' }),
  makeProduct({ slug: 'd', categoriaId: 'cat-electrico', subcategoriaId: null, titulo: 'Motor D' }),
  makeProduct({ slug: 'e', categoriaId: 'cat-electrico', subcategoriaId: null, titulo: 'Bomba E' }),
];

function filtersFrom(search: string, pageSize = 9): ReturnType<typeof parseProductsPageFilters> {
  return parseProductsPageFilters(new URLSearchParams(search), pageSize);
}

describe('computeCatalogState (client runtime, pure relay)', () => {
  it('returns every product slug when no filters are applied (page 1 default)', () => {
    const filters = filtersFrom('');
    const state = computeCatalogState(PRODUCTS, filters);
    expect(state.total).toBe(5);
    expect([...state.visibleSlugs].sort()).toEqual(['a', 'b', 'c', 'd', 'e'].sort());
    expect(state.pagination.items.length).toBeGreaterThan(0);
  });

  it('filters by categoriaId and clears the rest outside the category', () => {
    const filters = filtersFrom('categoriaId=cat-fluidos');
    const state = computeCatalogState(PRODUCTS, filters);
    expect(state.total).toBe(3);
    expect([...state.visibleSlugs].sort()).toEqual(['a', 'b', 'c']);
    expect(state.visibleSlugs).not.toContain('d');
  });

  it('filters by subcategory within the category', () => {
    const filters = filtersFrom('categoriaId=cat-fluidos&subcategoriaId=sub-caudal');
    const state = computeCatalogState(PRODUCTS, filters);
    expect(state.total).toBe(2);
    expect([...state.visibleSlugs].sort()).toEqual(['a', 'b']);
  });

  it('filters by free-text query against titulo', () => {
    const filters = filtersFrom('q=flujometro');
    const state = computeCatalogState(PRODUCTS, filters);
    expect([...state.visibleSlugs].sort()).toEqual(['a', 'b']);
  });

  it('paginates: page 2 of 5 products with pageSize 2 shows the last slice', () => {
    const filters = filtersFrom('page=2&pageSize=2');
    const state = computeCatalogState(PRODUCTS, filters);
    expect(state.pagination.totalPages).toBe(3);
    expect(state.visibleSlugs.length).toBe(2);
    expect(state.visibleSlugs).not.toContain('a');
    expect(state.visibleSlugs).not.toContain('b');
  });

  it('honours the view and page in the returned filters snapshot', () => {
    const filters = filtersFrom('view=list&page=1');
    const state = computeCatalogState(PRODUCTS, filters);
    expect(state.filters.view).toBe('list');
    expect(state.filters.page).toBe(1);
  });
});
