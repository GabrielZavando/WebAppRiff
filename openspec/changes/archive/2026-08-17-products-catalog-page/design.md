## Context

`apps/web/src/pages/productos/index.astro` is a placeholder. The site is an
Astro **SSG** app: `astro build` produces static HTML served by Nginx/Node on
the VPS via Coolify. The backend (NestJS BFF) exposes
`GET /api/v1/products` (public, returns only `publicado: true`) and
`GET /api/v1/subcategories?activa=true` (public).

The layout already owns the global `SearchForm` and its category list
(build-time via `lib/api/categories.ts` + `getSearchFormCategories()`), and the
form navigates to `/productos?q=...&categoriaId=...` on submit. The catalog
page therefore needs to be the canonical destination for that URL state.

The component rule (enforced by `no-brand-classes.test.ts` and other audits)
forbids `fetch(` / `import.meta.env` in component frontmatter: every build-time
data fetch lives under `apps/web/src/lib/api/`. The page frontmatter is allowed
(and expected) to do the orchestration.

The reference image `docs/design/components/ProductsPage.png` is the source of
truth for the **page layout** (header with title + subtitle, sidebar of filters,
product grid/list, pagination with ellipsis, view-mode toggle, empty state) but
**not** for the visual styling (which comes from the project design system) nor
for the **card content** (explicitly redefined by the user: image → name →
category → short description → two CTAs `Cotizar` + `Ver detalles`).

## Goals / Non-Goals

**Goals**
- Real, useful `/productos` page that replaces the placeholder.
- Build-time fetch of products + subcategories, cached per build, with safe
  fallback so the build never fails.
- Filtering by `q` (search), `categoriaId` (category selector), `subcategoriaId`
  (multi-select subcategories of the selected category), sort, view (grid/list),
  pagination — all server-rendered from URL params at build time.
- The sidebar exposes a **category `<select>`** and, when the selected category
  has active subcategories, a **subcategory `<select multiple>`** listing exactly
  those subcategories. The subcategory control is hidden when no category is
  selected and when the selected category has no active subcategories.
- Works with JS disabled (every interaction is a real navigation).
- Mobile-first: the sidebar stacks above the grid on `<lg` (collapsible in a
  `<details>` closed by default) and sits on the left at `lg+`.
- Faithful to the reference image for layout/maquetación; styles from the
  design system.
- Mirrors the SRP/composition conventions of the existing components
  (`SearchForm.astro`, `DestacadosSection.astro`, etc.).

**Non-Goals**
- No backend changes. `GET /api/v1/products` and `GET /api/v1/subcategories`
  are sufficient.
- No client-side JS for filtering/pagination/view toggle. The page is
  fully URL-driven; if instant interactions are needed later, a separate
  enhancement change can add it.
- No product detail page (`/productos/[slug]`) — the `Ver detalles` link is
  emitted by this change but the destination is a follow-up.
- No consumption of the `?producto=` query param by `/cotizacion` — also a
  follow-up.
- No new design tokens. All visuals are built from the existing `@theme {}`
  in `apps/web/src/styles/globals.css`.
- No pricing block on the card, no stock badge, no "COD:" badge, no attributes
  mini-grid (the user redefined card content).
- No rebuild / webhook plumbing for products (the existing
  `CATEGORIES_WEBHOOK_URL` change covers categories; products rebuild on the
  existing deploy cadence — out of scope to add a new notifier here).
- No `<optgroup>` grouping fallback when no category is selected — the
  subcategory `<select>` is hidden in that case.

## Decisions

### D1 — Fully URL-driven, no client `<script>`
**Decision:** All filtering, pagination and view toggle are implemented as
URL params consumed by the Astro frontmatter at build time. The sidebar is a
real `<form method="get">`; pagination links and view-toggle links are real
anchors. The page does NOT ship a client `<script>` for this functionality.
**Rationale:** (a) Coherent with the project's SSG model. (b) Mirrors the
`SearchForm` progressive-enhancement pattern. (c) One render path = trivial to
test: the pure `applyProductFilters` helper is the single source of truth, used
by the Astro frontmatter and asserted by Vitest. (d) Zero JS = better Core Web
Vitals on the catalog.

