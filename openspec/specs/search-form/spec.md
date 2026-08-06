# search-form Specification

## Purpose
TBD - created by archiving change search-form. Update Purpose after archive.
## Requirements
### Requirement: SearchForm renders a category select with a default option
The search-form SHALL render a `<select>` populated from the `categories` prop, where the first option is `{ id: "", label: "Todas las categorías" }` and is pre-selected when `initialCategoriaId` is empty. The select border SHALL use the `--color-border` (`#E3E8ED`) token; the selected/focused state SHALL use a primary-color ring via `focus:border-primary` (resolving to `#41B3C4`). Hex literals SHALL NOT appear in `class` attributes.

#### Scenario: Border uses color-border token
- **WHEN** the search-form renders its `<select>` in default state
- **THEN** the select element's border color resolves from the `--color-border` token
- **AND** no literal `#E3E8ED` appears in `class` attributes of the rendered HTML

#### Scenario: Focus state uses primary token
- **WHEN** the select receives focus
- **THEN** its border color resolves from `--color-primary` (`#41B3C4`)
- **AND** the class string does NOT contain literal `#41B3C4`

### Requirement: SearchForm renders a labelled search input
The search-form SHALL render a `<input type="search">` with `name="q"`, the configured placeholder, and a visually associated `<label>`.

#### Scenario: Input rendered with placeholder
- **WHEN** the SearchForm renders with default config
- **THEN** an `<input type="search">` is rendered with `name="q"`
- **AND** its `placeholder` attribute equals the configured placeholder text (default "¿Qué solución está buscando?")
- **AND** a `<label>` element is rendered with `for` pointing to the input's `id`
- **AND** the label text is non-empty (e.g., "Buscar productos")

#### Scenario: Initial query pre-filled when provided
- **WHEN** the SearchForm renders with `initialQuery="taladro"`
- **THEN** the search input's `value` attribute equals "taladro"
- **AND** `initialQuery` is reflected verbatim without trimming in the rendered value

### Requirement: SearchForm renders the submit button
The search-form SHALL render a `<button type="submit">` labelled with the configured submit text using the `--color-accent` (`#F26A21`) token via the Tailwind utility `bg-accent` (with a hover state derived from `--color-accent-dark` `#D14E12` or an alpha overlay of the accent color). The obsolete utility `bg-brand-orange` and references to `--color-brand-orange` SHALL NOT appear.

#### Scenario: Submit button uses accent token
- **WHEN** the search-form renders
- **THEN** the `<button type="submit">` carries the `bg-accent` class (resolving to `#F26A21`)
- **AND** its `class` attribute does NOT contain `bg-brand-orange`
- **AND** the label text is the configured `submitLabel`

### Requirement: SearchForm is wrapped in a search landmark
The search-form SHALL be wrapped by a single element with `role="search"` and a non-empty `aria-label`, distinct from the page `<header>` landmark.

#### Scenario: Search landmark present
- **WHEN** the SearchForm renders
- **THEN** the outermost element is a `<div role="search">`
- **AND** that element carries `aria-label="Buscar productos"`
- **AND** no `<header>` element is introduced by the SearchForm

### Requirement: SearchForm submits a canonical URL via GET
The search-form SHALL submit via `method="get"` to the configured `action` path (default `/productos`), and the resulting URL SHALL omit any field whose trimmed value is empty.

#### Scenario: Submit builds full URL when both fields are filled
- **WHEN** the user enters "taladro" in the input and selects the "Herramientas" category (id `herramientas`)
- **AND** submits the form
- **THEN** the browser navigates to `/productos?q=taladro&categoriaId=herramientas`

#### Scenario: Submit omits empty query
- **WHEN** the user leaves the input empty and selects the "Herramientas" category
- **AND** submits the form
- **THEN** the browser navigates to `/productos?categoriaId=herramientas`
- **AND** no `q=` parameter appears in the URL

#### Scenario: Submit omits empty categoriaId
- **WHEN** the user enters "taladro" in the input and selects "Todas las categorías" (empty value)
- **AND** submits the form
- **THEN** the browser navigates to `/productos?q=taladro`
- **AND** no `categoriaId=` parameter appears in the URL

#### Scenario: Submit omits both empty fields
- **WHEN** the user leaves the input empty and keeps "Todas las categorías" selected
- **AND** submits the form
- **THEN** the browser navigates to `/productos` with no query string

#### Scenario: Submit trims whitespace in query
- **WHEN** the user enters "   taladro   " in the input and selects "Todas las categorías"
- **AND** submits the form
- **THEN** the browser navigates to `/productos?q=taladro` (whitespace trimmed)
- **AND** no extra `+` or `%20` runs appear at the start or end of the `q` value

### Requirement: buildSearchHref helper builds the canonical URL
The `buildSearchHref(query, categoriaId, action)` function SHALL return the canonical search URL, trimming `query` whitespace and omitting empty parameters.

#### Scenario: Both values provided
- **WHEN** `buildSearchHref("taladro", "herramientas", "/productos")` is called
- **THEN** it returns `/productos?q=taladro&categoriaId=herramientas`

