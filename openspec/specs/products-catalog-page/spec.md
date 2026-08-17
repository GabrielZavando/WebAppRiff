# products-catalog-page Specification

## Purpose
TBD - created by archiving change products-catalog-page. Update Purpose after archive.
## Requirements
### Requirement: Build-time data sources

The page SHALL obtain the public catalog at build time by calling
`GET /api/v1/products` (public, returns only `publicado: true` products)
through `apps/web/src/lib/api/products.ts`, and the active subcategories at
build time by calling `GET /api/v1/subcategories?activa=true` through
`apps/web/src/lib/api/subcategories.ts`. Both modules SHALL cache their
result at module scope (one fetch per build) and SHALL return `[]` on any
fetch or parse error so that `astro build` never fails.

#### Scenario: Products fetched and cached per build
- **WHEN** `astro build` runs and `pages/productos/index.astro` is rendered
- **THEN** exactly one HTTP `GET` is made to `${NESTJS_API_URL}/products`
  across all page renders of that build (module-level cache)
- **AND** the returned `data` array is passed to the page frontmatter

#### Scenario: API unreachable at build time
- **WHEN** `GET /api/v1/products` returns a non-2xx response or the network request throws
- **THEN** `getPublicProducts()` resolves to `[]`
- **AND** `console.warn` is emitted
- **AND** `astro build` exits successfully

#### Scenario: Subcategories fetched at build time and filtered locally
- **WHEN** `astro build` runs and the page needs the active subcategories
- **THEN** the module fetches `GET /api/v1/subcategories?activa=true` exactly
  once per build (module-level cache) and returns the full active list
- **AND** `getActiveSubcategories(categoriaId)` returns the subset whose
  `categoriaId` matches, computed from the cached list (no extra HTTP call)
- **AND** on fetch/parse error the fallback is `[]`

### Requirement: Client-side filtering runtime (SSG + progressive enhancement)

The page SHALL render the **complete** product list server-side (one
`<article data-product-id="<slug>">` per product, unfiltered) because the site is
`output: 'static'` (SSG) and query params are NOT available at build time, and
SHALL embed the catalog as JSON in a `<script type="application/json"
id="catalog-data">` blob containing `products`, `categories` and `subcategories`.

A client-side script (`apps/web/src/lib/products/catalogClient.ts`)
SHALL, on load and on `popstate`, read the URL query params via
`parseProductsPageFilters`, compute the visible slice through
`applyProductFilters` (both pure, already-tested helpers reused — no logic
duplicated), and reflect the result on the DOM:
- Show only the `<article>` cards whose `data-product-id` belongs to the
  computed `items` (hide the rest); update the header total count.
- Render the pagination `nav` from `pagination.items` using
  `buildProductsPageHref` to preserve `q`/`categoriaId`/`subcategoriaIds`/
  `view` while changing only `page`; the active page shows `bg-primary
  text-white` with `aria-current="page"`.
- Toggle the grid container between grid and list layout (`catalog-list-mode`
  class) based on `view`.
- Show/hide the empty-state element when `pagination.total === 0`.

Changes to the sidebar controls SHALL apply **instantly without a full
navigation** (History API `pushState`/`replaceState`): selecting a new category
in the `<select>`, checking/unchecking a subcategory checkbox, changing the
view mode, or clicking a pagination anchor SHALL update the URL and re-run the
runtime. The no-JS fallback keeps the plain `<form method="get">` navigation,
which loads the static unfiltered catalog (acceptable degraded experience).

#### Scenario: All product cards are present in the static HTML
- **WHEN** `astro build` generates `dist/productos/index.html`
- **THEN** one `<article data-product-id="...">` per product is present
- **AND** a `<script type="application/json" id="catalog-data">` blob is present
- **AND** the client runtime `<script>` is present

#### Scenario: Category selected instantly shows its subcategory list
- **WHEN** JS is enabled and the user selects a category in the sidebar `<select>`
- **THEN** the subcategory checkbox group for that category becomes visible and
  enabled (no form submission / full navigation)
- **AND** the grid re-filters to that category immediately
- **AND** the URL gains `categoriaId` (with subcategoriaIds cleared and page reset)

#### Scenario: URL with filters reflects on load
- **WHEN** the user lands at
  `/productos?categoriaId=cat-fluidos&subcategoriaId=sub-caudal&view=list&page=2`