### D2 — Build-time fetch with module-level cache and safe fallback
**Decision:** `lib/api/products.ts` and `lib/api/subcategories.ts` mirror the
`lib/api/categories.ts` pattern: `process.env.NESTJS_API_URL ?? 'http://localhost:3000/api/v1'`,
module-level `cached` so pages trigger exactly one fetch per build, and a
`try/catch` that falls back to `[]` on error with `console.warn`.
**Rationale:** Identical to the precedent already in the repo
(search-form-categories change). Keeps the build resilient if the backend is
briefly unreachable.

### D3 — Filter semantics over the embedded list
**Decision:** `applyProductFilters(products, filters)`:
- `q` matches case-insensitively against `titulo`, `descripcionBreve`,
  `sku`, `slug`.
- `categoriaId` matches exactly when non-empty.
- `subcategoriaId` accepts an array of ids; product matches when its
  `subcategoriaId` is in the array (or when the array is empty → no filter).
- `sortBy` ∈ `{ 'titulo' | 'precio.valor' | 'creadoEn' }`, `sortDir` ∈ `{ asc | desc }`.
  Default: `sortBy='creadoEn', sortDir='desc'` (newest first).
- `page` (1-based) and `pageSize` (env `PRODUCTS_PAGE_SIZE`, default 9)
  produce `items` (the slice) and `pagination` metadata
  `{ page, pageSize, total, totalPages }`.
**Rationale:** Coherent with the API contract (`sortBy` enum already exists);
filtering over the baked list means the page needs zero runtime API calls.

### D4 — Sidebar: category selector + conditional subcategory multi-select
**Decision:** The sidebar exposes a category `<select name="categoriaId">` whose
`<option>`s come from the build-time cached active categories list, with an
`"Todas"` default first (empty value).

When **both** conditions are met, a subcategory `<select name="subcategoriaId" multiple>` is
rendered below it:
1. A non-empty `categoriaId` is selected.
2. That category has at least one active subcategory.

Otherwise the subcategory `<select>` is **not rendered** (no placeholder, no
`<optgroup>` fallback). The category change is a real form submit
(`<form method="get" action="/productos">`) so the subcategory `<select>`
re-renders server-side with the subcategories of the new category. On mobile
(`<lg`) the subcategory `<select>` uses `size="5"` for a visible scrollable
list; on `lg+` it uses the default native multi-select.

The `<form>` preserves `q` and `view` via hidden inputs, includes a submit
button (`Aplicar filtros`) and a `Limpiar` link to `/productos`.
**Rationale:** Direct application of the user's instruction: "el filtro debe
mostrar un select para cambiar la categoría y los options deben mostrar la
lista de subcategorías que pertenecen a la categoría seleccionada".
Server-side conditional rendering keeps the page URL-driven (D1) and no-JS
functional, and avoids empty controls.
**Alternatives considered:** (a) A single `<select multiple>` always showing
all subcategories grouped by `<optgroup>` — rejected because the user asked for
the options to reflect the selected category only, and for the control to be
hidden when no category is selected. (b) A custom checkbox dropdown — rejected
because it needs JS, conflicting with D1.

### D4-bis — Empty categories handled at the source
**Decision:** `getActiveSubcategories({ categoriaId })` is queried with
`?activa=true&categoriaId=<id>` server-side. `lib/api/subcategories.ts` returns
`[]` for categories with no active subcategories. The sidebar checks this list
and omits the subcategory `<select>` when empty.
**Rationale:** The "hidden when no subcategories" rule is decided once, at the
data layer, not in the component's presentation logic.

