import type {
  CategoriaApi,
  PaginationModel,
  ProductoApi,
  ProductsPageFilters,
  SubcategoriaApi,
} from '@/lib/types/products-page';
import { applyProductFilters } from '@/lib/products/applyProductFilters';
import { buildProductsPageHref, type ProductsPageHrefParams } from '@/lib/products/buildProductsPageHref';
import { parseProductsPageFilters } from '@/lib/products/parseProductsPageFilters';
import { PRODUCTS_PAGE_SIZE } from '@/lib/config/products';

/** Shape of the JSON blob baked into the page as `#catalog-data`. */
export interface CatalogData {
  readonly products: readonly ProductoApi[];
  readonly categories: readonly CategoriaApi[];
  readonly subcategorias: readonly SubcategoriaApi[];
}

/** Computed view-state for the client runtime (pure, no DOM). */
export interface CatalogState {
  readonly visibleSlugs: readonly string[];
  readonly total: number;
  readonly pagination: PaginationModel;
  readonly filters: ProductsPageFilters;
}

/**
 * Single source of truth for what the page shows. Reuses `applyProductFilters`
 * (already unit-tested) so the client runtime and the build-time render never
 * diverge. Returns the set of slugs visible on the current page plus the
 * pagination metadata and a snapshot of the active filters.
 */
export function computeCatalogState(
  products: readonly ProductoApi[],
  filters: ProductsPageFilters,
): CatalogState {
  const { items, pagination } = applyProductFilters(products, filters);
  return {
    visibleSlugs: items.map((p) => p.slug),
    total: pagination.total,
    pagination,
    filters,
  };
}

const CHEVRON_LEFT = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
const CHEVRON_RIGHT = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
const BASE_CONTROL = 'inline-flex h-9 w-9 items-center justify-center text-sm font-medium';

function filtersToHrefParams(filters: ProductsPageFilters): ProductsPageHrefParams {
  return {
    q: filters.q,
    categoriaId: filters.categoriaId,
    subcategoriaIds: filters.subcategoriaIds,
    view: filters.view,
    page: filters.page,
  };
}

/** Builds the pagination `<nav>` HTML, mirroring `ProductsPagination.astro`. */
function renderPaginationHtml(
  pagination: PaginationModel,
  filters: ProductsPageFilters,
): string {
  const { items, page, totalPages } = pagination;
  if (totalPages <= 1) return '';

  const hrefFor = (targetPage: number) =>
    buildProductsPageHref({ ...filtersToHrefParams(filters), page: targetPage });

  const prev =
    page > 1
      ? `<a href="${hrefFor(page - 1)}" class="${BASE_CONTROL} text-text-2 hover:text-primary" aria-label="Página anterior">${CHEVRON_LEFT}</a>`
      : `<span aria-disabled="true" class="${BASE_CONTROL} text-muted" aria-label="Página anterior">${CHEVRON_LEFT}</span>`;

  const body = items
    .map((item) => {
      if (item === '…') {
        return `<span aria-hidden="true" class="${BASE_CONTROL} text-muted">…</span>`;
      }
      const isActive = item === page;
      const cls = isActive
        ? `${BASE_CONTROL} bg-primary text-white`
        : `${BASE_CONTROL} text-text-2 hover:text-primary`;
      const ariaCurrent = isActive ? ' aria-current="page"' : '';
      return `<a href="${hrefFor(item)}"${ariaCurrent} class="${cls}">${item}</a>`;
    })
    .join('');

  const next =
    page < totalPages
      ? `<a href="${hrefFor(page + 1)}" class="${BASE_CONTROL} text-text-2 hover:text-primary" aria-label="Página siguiente">${CHEVRON_RIGHT}</a>`
      : `<span aria-disabled="true" class="${BASE_CONTROL} text-muted" aria-label="Página siguiente">${CHEVRON_RIGHT}</span>`;

  return `<nav aria-label="Paginación de productos" class="flex items-center justify-center gap-1">${prev}${body}${next}</nav>`;
}

/**
 * Wires the static catalog to the URL via the History API. Progressive
 * enhancement: the no-JS fallback keeps the unfiltered static HTML + the
 * sidebar GET form; with JS, filters/pagination/view changes apply instantly
 * without a full navigation.
 *
 * Not unit-tested (DOM glue); the pure `computeCatalogState` above is.
 */
