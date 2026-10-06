import { describe, it, expect, vi, afterEach } from 'vitest';
import { computeCatalogState, initCatalog } from '@/lib/products/catalogClient';
import { parseProductsPageFilters } from '@/lib/products/parseProductsPageFilters';
import type { ProductoApi } from '@/lib/types/products-page';

function makeProduct(o: Partial<ProductoApi> & Pick<ProductoApi, 'slug' | 'categoriaId'>): ProductoApi {
  return {
    id: o.slug,
    sku: o.sku ?? 'SKU',
    titulo: o.titulo ?? o.slug,
    slug: o.slug,
    descripcionBreve: o.descripcionBreve ?? '',
    descripcionLarga: o.descripcionLarga ?? '',
    categoriaId: o.categoriaId,
    subcategoriaId: o.subcategoriaId ?? null,
    galeria: [],
    atributos: [],
    fichaTecnica: null,
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

interface AnchorStub {
  getAttribute(name: string): string | null;
  addEventListener(
    type: string,
    handler: (event: { preventDefault: () => void }) => void,
  ): void;
  click(event: { preventDefault: () => void }): void;
}

function createAnchor(href: string): AnchorStub {
  let handler: ((event: { preventDefault: () => void }) => void) | undefined;
  return {
    getAttribute: (name) => (name === 'href' ? href : null),
    addEventListener: (_type, cb) => {
      handler = cb;
    },
    click: (event) => {
      if (handler) handler(event);
    },
  };
}

function parseAnchorHrefs(html: string): AnchorStub[] {
  const anchors: AnchorStub[] = [];
  const re = /<a[^>]*href="([^"]*)"[^>]*>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    anchors.push(createAnchor(match[1] ?? ''));
  }
  return anchors;
}

describe('initCatalog — pagination scroll to top (DOM glue, node env fakes)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function setup(search: string) {
    // 20 products -> pageSize 9 -> 3 pages, so pagination anchors render.
    const slugs = Array.from(
      { length: 20 },
      (_, i) => `p${String(i + 1).padStart(2, '0')}`,
    );
    const products = slugs.map((slug) =>
      makeProduct({
        slug,
        categoriaId: 'cat-fluidos',
        titulo: `Flujometro ${slug}`,
      }),
    );

    const gridCards = slugs.map((slug) => ({
      getAttribute: (name: string) => (name === 'data-product-id' ? slug : null),
      classList: { toggle: vi.fn() },
    }));
    const gridEl = {
      querySelectorAll: (selector: string) =>
        selector === '.catalog-card' ? gridCards : [],
      classList: { toggle: vi.fn() },
    };

    let anchors: AnchorStub[] = [];
    const paginationEl = {
      get innerHTML() {
        return '';
      },
      set innerHTML(value: string) {
        anchors = parseAnchorHrefs(value);
      },
      querySelectorAll: (selector: string) =>
        selector === 'a[href]' ? anchors : [],
    };

    const emptyEl = { classList: { toggle: vi.fn() } };
    const totalEl = { textContent: '' };
    const dataEl = {
      textContent: JSON.stringify({ products, categories: [], subcategorias: [] }),
    };

    const pushedUrls: string[] = [];
    const scrollTo = vi.fn();

    vi.stubGlobal(
      'document',
      {
        getElementById: (id: string) =>
          (
            {
              'catalog-data': dataEl,
              'catalog-grid': gridEl,
              'catalog-pagination': paginationEl,
              'catalog-empty': emptyEl,
              'catalog-total': totalEl,
              'products-filter-form': null,
            } as Record<string, unknown>
          )[id] ?? null,
        querySelectorAll: () => [],
      },
    );
    vi.stubGlobal('window', {
      location: { search },
      scrollTo,
      addEventListener: vi.fn(),
    });
    vi.stubGlobal('history', {
      pushState: (_state: null, _title: string, url: string) => {
        pushedUrls.push(url);
      },
    });

    return { paginationEl, scrollTo, pushedUrls, gridEl };
  }

  it('scrolls the window to the top after a page change, preserving active filters', () => {
    const { paginationEl, scrollTo, pushedUrls } = setup(
      '?q=flujometro&categoriaId=cat-fluidos',
    );
    initCatalog();

    const anchors = paginationEl.querySelectorAll('a[href]') as unknown as AnchorStub[];
    const page2 = anchors.find((a) => a.getAttribute('href')?.includes('page=2'));
    expect(page2, 'pagination anchor for page 2').toBeTruthy();

    page2!.click({ preventDefault: vi.fn() });

    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    expect(pushedUrls).toContain(
      '/productos?q=flujometro&categoriaId=cat-fluidos&page=2',
    );
  });

  it('scrolls to the top when using the "siguiente" chevron too', () => {
    const { paginationEl, scrollTo, pushedUrls } = setup('');
    initCatalog();

    const anchors = paginationEl.querySelectorAll('a[href]') as unknown as AnchorStub[];
    const next = anchors.find(
      (a) => a.getAttribute('href')?.includes('page=2') && !a.getAttribute('href')?.includes('page=1'),
    );
    expect(next, 'next-page anchor').toBeTruthy();

    next!.click({ preventDefault: vi.fn() });

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    expect(pushedUrls).toContain('/productos?page=2');
  });
});
