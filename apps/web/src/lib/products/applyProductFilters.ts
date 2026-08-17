import type { ProductoApi, ProductsPageFilters, PaginationModel } from '@/lib/types/products-page';
import { buildPaginationItems } from '@/lib/products/buildPaginationItems';

export interface ApplyResult {
  readonly items: readonly ProductoApi[];
  readonly pagination: PaginationModel;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function matchesQuery(product: ProductoApi, q: string): boolean {
  const needle = normalize(q);
  if (needle === '') return true;
  const haystack = [product.titulo, product.descripcionBreve, product.sku, product.slug]
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}

function compareValue(
  product: ProductoApi,
  sortBy: ProductsPageFilters['sortBy'],
): string | number {
  switch (sortBy) {
    case 'titulo':
      return product.titulo;
    case 'precio.valor':
      return product.precio.valor;
    case 'creadoEn':
    default:
      return product.creadoEn;
  }
}

/**
 * Filters, sorts and paginates the public product list entirely in memory.
 *
 * Pure and deterministic: given the same products + filters it always returns
 * the same result, which is what makes the catalog page URL-driven and
 * testable without a browser. The products are baked at build time (see
 * `lib/api/products.ts`) and this helper is the single source of truth for
 * what the page renders.
 */
export function applyProductFilters(
  products: readonly ProductoApi[],
  filters: ProductsPageFilters,
): ApplyResult {
  const filtered = products.filter((product) => {
    if (!matchesQuery(product, filters.q)) return false;
    if (filters.categoriaId !== '' && product.categoriaId !== filters.categoriaId) {
      return false;
    }
    if (
      filters.subcategoriaIds.length > 0 &&
      (product.subcategoriaId === null ||
        !filters.subcategoriaIds.includes(product.subcategoriaId))
    ) {
      return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const av = compareValue(a, filters.sortBy);
    const bv = compareValue(b, filters.sortBy);
    let cmp: number;
    if (typeof av === 'number' && typeof bv === 'number') {
      cmp = av - bv;
    } else {
      cmp = String(av).localeCompare(String(bv), 'es');
    }
    return filters.sortDir === 'asc' ? cmp : -cmp;
  });

  const total = sorted.length;
  const totalPages = total === 0 ? 0 : Math.max(1, Math.ceil(total / filters.pageSize));
  const currentPage = Math.min(Math.max(1, filters.page), totalPages || 1);
  const start = (currentPage - 1) * filters.pageSize;
  const items = sorted.slice(start, start + filters.pageSize);

  const pagination: PaginationModel = {
    page: currentPage,
    pageSize: filters.pageSize,
    total,
    totalPages,
    items: buildPaginationItems(currentPage, totalPages),
  };

  return { items, pagination };
}
