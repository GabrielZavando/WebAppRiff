# search-form Specification

## MODIFIED Requirements

### Requirement: SearchForm integrates into the global layout
The SearchForm SHALL render below `<Header />` and above the page slot inside `Layout.astro`, wrapped in a `role="search"` landmark. Its visibility SHALL be controlled by the Layout prop `showSearch` (default `true`); pages that must not show the search pass `showSearch={false}` (e.g. Contacto, Marcas, Nosotros, Cotización). The search background SHALL be controlled solely by the `transparent` prop (hero pages): transparent on the hero, solid `bg-secondary` elsewhere — the Layout prop `searchSecondary` SHALL NOT exist (removed in `ui-chrome-polish`). The category `<select>` visibility SHALL be controlled by the Layout prop `searchShowCategorySelect` (default `true`); the Productos page passes `false` to hide it. The single-`<header>` landmark invariant SHALL be preserved. (MODIFIED in `ui-chrome-remove-top-header-phone-fab` — the retired top bar is no longer part of the layout order.)

#### Scenario: Solid secondary applies on non-hero pages
- **WHEN** a page without hero uses the global `Layout.astro` with `showSearch` enabled
- **THEN** the `role="search"` wrapper carries `bg-secondary` (solid var(--color-secondary))
- **AND** the wrapper does NOT carry `bg-linear-to-r from-secondary to-secondary-light` nor `bg-white`

#### Scenario: SearchForm renders after the header in the page
- **WHEN** a page uses the global `Layout.astro` with `showSearch` enabled
- **THEN** the rendered HTML contains `<header>` (from site-header), then `<div role="search">` (from SearchForm), in that DOM order
- **AND** no top contact bar or `role="region"` with `aria-label="Barra de contacto"` precedes the header
- **AND** the page slot content renders after the SearchForm

#### Scenario: Search is omitted when showSearch is false
- **WHEN** a page uses `Layout.astro` with `showSearch={false}`
- **THEN** no `role="search"` landmark is rendered

### Requirement: Servicios and Marcas pages exist with the Layout shell
The routes `/servicios` and `/marcas` SHALL each return HTTP 200 (no 404) and render inside the global `Layout.astro` (which provides Header, Footer, SiteCredits and the global floating contact actions), containing a `<main>` placeholder for future content. `/servicios` SHALL opt into the global search with the navy (`bg-secondary`) background; `/marcas` SHALL opt out of the global search (`showSearch={false}`).

#### Scenario: Servicios page renders with navy search
- **WHEN** a visitor loads `/servicios`
- **THEN** the response status is 200
- **AND** a `role="search"` landmark is present
- **AND** the search wrapper carries `bg-secondary`

#### Scenario: Marcas page renders without search
- **WHEN** a visitor loads `/marcas`
- **THEN** the response status is 200
- **AND** no `role="search"` landmark is present