#### Scenario: Only query provided
- **WHEN** `buildSearchHref("taladro", "", "/productos")` is called
- **THEN** it returns `/productos?q=taladro`

#### Scenario: Only categoriaId provided
- **WHEN** `buildSearchHref("", "herramientas", "/productos")` is called
- **THEN** it returns `/productos?categoriaId=herramientas`

#### Scenario: Both empty
- **WHEN** `buildSearchHref("", "", "/productos")` is called
- **THEN** it returns `/productos` with no query string

#### Scenario: Whitespace query is trimmed
- **WHEN** `buildSearchHref("   ", "herramientas", "/productos")` is called
- **THEN** it returns `/productos?categoriaId=herramientas` (whitespace-only query omitted)

#### Scenario: URL-encodes special characters
- **WHEN** `buildSearchHref("taladro & sierra", "herramientas", "/productos")` is called
- **THEN** it returns `/productos?q=taladro+%26+sierra&categoriaId=herramientas` (URL-encoded)

#### Scenario: Custom action path
- **WHEN** `buildSearchHref("foo", "bar", "/catalogo")` is called
- **THEN** it returns `/catalogo?q=foo&categoriaId=bar`

### Requirement: SearchForm layout is responsive
The search-form SHALL render the three controls (select, input, button) inline on desktop viewports (>= 768px) and stacked vertically full-width on mobile viewports (< 768px).

#### Scenario: Desktop single row (>= 768px)
- **WHEN** the SearchForm renders on a viewport >= 768px
- **THEN** the `<form>` uses flex-row layout
- **AND** the `<select>`, `<input>` and `<button>` share one horizontal row
- **AND** the input stretches to fill available space

#### Scenario: Mobile stacked layout (< 768px)
- **WHEN** the SearchForm renders on a viewport < 768px
- **THEN** the `<form>` uses flex-col layout
- **AND** the `<select>`, `<input>` and `<button>` each take the full width of their container
- **AND** each control sits on its own row

### Requirement: SearchForm is keyboard accessible with native semantics
The search-form SHALL be operable with the keyboard using native HTML form semantics: Tab cycles through controls, Enter submits from the input, and the form submits without JavaScript.

#### Scenario: Tab order through controls
- **WHEN** a keyboard user Tab-focuses the SearchForm
- **THEN** focus moves in order: category `<select>` → search `<input>` → submit `<button>`

#### Scenario: Enter in input submits the form
- **WHEN** the user types a query and presses Enter while the input is focused
- **THEN** the form submits and navigates to the canonical URL as defined by the submit requirement

#### Scenario: Labels programmatically associated
- **WHEN** the SearchForm renders
- **THEN** the `<select>` has an associated `<label>` via `for`/`id`
- **AND** the `<input>` has an associated `<label>` via `for`/`id`
- **AND** the submit button relies on its visible text (no extra aria-label needed)

### Requirement: SearchForm categories are configured via a hardcoded constant
The category list SHALL come from the `CATEGORY_OPTIONS` constant defined in `lib/config/search-form.ts`, and the form action, submit label, input placeholder and field names SHALL come from `SEARCH_FORM_CONFIG`, both overridable via environment variables with sensible defaults.

#### Scenario: CATEGORY_OPTIONS includes the default option first
- **WHEN** the constant `CATEGORY_OPTIONS` is imported
- **THEN** its first element is `{ id: "", label: "Todas las categorías" }`
- **AND** subsequent elements are `{ id, label }` pairs with non-empty string `id`

#### Scenario: SEARCH_FORM_CONFIG falls back to defaults when env vars are missing
- **WHEN** `getSearchFormConfig()` is called without `SEARCH_RESULTS_PATH`, `SEARCH_SUBMIT_LABEL`, `SEARCH_PLACEHOLDER` set
- **THEN** it returns `{ action: "/productos", submitLabel: "BUSCAR", inputPlaceholder: "¿Qué solución está buscando?", inputName: "q", selectName: "categoriaId" }`

#### Scenario: SEARCH_FORM_CONFIG honours env vars when present
- **WHEN** `getSearchFormConfig()` is called with `SEARCH_RESULTS_PATH="/catalogo"` and `SEARCH_SUBMIT_LABEL="IR"` set
- **THEN** it returns `{ action: "/catalogo", submitLabel: "IR", ... }` keeping the other defaults intact

### Requirement: SearchForm integrates into the global layout
The SearchForm SHALL render below `<Header />` and above the page slot on every page that uses `Layout.astro`, wrapped in a `role="search"` landmark.

#### Scenario: SearchForm renders after the header in the page
- **WHEN** any page uses the global `Layout.astro`
- **THEN** the rendered HTML contains `<TopHeader />`, then `<header>` (from site-header), then `<div role="search">` (from SearchForm), in that DOM order
- **AND** the page slot content renders after the SearchForm

#### Scenario: Page count of header landmarks remains one
- **WHEN** any page renders with the updated Layout
- **THEN** exactly one `<header>` element exists in the document (from site-header)
- **AND** the SearchForm does NOT introduce a new `<header>`