### D5 — Sidebar preserves the current `q` and `view`
**Decision:** The sidebar `<form>` includes hidden inputs for `q` and `view`
that mirror the current URL values, so changing category/subcategory does not
clear the active search query or view mode.
**Rationale:** Without this, every filter change would discard the search
query, which is a confusing UX.

### D6 — Card content (mobile-first, user-defined)
**Decision:** `ProductCard.astro` renders, in this exact order, top to bottom:
1. **Image** — `galeria[0].url` via plain `<img loading="lazy" decoding="async" alt>`
   with `aspect-ratio` to prevent CLS. Fallback placeholder when `galeria` is
   empty. The image area is the full card width (`w-full`), with a consistent
   aspect ratio (`aspect-[4/3]`).
2. **Title** — `titulo` in `font-heading text-lg font-semibold text-text
   hover:text-primary`.
3. **Category chip** — small chip with the product's category name
   (e.g. `"Medición de Fluidos"`), `bg-primary-light px-2 py-0.5 text-xs
   font-medium text-primary-dark`. The category name is resolved server-side at
   build time by looking up the category in the cached categories list.
4. **Short description** — `descripcionBreve` truncated to ~2 lines with
   `line-clamp-2 text-text-2 text-sm`.
5. **CTA row** — two anchors side by side (`flex flex-row gap-2`):
   - `Cotizar` → `/cotizacion?producto=<slug>` — primary visual treatment:
     `bg-primary hover:bg-primary-dark text-white`.
   - `Ver detalles` → `/productos/<slug>` — secondary visual treatment:
     `border border-primary text-primary hover:bg-primary hover:text-white`.

The card layout is **mobile-first**:
- Below `sm` (mobile): card spans full grid width; CTA row is `flex-row` (two
  equal buttons side-by-side on the phone, not stacked vertically).
- `sm` and up: 2-up tablet, 3-up desktop (`sm:grid-cols-2 lg:grid-cols-3 gap-6`).
- Image aspect ratio is the same at all breakpoints.
The card does **not** render the "COD:" badge, the attributes mini-grid, any
price block or stock badge.
**Rationale:** The reference image is a layout reference; the actual card
content is what the user specified. Mobile-first matches
`frontend-standards.md`. Two side-by-side CTAs at every breakpoint is a
deliberate choice — stacking them on mobile would force an extra tap and would
make "Ver detalles" the dominant action on a small screen, which is the wrong
default for a B2B catalog where the primary intent is to request a quote.

### D7 — View toggle as anchors
**Decision:** Two anchors (`?view=grid`, `?view=list`) styled as a small
button group with the active one highlighted (`border-primary bg-primary-light
text-primary-dark`), `aria-current="true"` on the active one. Icons via
`astro-icon` (`lucide:layout-grid`, `lucide:list`).
**Rationale:** Trivially works no-JS, SEO-friendly (the chosen view is in the
URL), and aligned with the icon catalog (`Lucide` is the unique allowed set).

### D8 — Pagination model with ellipsis
**Decision:** `buildPaginationItems({ page, totalPages })` returns the array of
items shown by `ProductsPagination.astro`: always includes `1`, the current page
± 1, `totalPages`, and `'…'` ellipses between non-adjacent items
(e.g. `[1, 2, 3, '…', 8]`). Each numeric item is an anchor that preserves
`q`, `categoriaId`, `subcategoriaId`, `view` and sets `page`. Prev/next are
disabled when at the boundary (`aria-disabled`, no anchor).
**Rationale:** Matches the reference image. Anchor-based = works no-JS.

### D9 — Empty state
**Decision:** When `applyProductFilters` returns zero items, render
`ProductsEmptyState.astro` (centered, `lucide:search-x` icon, "No se
encontraron productos que coincidan con tu búsqueda." + a "Limpiar filtros"
button that navigates to `/productos`).
**Rationale:** Required by the user story and explicit in the acceptance
criteria.

