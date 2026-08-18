## ADDED Requirements

### Requirement: SearchForm background supports a secondary (navy) variant
SearchForm SHALL accept an optional boolean prop `secondaryBg` (default `false`). When `true`, the outer `role="search"` wrapper SHALL use the same left-to-right brand gradient as the site header — `bg-linear-to-r from-secondary to-secondary-light` (a gradient between `--color-secondary` #1F2D40 and `--color-secondary-light` #35455E) — instead of the flat `bg-secondary` or `bg-white border-b border-border`. When `secondaryBg` is `false` and `transparent` is `false`, the default white wrapper SHALL be used. The `transparent` prop SHALL take precedence over `secondaryBg` (a transparent hero wrapper never becomes navy in its resting state). No literal hex SHALL appear in `class` attributes; the header gradient utilities SHALL be used. The white `bg-white` fields (select/input) and the `bg-primary` submit button SHALL be preserved so the controls stay legible over the navy wrapper, identical to the transparent mode behavior.

#### Scenario: Secondary variant renders the header gradient wrapper
- **WHEN** SearchForm renders with `secondaryBg: true`
- **THEN** the `role="search"` wrapper carries `bg-linear-to-r from-secondary to-secondary-light`
- **AND** the wrapper does NOT carry the flat `bg-secondary` class
- **AND** the wrapper does NOT carry `bg-white`
- **AND** the wrapper does NOT carry `border-b` nor `border-border`
- **AND** no literal `#1F2D40` appears in the rendered `class` attributes

#### Scenario: Secondary variant keeps white controls and primary button
- **WHEN** SearchForm renders with `secondaryBg: true`
- **THEN** the `<select>` and `<input>` carry `bg-white`
- **AND** the submit `<button>` carries `bg-primary` (not `bg-accent`)

#### Scenario: Default variant still renders white wrapper
- **WHEN** SearchForm renders without `secondaryBg` and without `transparent`
- **THEN** the `role="search"` wrapper carries `bg-white border-b border-border`
- **AND** the wrapper does NOT carry `bg-secondary`

#### Scenario: Transparent takes precedence over secondary
- **WHEN** SearchForm renders with `transparent: true` and `secondaryBg: true`
- **THEN** the `role="search"` wrapper carries `bg-transparent`
- **AND** the wrapper does NOT carry `bg-secondary`

### Requirement: SearchForm category select visibility is configurable
SearchForm SHALL accept an optional boolean prop `showCategorySelect` (default `true`). When `false`, the entire category `<select name="categoriaId">` block (including its wrapper `<div>` and `<label>`) SHALL NOT be rendered. The search `<input type="search">` and the submit `<button>` SHALL remain rendered; the input SHALL retain its `md:flex-1` expansion so it fills the space formerly occupied by the select.

#### Scenario: Select is omitted when showCategorySelect is false
- **WHEN** SearchForm renders with `showCategorySelect: false`
- **THEN** no `<select name="categoriaId">` element is present in the rendered HTML
- **AND** an `<input type="search">` element is present
- **AND** a `<button type="submit">` element is present
- **AND** the `<input>` carries `md:flex-1` (expands to fill width)

#### Scenario: Select is present by default
- **WHEN** SearchForm renders without `showCategorySelect`
- **THEN** a `<select name="categoriaId">` element is present
- **AND** the existing snapshot for the default render is unchanged

#### Scenario: Select hidden specifically on the Productos page
- **WHEN** the `/productos` page renders its global search via Layout with `searchShowCategorySelect: false`
- **THEN** the rendered search landmark contains no `<select name="categoriaId">`
- **AND** the `/servicios`, `/cotizacion` and `/productos/{slug}` pages still render the `<select>`

### Requirement: SearchForm visibility is scoped to selected pages
The global SearchForm SHALL be rendered on Inicio (`/`), Productos (`/productos`), Servicios (`/servicios`), Cotización (`/cotizacion`) and the product detail page (`/productos/{slug}`). It SHALL be omitted on Contacto (`/contacto`), Marcas (`/marcas`) and on any route that does not opt in. Visibility is controlled by the `showSearch` prop on `Layout.astro` (default `true`); pages that must hide the search pass `showSearch={false}`. The navy background and the select visibility are controlled per-page via `searchSecondary` and `searchShowCategorySelect` respectively.

#### Scenario: Search shown on Inicio
- **WHEN** a visitor loads `/`
- **THEN** a `role="search"` landmark is visible

#### Scenario: Search shown on Productos index
- **WHEN** a visitor loads `/productos`
- **THEN** a `role="search"` landmark is visible

#### Scenario: Search shown on Servicios
- **WHEN** a visitor loads `/servicios`
- **THEN** a `role="search"` landmark is visible

#### Scenario: Search shown on Cotización
- **WHEN** a visitor loads `/cotizacion`
- **THEN** a `role="search"` landmark is visible

#### Scenario: Search shown on product detail
- **WHEN** a visitor loads `/productos/{slug}`
- **THEN** a `role="search"` landmark is visible

#### Scenario: Search hidden on Contacto
- **WHEN** a visitor loads `/contacto`
- **THEN** no `role="search"` landmark is present

#### Scenario: Search hidden on Marcas
- **WHEN** a visitor loads `/marcas`
- **THEN** no `role="search"` landmark is present

### Requirement: Servicios and Marcas pages exist with the Layout shell
The routes `/servicios` and `/marcas` SHALL each return HTTP 200 (no 404) and render inside the global `Layout.astro` (which provides TopHeader, Header, Footer and SiteCredits), containing a `<main>` placeholder for future content. `/servicios` SHALL opt into the global search with the navy (`bg-secondary`) background; `/marcas` SHALL opt out of the global search (`showSearch={false}`).

#### Scenario: Servicios page renders with navy search
- **WHEN** a visitor loads `/servicios`
- **THEN** the response status is 200
- **AND** a `role="search"` landmark is present
- **AND** the search wrapper carries `bg-linear-to-r from-secondary to-secondary-light`

#### Scenario: Marcas page renders without search
- **WHEN** a visitor loads `/marcas`
- **THEN** the response status is 200
- **AND** no `role="search"` landmark is present

## MODIFIED Requirements

### Requirement: SearchForm integrates into the global layout
The SearchForm SHALL render below `<Header />` and above the page slot inside `Layout.astro`, wrapped in a `role="search"` landmark. Its visibility SHALL be controlled by the Layout prop `showSearch` (default `true`); pages that must not show the search pass `showSearch={false}` (e.g. Contacto, Marcas). The search background SHALL be controlled by the Layout prop `searchSecondary`: when `true` the wrapper uses the navy `bg-secondary` token, otherwise it uses the default white wrapper (or `transparent` on the home hero). The category `<select>` visibility SHALL be controlled by the Layout prop `searchShowCategorySelect` (default `true`); the Productos page passes `false` to hide it. The existing DOM order and single-`<header>` landmark invariants SHALL be preserved.

#### Scenario: SearchForm renders after the header in the page
- **WHEN** a page uses the global `Layout.astro` with `showSearch` enabled
- **THEN** the rendered HTML contains `<TopHeader />`, then `<header>` (from site-header), then `<div role="search">` (from SearchForm), in that DOM order
- **AND** the page slot content renders after the SearchForm

#### Scenario: Page count of header landmarks remains one
- **WHEN** any page renders with the updated Layout
- **THEN** exactly one `<header>` element exists in the document (from site-header)
- **AND** the SearchForm does NOT introduce a new `<header>`

#### Scenario: Search is omitted when showSearch is false
- **WHEN** a page uses `Layout.astro` with `showSearch={false}`
- **THEN** no `role="search"` landmark is rendered

#### Scenario: Navy background applies when searchSecondary is true
- **WHEN** a page uses `Layout.astro` with `searchSecondary={true}` and `showSearch` enabled
- **THEN** the `role="search"` wrapper carries `bg-linear-to-r from-secondary to-secondary-light`

#### Scenario: Category select is hidden when searchShowCategorySelect is false
- **WHEN** a page uses `Layout.astro` with `searchShowCategorySelect={false}` and `showSearch` enabled
- **THEN** the rendered search form contains no `<select name="categoriaId">`