- **THEN** on `DOMContentLoaded` the runtime shows only `cat-fluidos` products
  whose subcategoria is `sub-caudal`, in list layout, on page 2 of the result
- **AND** the sidebar `<select>` is set to `cat-fluidos` and `sub-caudal` is checked

### Requirement: Page header title

The page SHALL render an `<h1>` with the text `Catálogo de Productos` and the
subtitle `Soluciones de alta precisión para medición, control y tratamiento de
fluidos. Explore nuestra gama técnica diseñada para entornos exigentes.`

#### Scenario: Header text
- **WHEN** the user navigates to `/productos`
- **THEN** the server-rendered HTML contains `<h1>Catálogo de Productos</h1>`
- **AND** the subtitle paragraph text

### Requirement: Sidebar — category selector with conditional subcategory multi-select

The sidebar SHALL expose:
- A **title block** at the top: the heading `"FILTRO DE BÚSQUEDA"` (uppercase) with
  a horizontal divider line (`border-b` using the `--color-border` token) directly
  beneath it.
- A **`Categorías` label** followed by a **category `<select name="categoriaId">`**
  whose `<option>`s come from the build-time cached active categories list, with a
  `"Todas las categorías"` default option first (empty value).
- **Conditionally**, directly below the category `<select>`, a set of **subcategory
  checkboxes (`<input type="checkbox" name="subcategoriaId" value="<id>">`)** — one
  per subcategory whose `categoriaId` matches the currently selected category (the
  complete list of subcategories belonging to that category). The subcategory
  checkboxes SHALL be rendered **only when both**:
  - `categoriaId` is non-empty, **AND**
  - the category has at least one subcategory.
  Otherwise the subcategory control SHALL be omitted entirely. Each checked
  checkbox mirrors a value present in `subcategoriaIds` (multi-select).

The `<form>` SHALL be `<form method="get" action="/productos">` and SHALL
preserve the current `q` and `view` via hidden inputs. A submit button
(`Aplicar filtros`) and a `Limpiar filtros` link (which drops
category/subcategory but keeps `q`) SHALL be present.

#### Scenario: No category selected hides subcategory control
- **WHEN** the page is rendered at `/productos` (no `categoriaId`)
- **THEN** no `input[type="checkbox"][name="subcategoriaId"]` is present in the DOM
- **AND** the form submits only `q` (and `view`) on apply

#### Scenario: Category without subcategories hides the control
- **WHEN** the page is rendered at `/productos?categoriaId=cat-sin-subcats`
  and the cached subcategories list contains no entry with that `categoriaId`
- **THEN** no `input[type="checkbox"][name="subcategoriaId"]` is present in the DOM
- **AND** the category selector still shows the active selection

#### Scenario: Category with subcategories shows the complete list
- **WHEN** the page is rendered at
  `/productos?categoriaId=cat-fluidos&subcategoriaId=sub-caudal`
- **THEN** subcategory checkboxes are rendered (one per subcategory of `cat-fluidos`),
  directly below the category `<select>`
- **AND** their values are exactly every subcategory whose `categoriaId` is `cat-fluidos`
- **AND** only `sub-caudal` is `checked`

### Requirement: URL-driven filtering contract

The client-side runtime SHALL accept the following query parameters and SHALL
filter the baked catalog (read from the embedded JSON) in the browser using
`applyProductFilters`:

| Param | Type | Default | Effect |
|---|---|---|---|
| `q` | string | `''` | Case-insensitive substring match against `titulo`, `descripcionBreve`, `sku`, `slug` |
| `categoriaId` | string | `''` | Exact match against `productos.categoriaId` |
| `subcategoriaId` | string \| repeated | `[]` | Each occurrence adds an id; product matches when `productos.subcategoriaId ∈ array` |
| `sortBy` | `'titulo' \| 'precio.valor' \| 'creadoEn'` | `'creadoEn'` | Sort key |
| `sortDir` | `'asc' \| 'desc'` | `'desc'` | Sort direction |
| `view` | `'grid' \| 'list'` | `'grid'` | Layout of the results area |
| `page` | positive integer | `1` | 1-based page index; bounded to `[1, totalPages]` |

The static HTML (no JS) renders the full catalog unfiltered; the contract above
is enforced by the runtime. `q`, `categoriaId`, `subcategoriaId`, `view` and
`page` SHALL be preserved across sidebar interactions by building links via
`buildProductsPageHref`.

