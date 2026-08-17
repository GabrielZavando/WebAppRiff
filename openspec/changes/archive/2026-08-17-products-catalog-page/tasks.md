## 1. Types and pure helpers (TDD)

- [x] 1.1 Write `lib/types/__tests__/products-page.test.ts` defining the shapes:
      `ProductoApi`, `ProductCardModel`, `ProductsPageFilters`, `PaginationModel`,
      `ViewMode`, `SubcategoriaApi`, `CategoriaApi`. Then implement
      `lib/types/products-page.ts` to satisfy the tests.
- [x] 1.2 Write `lib/products/__tests__/applyProductFilters.test.ts` covering:
      empty `q`/no filters returns all; `q` is trimmed + case-insensitive,
      matches `titulo`/`descripcionBreve`/`sku`/`slug`; `categoriaId` exact
      match; `subcategoriaId` multi-select (any-of); sort by `titulo`,
      `precio.valor`, `creadoEn` asc/desc; default sort newest-first;
      pagination slices correctly; empty result set still returns valid
      `pagination` (`total=0`, `totalPages=0`). THEN implement
      `lib/products/applyProductFilters.ts`.
- [x] 1.3 Write `lib/products/__tests__/buildPaginationItems.test.ts`:
      produces `[1]` when 1 page; `[1, 2]` for 2; `[1, 2, 3, '…', 8]` for 8
      pages current=1; includes current ± 1; omits ellipsis when contiguous.
      THEN implement `lib/products/buildPaginationItems.ts`.
- [x] 1.4 Write `lib/products/__tests__/buildProductsPageHref.test.ts`:
      preserves unspecified params; omits empty values; encodes special chars
      in `q`; produces `/productos` when everything is empty. THEN implement
      `lib/products/buildProductsPageHref.ts`.
- [x] 1.5 Write `lib/products/__tests__/toProductCardModel.test.ts`: maps
      `galeria[0]` → image (with `imageAlt`), resolves `categoriaNombre` from
      the provided categories list, returns `categoriaNombre: ''` when not
      found (e.g. `sin-categoria`), formats the slug-based hrefs
      (`/cotizacion?producto=<slug>` and `/productos/<slug>`), fills
      `placeholderImage` fallback when `galeria` is empty, and does NOT emit
      attribute pairs, the COD badge, price or stock (explicit non-goals for
      the card). THEN implement `lib/products/toProductCardModel.ts`
      (accepts `{ categories }`).

## 2. Build-time data sources (TDD)

- [x] 2.1 Write `lib/api/__tests__/products.test.ts`: on success returns the
      `data` array; module cache hits the API exactly once across multiple
      calls; on non-2xx response throws and the fallback returns `[]`; on
      network error, returns `[]`; respects `NESTJS_API_URL` override. THEN
      implement `lib/api/products.ts` mirroring the `categories.ts` pattern.
- [x] 2.2 Write `lib/api/__tests__/subcategories.test.ts`: analogous tests for
      `GET /api/v1/subcategories?activa=true` and the `?categoriaId=`
      filter (server-side). THEN implement `lib/api/subcategories.ts`.

## 3. Presentational components (TDD, mirrors SearchForm/DestacadosSection)

- [x] 3.1 Write `components/__tests__/ProductCard.test.ts`: renders image
       (with `alt`, `loading="lazy"`, fixed aspect ratio), title, category chip
       with the resolved category name, `descripcionBreve` truncated to ~3 lines,
       and TWO CTAs side by side (always): `Cotizar` → `/cotizacion?producto=<slug>`
       (primary) and `Ver detalles` → `/productos/<slug>` (secondary). No "COD:"
       badge, attribute mini-grid, price block or stock badge. No `rounded-*` /
       no hex literals. THEN implement `components/ProductCard.astro`.
- [x] 3.2 Write `components/__tests__/ProductListItem.test.ts`: renders the
       horizontal-row layout (image left, content right); same data assertions
       as 3.1. THEN implement `components/ProductListItem.astro`.
- [x] 3.3 Write `components/__tests__/ProductsPagination.test.ts`: renders
       prev/next chevrons (`lucide:chevron-left` / `lucide:chevron-right` — no
       "Anterior"/"Siguiente" text labels per `ProductsPage.png`) + numeric
       items; ellipsis appears correctly; current item has `aria-current="page"`
       and `bg-primary text-white` (no bottom-border indicator — solo fondo,
       per design decision); prev/next disabled at boundaries with
       `aria-disabled`; each numeric anchor preserves `q`/`categoriaId`/
       `subcategoriaId`/`view` via `buildProductsPageHref`. THEN implement
       `components/ProductsPagination.astro`.
