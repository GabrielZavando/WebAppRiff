/**
 * Page-level content + build configuration for the public products catalog
 * (`/productos`). Centralised here so the page frontmatter stays declarative
 * and the strings are easy to localise or revise.
 */

/** Page size for the catalog grid/list. Overridable via env at build time. */
export const PRODUCTS_PAGE_SIZE: number = (() => {
  const raw = import.meta.env.PRODUCTS_PAGE_SIZE;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 9;
})();

export interface ProductsPageContent {
  readonly titulo: string;
  readonly subtitulo: string;
}

export function getProductsPageContent(): ProductsPageContent {
  return {
    titulo: 'Catálogo de Productos',
    subtitulo:
      'Explora soluciones para medición y tratamiento de fluidos, bombeo y control industrial.',
  };
}
