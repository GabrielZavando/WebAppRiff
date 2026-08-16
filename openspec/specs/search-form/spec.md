# search-form Specification

## Purpose
TBD - created by archiving change search-form. Update Purpose after archive.
## Requirements
### Requirement: SearchForm renders a category select with a default option
The search-form SHALL render a `<select>` populated from the `categories` prop, where the first option is `{ id: "", label: "Todas las categorías" }` and is pre-selected when `initialCategoriaId` is empty. The select border SHALL use the `--color-border` (`#E3E8ED`) token via la utility `border-border`; el texto del control SHALL usar el token `text-text-2` (#5C6675) en lugar de la paleta por defecto Tailwind `text-gray-*`. The select SHALL NOT apply `rounded` (flat design con radio 0). The selected/focused state SHALL use a primary-color ring via `focus:border-primary` (resolving to `#41B3C4`). Hex literals SHALL NOT appear in `class` attributes.

#### Scenario: Border uses color-border token
- **WHEN** the search-form renders its `<select>` in default state
- **THEN** the select element's border color resolves from the `--color-border` token (utility `border-border`)
- **AND** its class string does NOT contain `text-gray-700` nor any `text-gray-*` literal
- **AND** its class string does NOT contain `rounded` (nor any `rounded-*` variant)
- **AND** no literal `#E3E8ED` appears in `class` attributes of the rendered HTML

#### Scenario: Focus state uses primary token
- **WHEN** the select receives focus
- **THEN** its border color resolves from `--color-primary` (`#41B3C4`)
- **AND** the class string does NOT contain literal `#41B3C4`

### Requirement: SearchForm renders a labelled search input
The search-form SHALL render a `<input type="search">` with `name="q"`, the configured placeholder, and a visually associated `<label>`. The input border SHALL use the `--color-border` token via `border-border`; el texto del control SHALL usar el token `text-text-2` (#5C6675). The input SHALL NOT apply `rounded` (flat design con radio 0). The default placeholder SHALL be "¿Qué productos estás buscando?" (changed from "¿Qué solución está buscando?").

#### Scenario: Input rendered with placeholder
- **WHEN** the SearchForm renders with default config
- **THEN** an `<input type="search">` is rendered with `name="q"`
- **AND** its `placeholder` attribute equals "¿Qué productos estás buscando?" (default, changed from "¿Qué solución está buscando?")
- **AND** a `<label>` element is rendered with `for` pointing to the input's `id`
- **AND** the label text is non-empty (e.g., "Buscar productos")
- **AND** the input carries `border-border` and `text-text-2` (not `text-gray-700`)
- **AND** the input does NOT carry `rounded` (nor any `rounded-*` variant)

### Requirement: SearchForm renders the submit button
The search-form SHALL render a `<button type="submit">` labelled with the configured submit text using the `--color-primary` (`#41B3C4`) token via the Tailwind utility `bg-primary` (with a hover state derived from `--color-primary-dark` `#2E9AAD`). The button SHALL use `flex items-center justify-center gap-2` so the search icon and text label are vertically centered with 0.5rem (8px) spacing between them. The button SHALL apply a wider horizontal padding of `px-8` (up from `px-6`) on all breakpoints so the icon + text breathe without shrinking. The button SHALL apply la heading font via `font-heading` (Montserrat) con peso `font-semibold` (600), `text-xs` size y `uppercase tracking-wide` per la escala tipográfica canónica. The button SHALL NOT apply `rounded` (flat design con radio 0). The obsolete utility `bg-brand-orange` and references to `--color-brand-orange` SHALL NOT appear. The previous requirement specifying `--color-accent` (`#F26A21`) via `bg-accent` and `px-6` padding is superseded by this change.

#### Scenario: Submit button uses primary token and flat square corners
- **WHEN** the search-form renders
- **THEN** the `<button type="submit">` carries the `bg-primary` class (resolving to `#41B3C4`)
- **AND** its `class` attribute contains `font-heading` and `font-semibold`
- **AND** its `class` attribute does NOT contain `bg-accent`
- **AND** its `class` attribute does NOT contain `bg-brand-orange`
- **AND** its `class` attribute does NOT contain `rounded` (nor any `rounded-*` variant)
- **AND** the label text is the configured `submitLabel`

#### Scenario: Submit button hover resolves to primary-dark token
- **WHEN** the submit button is hovered
- **THEN** its background color resolves from `--color-primary-dark` (`#2E9AAD`)
- **AND** its class contains `hover:bg-primary-dark`

#### Scenario: Button uses flex layout for icon + text alignment
- **WHEN** the search-form renders
- **THEN** the `<button type="submit">` carries `flex items-center justify-center gap-2`
- **AND** the icon and the `BUSCAR` text label are vertically centered within the button
- **AND** the spacing between the icon and the text is 0.5rem (Tailwind `gap-2`)

#### Scenario: Button uses wider horizontal padding (px-8)
- **WHEN** the search-form renders
- **THEN** the `<button type="submit">` carries `px-8` (not `px-6`)
- **AND** this gives the button a slightly wider presentation on all breakpoints

### Requirement: SearchForm supports a transparent mode
SearchForm SHALL accept an optional boolean prop `transparent` (default `false`). When `true`, the outer `role="search"` wrapper SHALL be `bg-transparent` with a translucent bottom border, instead of `bg-white border-b border-border`. The select and input fields keep their white background for legibility, and the submit button keeps `bg-primary`. En el modo default (`transparent=false`), el wrapper SHALL usar el token `border-border` (resolving to `--color-border` `#E3E8ED`) — la utility obsoleta `border-gray-200` y la paleta por defecto Tailwind `gray-*` NO se usan en el wrapper ni en ningún control.

#### Scenario: Transparent mode removes the white wrapper
- **WHEN** SearchForm renders with `transparent: true`
- **THEN** the `role="search"` wrapper carries `bg-transparent`
- **AND** the wrapper does NOT contain `bg-white` nor `border-gray-200`
- **AND** the input fields still carry `bg-white`

#### Scenario: Default mode keeps the white wrapper with border-border
- **WHEN** SearchForm renders without `transparent`
- **THEN** the `role="search"` wrapper carries `bg-white border-b border-border`
- **AND** the wrapper does NOT contain `border-gray-200` (the obsolete gray literal)

#### Scenario: Submit button uses primary token in transparent mode
- **WHEN** SearchForm renders with `transparent: true`
- **THEN** the submit button carries `bg-primary` (not `bg-accent`)
- **AND** the submit button carries `bg-white` on the input/select fields

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
The category list rendered by `SearchForm` SHALL be derived at build time from the public endpoint `GET /api/v1/categories?activa=true` via the `getSearchFormCategories()` function in `lib/api/categories.ts`. The form action, submit label, input placeholder and field names SHALL continue to come from `getSearchFormConfig()` (overridable via environment variables with sensible defaults). The first option SHALL always be `{ id: "", label: "Todas las categorías" }`. The remaining options SHALL be mapped from active categories as `{ id, label: nombre }`, ordered by `orden` ascending and then by `nombre` ascending. If the API is unreachable at build time, `getSearchFormCategories()` SHALL fall back to returning only the default option so the static build never fails. The `SearchForm.astro` component SHALL remain a dumb presentational component that receives `categories` via props; the fetch SHALL NOT occur in the component frontmatter (it lives in `lib/api/categories.ts`).

#### Scenario: Categories are sourced from the backend at build time
- **WHEN** the SearchForm is rendered through `Layout.astro`
- **THEN** the `categories` prop is produced by `getSearchFormCategories()` (no longer the previously hardcoded `CATEGORY_OPTIONS` constant)
- **AND** the `Layout.astro` frontmatter performs no direct `fetch` or `import.meta.env` access (fetching lives in `lib/api/categories.ts`)

#### Scenario: Default option is first with empty id
- **WHEN** `getSearchFormCategories()` resolves categories
- **THEN** the first option is `{ id: "", label: "Todas las categorías" }`
- **AND** subsequent options have non-empty string `id`

#### Scenario: Active categories are mapped and sorted
- **WHEN** the API returns active categories `[{ orden: 2, nombre: "Seguridad" }, { orden: 1, nombre: "Herramientas" }]`
- **THEN** the rendered options after the default are `Herramientas` then `Seguridad` (ordered by `orden`, then `nombre`)

#### Scenario: Fallback when API is unavailable
- **WHEN** the fetch to the categories endpoint fails at build time
- **THEN** `getSearchFormCategories()` returns only `[{ id: "", label: "Todas las categorías" }]`
- **AND** the static build completes without error

#### Scenario: SEARCH_FORM_CONFIG falls back to defaults when env vars are missing
- **WHEN** `getSearchFormConfig()` is called without `SEARCH_RESULTS_PATH`, `SEARCH_SUBMIT_LABEL`, `SEARCH_PLACEHOLDER` set
- **THEN** it returns `{ action: "/productos", submitLabel: "BUSCAR", inputPlaceholder: "¿Qué productos estás buscando?", inputName: "q", selectName: "categoriaId" }`

#### Scenario: SEARCH_FORM_CONFIG honours env vars when present
- **WHEN** `getSearchFormConfig()` is called with `SEARCH_RESULTS_PATH="/catalogo"` and `SEARCH_SUBMIT_LABEL="IR"` set
- **THEN** it returns `{ action: "/catalogo", submitLabel: "IR", inputPlaceholder: "¿Qué productos estás buscando?", inputName: "q", selectName: "categoriaId" }`

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

### Requirement: Submit button renders a search icon before the label
The submit button SHALL render a `lucide:search` icon (via `astro-icon` `<Icon>`) positioned before the visible submit label text. The icon SHALL carry `aria-hidden="true"` because the button's accessible name is the visible text label. The icon SHALL use a 16px size (`h-4 w-4`).

#### Scenario: Search icon present before text label
- **WHEN** the search-form renders
- **THEN** the `<button type="submit">` contains an `<Icon>` element with `name="lucide:search"`
- **AND** the `<Icon>` carries `aria-hidden="true"`
- **AND** the `<Icon>` precedes the visible `{config.submitLabel}` text content within the button
- **AND** the button's accessible name remains exactly `config.submitLabel` (e.g. "BUSCAR")

#### Scenario: Icon size is 16px
- **WHEN** the search icon renders inside the button
- **THEN** the `<Icon>` carries class `h-4` and `w-4` (16px × 16px)

### Requirement: SearchForm inner container is constrained to 760px and centered with mobile horizontal padding
The SearchForm SHALL constrain its form content area to a maximum width of 760px and center it horizontally. The inner container div (direct parent of `<form>`) SHALL carry `max-w-[760px]` and `mx-auto` and SHALL NOT carry the `container` utility (which applies `max-w-7xl` = 1280px with horizontal padding). On mobile viewports, the inner container SHALL carry `px-4` horizontal padding so the form does not touch the screen edges; this padding SHALL be removed from the `md` breakpoint (>= 768px) upward via `md:px-0` so the 760px box uses its full width on desktop. The inner container SHALL NOT carry `px-6` or `px-8` (only `px-4` on mobile is allowed). The outer `role="search"` wrapper SHALL retain full viewport width with its background and border.

#### Scenario: Inner container uses max-w-760px and mobile horizontal padding
- **WHEN** the SearchForm renders
- **THEN** the div directly wrapping `<form>` carries `max-w-[760px]`
- **AND** that div carries `mx-auto` (centered)
- **AND** that div does NOT contain the `container` utility class (which is `max-w-7xl`)
- **AND** that div carries `px-4` (16px horizontal padding on mobile)
- **AND** that div carries `md:px-0` (padding removed from md breakpoint upward)
- **AND** that div does NOT contain `px-6` or `px-8` (only px-4 on mobile is allowed)

### Requirement: Desktop controls separated by 1px horizontal gap
When the three controls (select, input, button) render on the same horizontal row (viewport ≥ 768px, `md:flex-row`), they SHALL be separated by exactly 1px. The `<form>` element SHALL use `md:gap-px` (Tailwind `gap: 1px`) on the desktop breakpoint, while retaining `gap-3` (12px) on mobile for vertical stacking separation.

#### Scenario: Desktop uses 1px gap between controls
- **WHEN** the SearchForm renders on a viewport ≥ 768px
- **THEN** the `<form>` carries the class `md:gap-px`
- **AND** the `<form>` does NOT carry `md:gap-3` (12px is replaced by 1px on desktop)
- **AND** on mobile the `<form>` still carries `gap-3` (12px vertical separation)

#### Scenario: Bounding boxes differ by ≤ 2px on desktop
- **WHEN** the SearchForm renders at 1280×720 viewport
- **THEN** the right edge of the `<select>` and the left edge of the `<input>` differ by ≤ 2px (1px gap + border tolerance)
- **AND** the right edge of the `<input>` and the left edge of the `<button>` differ by ≤ 2px