export function initCatalog(): void {
  if (typeof document === 'undefined') return;

  const dataEl = document.getElementById('catalog-data');
  const grid = document.getElementById('catalog-grid');
  const paginationEl = document.getElementById('catalog-pagination');
  const emptyEl = document.getElementById('catalog-empty');
  const totalEl = document.getElementById('catalog-total');
  const form = document.getElementById('products-filter-form') as HTMLFormElement | null;

  if (!dataEl || !grid) return;

  let data: CatalogData;
  try {
    data = JSON.parse(dataEl.textContent ?? '{}') as CatalogData;
  } catch {
    return;
  }
  const products = data.products ?? [];

  // Capture non-null references: TS does not preserve the early-return narrowing
  // inside nested function declarations, so we pin explicit non-null locals.
  const gridEl: HTMLElement = grid;
  const paginationElLocal: HTMLElement | null = paginationEl;
  const emptyElLocal: HTMLElement | null = emptyEl;
  const totalElLocal: HTMLElement | null = totalEl;

  function renderFromSearch(search: string): void {
    const filters = parseProductsPageFilters(new URLSearchParams(search), PRODUCTS_PAGE_SIZE);
    const state = computeCatalogState(products, filters);

    // Show only the cards on the current page.
    const visible = new Set(state.visibleSlugs);
    const cards = gridEl.querySelectorAll<HTMLElement>('.catalog-card');
    cards.forEach((card) => {
      const id = card.getAttribute('data-product-id') ?? '';
      card.classList.toggle('hidden', !visible.has(id));
    });

    if (totalElLocal) totalElLocal.textContent = String(state.total);

    if (emptyElLocal) {
      emptyElLocal.classList.toggle('hidden', state.total !== 0);
    }

    if (paginationElLocal) {
      paginationElLocal.innerHTML = renderPaginationHtml(state.pagination, filters);
      paginationElLocal.querySelectorAll('a[href]').forEach((link) => {
        link.addEventListener('click', (event) => {
          event.preventDefault();
          const href = (link as HTMLAnchorElement).getAttribute('href') ?? '';
          const pageSearch = href.includes('?') ? href.slice(href.indexOf('?') + 1) : '';
          history.pushState(null, '', href);
          renderFromSearch(pageSearch);
        });
      });
    }

    gridEl.classList.toggle('catalog-list-mode', filters.view === 'list');

    if (form) syncSidebar(form, filters);
  }

  function syncSidebar(formEl: HTMLFormElement, filters: ProductsPageFilters): void {
    const select = formEl.querySelector<HTMLSelectElement>('select[name="categoriaId"]');
    if (select && filters.categoriaId) select.value = filters.categoriaId;

    const groups = formEl.querySelectorAll<HTMLElement>('fieldset[data-categoria-id]');
    groups.forEach((group) => {
      const matches = group.getAttribute('data-categoria-id') === filters.categoriaId;
      group.classList.toggle('hidden', !matches);
      group
        .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
        .forEach((box) => {
          box.disabled = !matches;
          box.checked = matches && filters.subcategoriaIds.includes(box.value);
        });
    });

    document
      .querySelectorAll<HTMLElement>('[data-view-toggle]')
      .forEach((btn) => {
        const isActive = btn.getAttribute('data-view-toggle') === filters.view;
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
  }

  function pushAndRender(patch: ProductsPageHrefParams): void {
    const current = parseProductsPageFilters(
      new URLSearchParams(window.location.search),
      PRODUCTS_PAGE_SIZE,
    );
    const merged: ProductsPageHrefParams = {
      q: patch.q ?? current.q,
      categoriaId: patch.categoriaId ?? current.categoriaId,
      subcategoriaIds: patch.subcategoriaIds ?? current.subcategoriaIds,
      view: patch.view ?? current.view,
      page: patch.page ?? current.page,
    };
    const href = buildProductsPageHref(merged);
    history.pushState(null, '', href);
    renderFromSearch(href.includes('?') ? href.slice(href.indexOf('?') + 1) : '');
  }

  if (form) {
    form.addEventListener('submit', (event) => event.preventDefault());

    const select = form.querySelector<HTMLSelectElement>('select[name="categoriaId"]');
    select?.addEventListener('change', () => {
      pushAndRender({ categoriaId: select.value, subcategoriaIds: [], page: 1 });
    });

    form.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name="subcategoriaId"]').forEach((box) => {
      box.addEventListener('change', () => {
        const checked = Array.from(
          form.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name="subcategoriaId"]:checked'),
        ).map((b) => b.value);
        pushAndRender({ subcategoriaIds: checked, page: 1 });
      });
    });
  }

  // View toggle lives in the header (outside the form) — wire it at document level.
  document.querySelectorAll<HTMLElement>('[data-view-toggle]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      const view = btn.getAttribute('data-view-toggle') === 'list' ? 'list' : 'grid';
      pushAndRender({ view });
    });
  });

  window.addEventListener('popstate', () => {
    renderFromSearch(window.location.search);
  });

  renderFromSearch(window.location.search);
}