### D10 — Pure helpers + TDD
**Decision:** Every piece of business logic (filter/sort/paginate, href
building, card model mapping, pagination items) lives in a pure function in
`lib/products/` (or `lib/api/` for the fetch wrappers), each with a
`__tests__/*.test.ts` written FIRST (per `base-standards.md` § 1 and § 2).

### D11 — Category name lookup server-side, not client-side
**Decision:** `toProductCardModel(product, { categories })` receives the
build-time cached categories list and resolves `categoriaNombre` by id (or
returns `''` if not found). No client JS, no runtime fetch.
**Rationale:** Coherent with D1/D2 — everything is server-rendered from
build-time data. Categories are already cached in `lib/api/categories.ts`;
the products page imports them in its frontmatter.

## Risks / Trade-offs

- **[Risk] Stale catalog between rebuilds.** → Acceptable: matches the SSG
  model and the existing pattern for categories. A future change can add a
  `PRODUCTS_WEBHOOK_URL` analogous to `CATEGORIES_WEBHOOK_URL`.
- **[Risk] Payload size at build time.** → Mitigated by `cache-control` on the
  API and by the fact that the public list is bounded by `publicado=true`. If
  the catalog grows large, a future change can move to paginated
  `getStaticPaths` — D1 documents the trigger.
- **[Risk] `astro:assets` for remote images.** → Out of scope to enable
  `image.remotePatterns` for Firebase Storage in this change. Plain `<img>` is
  used with explicit `width`/`height` and `aspect-ratio` to avoid CLS. A
  follow-up can enable remote patterns if SEO/Lighthouse demand it.
- **[Risk] Sidebar category ↔ subcategory parity.** When the admin changes a
  subcategory's `categoriaId`, the rebuild lag window means the sidebar may
  briefly show stale options. → Acceptable, same as categories.

## Migration Plan

1. Land this change; `astro build` succeeds against the live API.
2. Verify on staging: navigate to `/productos` directly; submit the global
   `SearchForm`; apply sidebar filters; switch view; paginate.
3. Verify no-JS rendering: disable JS in the browser and repeat the flow.
4. Rollback: revert the commit; the placeholder `/productos` returns. The
   backend is untouched, so there is nothing to roll back there.

## Open Questions

- Q1. Default `pageSize` (env `PRODUCTS_PAGE_SIZE`): **9** (confirmed).
- Q2. SOLICITAR target redefined as two CTAs: `Cotizar` → `/cotizacion?producto=<slug>`
  and `Ver detalles` → `/productos/<slug>`. The detail page is a follow-up
  change; the link is emitted now and 404s there until that change lands
  (documented as a TODO).
- Q3. When no category is selected, the subcategory `<select>` is **hidden**
  (confirmed, not grouped by `<optgroup>`).
- Q4. When the selected category has no active subcategories, the subcategory
  `<select>` is **hidden** (confirmed).
- Q5. Header subtitle text retained from the reference image (confirmed).
- Q6 (post-apply correction). The site is `output: 'static'` (SSG): query params
  are NOT available at build time, so "filter at build time" was impossible.
  Decision: render the **complete** catalog server-side (one card per product,
  unfiltered) + bake the data as JSON; a client runtime
  (`lib/products/catalogClient.ts`) reads the URL and applies filter/pagination/
  view/pagination-link changes without a full navigation (History API), reusing
  the already-tested pure helpers (`parseProductsPageFilters`,
  `applyProductFilters`, `buildPaginationItems`, `buildProductsPageHref`). No-JS
  fallback: the static unfiltered catalog + the sidebar GET form (which reloads
  the static page). The sidebar bakes every subcategory group `hidden disabled`
  so the runtime reveals the selected category's group instantly on `<select>`
  change ("checkboxes al instante", user-confirmed). `view=list` is a CSS
  reflow class (`catalog-list-mode`) over the single set of `ProductCard`s — no
  duplicate markup.
