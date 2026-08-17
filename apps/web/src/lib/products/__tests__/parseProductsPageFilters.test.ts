import { describe, it, expect } from 'vitest';
import { parseProductsPageFilters } from '@/lib/products/parseProductsPageFilters';

function params(init: Record<string, string | string[]>): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(init)) {
    if (Array.isArray(value)) {
      value.forEach((v) => sp.append(key, v));
    } else {
      sp.set(key, value);
    }
  }
  return sp;
}

describe('parseProductsPageFilters', () => {
  it('returns safe defaults for an empty param set', () => {
    const filters = parseProductsPageFilters(new URLSearchParams(), 9);
    expect(filters).toEqual({
      q: '',
      categoriaId: '',
      subcategoriaIds: [],
      sortBy: 'creadoEn',
      sortDir: 'desc',
      view: 'grid',
      page: 1,
      pageSize: 9,
    });
  });

  it('reads q, categoriaId and a single view value', () => {
    const filters = parseProductsPageFilters(
      params({ q: 'flujometro', categoriaId: 'cat-fluidos', view: 'list' }),
      9,
    );
    expect(filters.q).toBe('flujometro');
    expect(filters.categoriaId).toBe('cat-fluidos');
    expect(filters.view).toBe('list');
  });

  it('collects repeated subcategoriaId params into an array', () => {
    const filters = parseProductsPageFilters(
      params({ subcategoriaId: ['sub-a', 'sub-b'] }),
      9,
    );
    expect(filters.subcategoriaIds).toEqual(['sub-a', 'sub-b']);
  });

  it('normalizes an unknown view to grid', () => {
    const filters = parseProductsPageFilters(params({ view: 'carousel' }), 9);
    expect(filters.view).toBe('grid');
  });

  it('parses sortBy and sortDir with safe fallbacks', () => {
    const ok = parseProductsPageFilters(
      params({ sortBy: 'titulo', sortDir: 'asc' }),
      9,
    );
    expect(ok.sortBy).toBe('titulo');
    expect(ok.sortDir).toBe('asc');

    const bad = parseProductsPageFilters(
      params({ sortBy: 'magico', sortDir: 'sideways' }),
      9,
    );
    expect(bad.sortBy).toBe('creadoEn');
    expect(bad.sortDir).toBe('desc');
  });

  it('parses a positive integer page and clamps garbage to 1', () => {
    expect(parseProductsPageFilters(params({ page: '3' }), 9).page).toBe(3);
    expect(parseProductsPageFilters(params({ page: '0' }), 9).page).toBe(1);
    expect(parseProductsPageFilters(params({ page: '-2' }), 9).page).toBe(1);
    expect(parseProductsPageFilters(params({ page: 'abc' }), 9).page).toBe(1);
    expect(parseProductsPageFilters(params({ page: '2.9' }), 9).page).toBe(2);
  });

  it('uses a custom default pageSize and honors a valid pageSize override', () => {
    expect(parseProductsPageFilters(new URLSearchParams(), 12).pageSize).toBe(12);
    expect(parseProductsPageFilters(params({ pageSize: '24' }), 9).pageSize).toBe(24);
    expect(parseProductsPageFilters(params({ pageSize: '0' }), 9).pageSize).toBe(9);
  });

  it('trims whitespace from q, categoriaId and subcategoriaIds', () => {
    const filters = parseProductsPageFilters(
      params({ q: '  flujo ', categoriaId: ' cat-x ', subcategoriaId: [' sub-1 ', '  '] }),
      9,
    );
    expect(filters.q).toBe('flujo');
    expect(filters.categoriaId).toBe('cat-x');
    expect(filters.subcategoriaIds).toEqual(['sub-1']);
  });
});