#### Scenario: Direct navigation shows the full first page
- **WHEN** the user navigates to `/productos` with no query params
- **THEN** the runtime shows the first page (size 9 by default) of all products,
  sorted by `creadoEn desc`
- **AND** the pagination control shows `‹ 1 2 3 … N ›` (or no pagination if `total ≤ pageSize`)

#### Scenario: Search from SearchForm filters client-side
- **WHEN** the user submits the global `SearchForm` with `q="flujometro"` and
  navigates to `/productos?q=flujometro`
- **THEN** only products whose `titulo`, `descripcionBreve`, `sku` or `slug`
  contains `"flujometro"` (case-insensitive) are shown
- **AND** if none match, `ProductsEmptyState` is shown instead of the grid

#### Scenario: Sidebar filter with multi-select subcategory
- **WHEN** the user selects `categoriaId="cat-fluidos"` and checks two
  subcategories, producing
  `/productos?categoriaId=cat-fluidos&subcategoriaId=sub-caudal&subcategoriaId=sub-presion`
- **THEN** only products with `categoriaId="cat-fluidos"` AND
  `subcategoriaId ∈ {"sub-caudal", "sub-presion"}` are shown
- **AND** the current `q` and `view` (if any) are preserved across the change

### Requirement: Pagination with ellipsis and preserved params

The page SHALL render a `ProductsPagination` component that:
- Shows `‹` (prev), the numeric page items, and `›` (next) — the prev/next
  controls SHALL be `lucide:chevron-left` / `lucide:chevron-right` icons (no
  "Anterior"/"Siguiente" text label), each with an `aria-label` for assistive
  tech.
- Numeric items SHALL include page `1`, the current page ± 1, and the last
  page, with `'…'` ellipses inserted between non-adjacent items (e.g.
  `[1, 2, 3, '…', 8]`).
- The current page SHALL carry `aria-current="page"` and SHALL be styled with
  `bg-primary text-white` (no bottom-border indicator — solo fondo primario,
  per design decision matching `ProductsPage.png`).
- `‹` and `›` SHALL be `aria-disabled` and non-clickable at the boundaries.
- Each numeric anchor SHALL preserve `q`, `categoriaId`, `subcategoriaId`,
  `view` and SHALL only change `page`.

#### Scenario: Pagination at boundary
- **WHEN** the user is on page `1` of 8
- **THEN** `‹` is rendered as a non-anchor with `aria-disabled="true"`
- **AND** the page-1 anchor is rendered with `aria-current="page"`

#### Scenario: Pagination preserves filter state
- **WHEN** the user clicks page `3` while `q="flujometro"` and
  `categoriaId="cat-fluidos"`
- **THEN** the generated anchor href is
  `/productos?q=flujometro&categoriaId=cat-fluidos&page=3`
  (and `view` if present)

### Requirement: View toggle (grid / list)

The page SHALL render a `ViewModeToggle` in the header that exposes two
anchors, `?view=grid` and `?view=list`, preserving the rest of the URL state.
The active view SHALL carry `aria-current="true"` and SHALL be visually
distinguished. The default SHALL be `grid`.

#### Scenario: View toggle renders both options
- **WHEN** the page is rendered with `?view=list`
- **THEN** the list anchor has `aria-current="true"` and the grid anchor is
  rendered without it
- **AND** the results area uses the list-row layout (`ProductListItem`)

### Requirement: Empty state

The page SHALL render `ProductsEmptyState` when the filtered result set is
empty. The empty state SHALL include:
- An icon (`lucide:search-x`).
- The message "No se encontraron productos que coincidan con tu búsqueda."
- A "Limpiar filtros" action that navigates to `/productos` (canonical, no
  query params).

#### Scenario: No matches after filtering
- **WHEN** the user filters such that the filtered list is empty
- **THEN** the page renders `ProductsEmptyState` instead of the grid/list
- **AND** the pagination control is not rendered

### Requirement: Product card content (mobile-first, user-defined)

Each `ProductCard` SHALL render, in this exact vertical order:

1. **Image** from `galeria[0].url` with `alt`, `loading="lazy"`,
   `decoding="async"` and a fixed `aspect-ratio` to avoid CLS. When `galeria`
   is empty, a placeholder image is rendered.
