## Why

The site is statically generated (Astro SSG) and the public catalog already
lives in the backend (`GET /api/v1/products`, public, returns only
`publicado: true` products). Today, however, `apps/web/src/pages/productos/index.astro`
is a placeholder that says "el catálogo se mostrará aquí". The global
`SearchForm` already navigates here with `?q=...&categoriaId=...` on submit, so
the route exists but renders nothing useful.

Visitors need a real catalog page that:
- Shows the full published product catalog with images, name, category, short
  description and two CTAs (`Cotizar` / `Ver detalles`) to the existing
  `/cotizacion` form and to the future product detail page.
- Lets them narrow by a category selector whose options are the subcategories
  of the selected category (one or more), by search query and by sort order,
  and paginate the result — without per-page-load API calls (SSG already bakes
  the HTML; filtering/pagination happen over the embedded dataset via URL
  params).
- Works with JavaScript disabled (every interaction is a real anchor or a
  `<form method="get">`, mirroring the `SearchForm` progressive-enhancement
  model).

## What Changes

- `pages/productos/index.astro` is rewritten from placeholder to a real catalog
  page with header, filter sidebar, product grid/list, pagination and empty
  state. All filtering and pagination is server-rendered from URL params at
  build time. The header `<h1>` reads `Catálogo de Productos`.
- New build-time data sources (mirroring the existing `lib/api/categories.ts`):
  - `lib/api/products.ts` — fetches `GET /api/v1/products` (public), module-cached,
    safe fallback to `[]` so the build never fails.
  - `lib/api/subcategories.ts` — fetches `GET /api/v1/subcategories?activa=true`,
    module-cached, safe fallback to `[]`.
- New pure helpers (tested in isolation):
  - `lib/products/applyProductFilters.ts` — given the full product list + URL
    params, returns the filtered list and pagination metadata (page, totalPages,
    pageSize).
  - `lib/products/buildPaginationItems.ts` — builds the pagination model
    (`[1, 2, 3, '…', 8]`) given `{ page, totalPages }`.
  - `lib/products/buildProductsPageHref.ts` — builds canonical
    `?q=&categoriaId=&subcategoriaId=&page=&view=` hrefs preserving other params.
  - `lib/products/toProductCardModel.ts` — maps a `ProductoApi` + categories
    list to the `ProductCardModel` consumed by `ProductCard.astro` (image url+alt,
    title, categoriaNombre, descripcionBreve, slug, cotizarHref, detalleHref).
- New presentational components (dumb, props in / slots out, no `fetch` /
  `import.meta.env` in frontmatter — same rule as `SearchForm.astro`):
  - `components/ProductsPageHeader.astro` (title, subtitle, view-mode toggle).
  - `components/ProductsFiltersSidebar.astro` (category `<select>` + conditional
    subcategory `<select multiple>`, submit + limpiar).
  - `components/ProductCard.astro` (grid view card, mobile-first).
  - `components/ProductListItem.astro` (list view row).
  - `components/ProductsPagination.astro`.
  - `components/ProductsEmptyState.astro`.
- New types under `lib/types/products-page.ts`.
- The page is **fully URL-driven**: no client `<script>` block is needed.
  The view-mode toggle is two anchors; the sidebar is a real GET form; the
  pagination is real anchors. Progressive enhancement is preserved trivially
  and the search engines see the filtered/paginated HTML directly.
- `lib/api/products.ts` and `lib/api/subcategories.ts` are consumed only by
  `pages/productos/index.astro` (the home `Layout.astro` is untouched).

## Capabilities

### New Capabilities

- `products-catalog-page`: the public catalog page at `/productos`,
  end-to-end (build-time data sourcing, URL-driven filtering, pagination,
  view toggle, card content, empty state, and the category→subcategory
  sidebar filter pattern).

### Modified Capabilities

_None._

## Impact

- `apps/web/src/pages/productos/index.astro` (rewrite).
- `apps/web/src/lib/api/products.ts` (new), `apps/web/src/lib/api/subcategories.ts` (new).
- `apps/web/src/lib/products/{applyProductFilters,buildPaginationItems,buildProductsPageHref,toProductCardModel}.ts` (new).
- `apps/web/src/lib/types/products-page.ts` (new).
- `apps/web/src/components/{ProductsPageHeader,ProductsFiltersSidebar,ProductCard,ProductListItem,ProductsPagination,ProductsEmptyState}.astro` (new).
- `apps/web/src/components/__tests__/{ProductCard,ProductListItem,ProductsFiltersSidebar,ProductsPagination,ProductsEmptyState,ProductsPageHeader}.test.ts` (new).
- `apps/web/src/lib/products/__tests__/{applyProductFilters,buildPaginationItems,buildProductsPageHref,toProductCardModel}.test.ts` (new).
- `apps/web/src/lib/api/__tests__/{products,subcategories}.test.ts` (new).
- Backend: **unchanged**. `GET /api/v1/products` and
  `GET /api/v1/subcategories` already cover what the page needs.