- [x] 3.4 Write `components/__tests__/ProductsFiltersSidebar.test.ts`:
       - Renders a `"FILTRO DE BÚSQUEDA"` title (uppercase) with a divider line
         (`border-b border-border`) directly beneath it, at the top of the form.
       - Renders a `"Categorías"` label followed by a category
         `<select name="categoriaId">` whose options come from the `categories`
         prop (with the "Todas las categorías" default first).
       - When `filters.categoriaId` is empty, the subcategory checkboxes are
         NOT rendered.
       - When `filters.categoriaId` is set but the category has NO subcategories,
         the subcategory checkboxes are NOT rendered.
       - When `filters.categoriaId` is set AND the category has subcategories,
         the **complete list** of subcategories of that category is rendered as
         `<input type="checkbox" name="subcategoriaId">` directly below the
         category `<select>` (multi-select via checkboxes, matching the reference
         image's "Tipo de Medición" list — deviation from the original
         `<select multiple>` wording in the spec text).
       - Hidden inputs preserve `q` and `view`.
       - Submit button "Aplicar filtros" + "Limpiar filtros" link that drops
         category/subcategory but keeps `q`.
       - Form is `<form method="get" action="/productos">`.
       - Checked subcategories mirror `filters.subcategoriaIds`.
       THEN implement `components/ProductsFiltersSidebar.astro`.
- [x] 3.5 Write `components/__tests__/ProductsPageHeader.test.ts`: renders
       `<h1>Catálogo de Productos</h1>` + the subtitle + total count, and the
       view-toggle group with two anchors; the active view has `aria-pressed="true"`;
       uses `lucide:layout-grid` and `lucide:list`. THEN implement
       `components/ProductsPageHeader.astro`.
- [x] 3.6 Write `components/__tests__/ProductsEmptyState.test.ts`: renders the
       no-results message and a "Limpiar filtros" anchor to the clear href. THEN
       implement `components/ProductsEmptyState.astro`.

## 4. Page wiring

- [x] 4.1 Rewrite `pages/productos/index.astro`: in frontmatter, fetch products
       + subcategories + categories at build time (module cache). Render the
       Layout (no `hero`), `ProductsPageHeader` (total renders as a placeholder
       updated by JS), a two-column container (`lg:grid-cols-[260px_1fr]`) with
       `ProductsFiltersSidebar` (stacked ABOVE the results on mobile, left
       column on `lg+` — deviation from the original `<details>` wording) and the
       results area. The results area renders **all** products as `ProductCard`
       components (unfiltered, for progressive-enhancement + so the runtime can
       show/hide by `data-product-id`), wrapped in a grid container with
       `id="catalog-grid"`; an empty-state element `id="catalog-empty"` (hidden
       by default); a pagination `id="catalog-pagination"` target; and a
       `<script type="application/json" id="catalog-data">` blob embedding
       `{products, categories, subcategories}`. Includes the client runtime
       `<script>` importing `initCatalog` from `lib/products/catalogClient.ts`.
- [x] 4.2 Verify the component frontmatter rules (`no fetch(`, no
       `import.meta.env`): all data fetching lives in `lib/api/*`; the page
       frontmatter only orchestrates (a `getCategorias()` helper was added to
       `lib/api/categories.ts` to expose the full list for the sidebar).

## 5. Icon-catalog and design-token compliance

- [x] 5.1 Run `apps/web/src/styles/__tests__/icon-catalog.test.ts` and the
       `no-brand-classes.test.ts` audit; both green (73 tests in `src/styles`).
- [x] 5.2 Run a hex-literal grep over the new files → zero matches
       (no hex literals in `components/`, `pages/productos`, `lib/products`,
       `lib/config/products`, `lib/api/{products,subcategories}`).

## 6. Verification

- [x] 6.1 All Vitest suites green (`npm run test -w apps/web`) — 678 tests.
- [x] 6.2 `astro build` succeeds; the generated
       `apps/web/dist/productos/index.html` contains ALL product cards
       (`<article data-product-id="...">`), the `catalog-data` JSON blob, the
       sidebar form with every subcategory group baked (`hidden disabled`), and
       the runtime `<script>`. Page tests assert this static structure; the
       filtering behaviour is tested via the pure lib + `catalogClient` tests.
- [x] 6.3 `openspec validate products-catalog-page` passes.

## 7. Client-side filtering runtime (SSG + progressive enhancement)

- [x] 7.1 Write `lib/products/__tests__/catalogClient.test.ts` for the pure
       helpers reused by the runtime (no DOM): confirm it relays to
       `parseProductsPageFilters` → `applyProductFilters` and produces the set
       of visible slugs + pagination for a baked product array + query params.
       THEN implement `lib/products/catalogClient.ts` exporting
       `computeCatalogState(products, params)` (pure) and `initCatalog()` (DOM
       glue, not unit-tested) which wires the select/checkbox/pagination/view
       events with the History API.
- [x] 7.2 Add `data-product-id={product.slug}` (and stable hooks) to
       `ProductCard.astro`; update `ProductCardModel` + `toProductCardModel` and
       their tests.
- [x] 7.3 Bake ALL subcategory checkbox groups in `ProductsFiltersSidebar.astro`
       (one `<fieldset data-categoria-id="cat-x" hidden disabled>` per category),
       so the runtime can reveal the selected one instantly. Update the sidebar
       test accordingly (groups baked hidden+disabled; no group visually active in
       the static no-category render).
- [x] 7.4 Wire the runtime `<script>` in `pages/productos/index.astro` and add a
       `catalog-list-mode` reflow (grid↔list via CSS class on the container).