2. **Title** (`titulo`) as the card title (heading).
3. **Category chip** with the product's category name resolved server-side at
   build time from the cached categories list
   (`categorias.find(c => c.id === producto.categoriaId).nombre`), rendered as
   a small uppercase chip. When the category is not found, the chip SHALL be
   omitted.
4. **Short description** (`descripcionBreve`) truncated to approximately 2
   lines.
5. A **CTA row with exactly two anchors, side by side at every breakpoint**:
   - `Cotizar` → `/cotizacion?producto=<slug>` (primary visual treatment).
   - `Ver detalles` → `/productos/<slug>` (secondary visual treatment).

The card SHALL NOT render the "COD:" badge, the attribute mini-grid, a separate
price block or a stock badge. The CTA row SHALL sit side-by-side (never stacked
vertically) at every breakpoint, so the primary action (`Cotizar`) is always
one tap away on a phone.

#### Scenario: Card renders the user-defined order
- **WHEN** `ProductCard` receives a product with
  `galeria[0].url="https://..."`, `galeria[0].alt="..."`,
  `titulo="Flujómetro Universal"`, `categoriaId="cat-fluidos"`,
  `descripcionBreve="Medidor electromagnético..."`, `slug="flujometro-universal"`,
  and the categories list contains `{ id: "cat-fluidos", nombre: "Medición de Fluidos" }`
- **THEN** the rendered HTML contains, in order:
  1. the `<img>` with `alt`, `loading="lazy"`, and a fixed aspect ratio;
  2. an `<h*>` with the title;
  3. the category chip text "MEDICIÓN DE FLUIDOS";
  4. the short description, truncated to ~2 lines;
  5. two anchors in a single row:
     - `Cotizar` → `/cotizacion?producto=flujometro-universal` (primary classes)
     - `Ver detalles` → `/productos/flujometro-universal` (secondary classes)
- **AND** the card does NOT contain a "COD:" badge, an attributes mini-grid,
  a separate price block or a stock badge

#### Scenario: Category not found
- **WHEN** `ProductCard` receives a product with `categoriaId="sin-categoria"`
  and the categories list does NOT contain `"sin-categoria"`
- **THEN** the category chip is omitted
- **AND** the rest of the card renders normally

### Requirement: Mobile-first layout

The products page SHALL be designed mobile-first: the default styles apply to
mobile viewports, and richer layouts are layered on at `sm` (≥640px) and `lg`
(≥1024px) breakpoints via Tailwind responsive prefixes. The `ProductCard` CTA
row SHALL sit side-by-side at every breakpoint (never stacked vertically). The
sidebar SHALL stack **above** the results on viewports `<lg` (always visible,
full width) and SHALL sit **on the left** of the results on `lg+`, in a
`lg:grid-cols-[260px_1fr]` two-column layout.

#### Scenario: Mobile breakpoint
- **WHEN** the viewport is `<640px`
- **THEN** the products grid is `grid-cols-1`
- **AND** the card CTA row is `flex-row` (two buttons side by side)
- **AND** the sidebar stacks **above** the results grid (full width)

#### Scenario: Desktop breakpoint
- **WHEN** the viewport is `≥1024px`
- **THEN** the products grid is `lg:grid-cols-3`
- **AND** the page uses `lg:grid-cols-[260px_1fr]` (sidebar left, results right)

### Requirement: No client-side JavaScript required

The page SHALL work with JavaScript disabled: the entire functionality of the
products page (filter, pagination, view toggle) works because every interaction
is a real HTML form submission or a real anchor navigation, and the page does
NOT ship a client `<script>` block for these concerns.

#### Scenario: No-JS navigation
- **WHEN** the user disables JavaScript and navigates through the catalog
  (search, sidebar, pagination, view toggle)
- **THEN** every action produces a full navigation whose server-rendered HTML
  reflects the new filter / pagination / view state

### Requirement: Design-token compliance

All new `.astro` and `.ts` files SHALL:
- Use only Tailwind utilities generated from the project's `@theme {}` tokens
  (no raw hex literals).
- Avoid the `rounded*` utilities (`--radius: 0`, flat design).
- Avoid the obsolete `brand-*` utilities.
- Use icons exclusively from the Lucide set via `astro-icon`
  (`lucide:layout-grid`, `lucide:list`, `lucide:search-x`).

#### Scenario: Hex-literal grep passes
- **WHEN** a regex `#[0-9A-Fa-f]{6}` is run over the new files (excluding
  tests and snapshots)
- **THEN** the result SHALL be empty

