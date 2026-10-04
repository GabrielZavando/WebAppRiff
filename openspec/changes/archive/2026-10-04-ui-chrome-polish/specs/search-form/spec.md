# search-form Specification

## MODIFIED Requirements

### Requirement: SearchForm supports a transparent mode
SearchForm SHALL accept an optional boolean prop `transparent` (default `false`). The outer `role="search"` wrapper SHALL render exactly two rest states: `bg-transparent` when `transparent` is `true` (hero pages), and solid `bg-secondary` (var(--color-secondary)) otherwise — a uniform color in every page that renders the search bar (reference: Inicio's compact state). The white wrapper (`bg-white border-b border-border`) and the header gradient (`bg-linear-to-r from-secondary to-secondary-light`) SHALL NOT be rendered in any state. The select and input fields keep their white background for legibility, and the submit button keeps `bg-primary`. The `secondaryBg` prop SHALL NOT exist (plumbing removed in `ui-chrome-polish`). (MODIFIED in `ui-chrome-polish`.)

#### Scenario: SC-002 — transparent mode renders a transparent wrapper
- **WHEN** SearchForm renders with `transparent: true` (hero pages `/` and `/servicios`)
- **THEN** the `role="search"` wrapper carries `bg-transparent`
- **AND** the wrapper does NOT carry `bg-white`, `bg-secondary`, the gradient utilities, nor `border-b border-border`
- **AND** the input/select fields still carry `bg-white`

#### Scenario: SC-003 — non-hero pages render the solid secondary wrapper
- **WHEN** SearchForm renders without `transparent` (non-hero pages `/productos`, `/productos/{slug}`, 404 fallback)
- **THEN** the `role="search"` wrapper carries `bg-secondary` (solid var(--color-secondary))
- **AND** the wrapper does NOT carry `bg-linear-to-r from-secondary to-secondary-light`, `bg-white`, nor `border-b border-border`
- **AND** no literal hex appears in the rendered `class` attributes

### Requirement: SearchForm integrates into the global layout
The SearchForm SHALL render below `<Header />` and above the page slot inside `Layout.astro`, wrapped in a `role="search"` landmark. Its visibility SHALL be controlled by the Layout prop `showSearch` (default `true`); pages that must not show the search pass `showSearch={false}` (e.g. Contacto, Marcas, Nosotros, Cotización). The search background SHALL be controlled solely by the `transparent` prop (hero pages): transparent on the hero, solid `bg-secondary` elsewhere — the Layout prop `searchSecondary` SHALL NOT exist (removed in `ui-chrome-polish`). The category `<select>` visibility SHALL be controlled by the Layout prop `searchShowCategorySelect` (default `true`); the Productos page passes `false` to hide it. The existing DOM order and single-`<header>` landmark invariants SHALL be preserved. (MODIFIED in `ui-chrome-polish`.)

#### Scenario: Solid secondary applies on non-hero pages
- **WHEN** a page without hero uses the global `Layout.astro` with `showSearch` enabled
- **THEN** the `role="search"` wrapper carries `bg-secondary` (solid var(--color-secondary))
- **AND** the wrapper does NOT carry `bg-linear-to-r from-secondary to-secondary-light` nor `bg-white`

#### Scenario: SearchForm renders after the header in the page
- **WHEN** a page uses the global `Layout.astro` with `showSearch` enabled
- **THEN** the rendered HTML contains `<TopHeader />`, then `<header>` (from site-header), then `<div role="search">` (from SearchForm), in that DOM order
- **AND** the page slot content renders after the SearchForm

#### Scenario: Search is omitted when showSearch is false
- **WHEN** a page uses `Layout.astro` with `showSearch={false}`
- **THEN** no `role="search"` landmark is rendered

## REMOVED Requirements

### Requirement: SearchForm background supports a secondary (navy) variant
**Reason**: the `secondaryBg` prop and the gradient variant (`bg-linear-to-r from-secondary to-secondary-light`) are eliminated — the wrapper now renders solid `bg-secondary` on every non-hero page (uniform color rule, reference: Inicio), per the client's requirement in `ui-chrome-polish`. The unused white variant (`bg-white border-b border-border`) is removed with it.
