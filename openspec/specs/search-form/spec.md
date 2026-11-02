# search-form Specification

## Purpose
Formulario de búsqueda del sitio: select de categorías con opción por defecto, input etiquetado, botón submit, modo transparente, landmark search y submit por GET a una URL canónica.

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

The search-form SHALL render a `<button type="submit">` using the `--color-primary` (`#41B3C4`) token via the Tailwind utility `bg-primary` (with a hover state derived from `--color-primary-dark` `#2E9AAD`). The button SHALL have two responsive presentations:

- **Mobile (`< 640px`)**: the button SHALL display only the `lucide:search` icon, with no visible text, and SHALL expose the accessible name `BUSCAR` via `aria-label="BUSCAR"`. The icon SHALL remain decorative (`aria-hidden="true"`). The button SHALL use compact horizontal padding and SHALL NOT stretch to the full form width.
- **From `sm` (≥ 640px)**: the button SHALL display the icon together with the configured `submitLabel` text, using `flex items-center justify-center gap-2` and `px-8`, with the heading font via `font-heading`, `font-semibold` weight, `text-xs` size and `uppercase tracking-wide`.

The button SHALL NOT apply `rounded` (flat design con radio 0). The obsolete utility `bg-brand-orange` and references to `--color-brand-orange` SHALL NOT appear. The previous contract that required visible text and `px-8` at every breakpoint is superseded for mobile.

#### Scenario: Submit button hover resolves to primary-dark token

- **WHEN** the submit button is hovered
- **THEN** its background color resolves from `--color-primary-dark` (`#2E9AAD`)
- **AND** its class contains `hover:bg-primary-dark`

#### Scenario: Button uses flex layout for icon + text alignment

- **WHEN** el search-form se renderiza en un viewport `>= 640px`
- **THEN** el `<button type="submit">` lleva `flex items-center justify-center gap-2`
- **AND** el ícono y el texto `BUSCAR` quedan centrados verticalmente
- **AND** el espacio entre ícono y texto es 0.5rem (`gap-2`)

#### Scenario: Button uses wider horizontal padding (px-8)

- **WHEN** el search-form se renderiza en un viewport `>= 640px`
- **THEN** el `<button type="submit">` lleva `px-8` (no `px-6`)
- **AND** en móvil usa padding horizontal compacto (`px-4`)

#### Scenario: Mobile button shows only the search icon

- **WHEN** el search-form se renderiza en un viewport `< 640px`
- **THEN** el `<button type="submit">` contiene el ícono `lucide:search`
- **AND** no muestra texto visible de `config.submitLabel`
- **AND** el `<button>` lleva `aria-label="BUSCAR"`
- **AND** el ícono lleva `aria-hidden="true"`

#### Scenario: Mobile button accessible name is BUSCAR

- **WHEN** un lector de pantalla enfoca el botón de búsqueda en un viewport `< 640px`
- **THEN** el nombre accesible del botón es `BUSCAR`

#### Scenario: From sm the button restores icon and visible text

- **WHEN** el search-form se renderiza en un viewport `>= 640px`
- **THEN** el `<button type="submit">` muestra el ícono y el texto `config.submitLabel`
- **AND** su clase contiene `flex items-center justify-center gap-2` y `px-8`
- **AND** su clase contiene `font-heading`, `font-semibold`, `text-xs`, `uppercase` y `tracking-wide`

#### Scenario: Submit button uses primary token and flat square corners

- **WHEN** the search-form renders
- **THEN** the `<button type="submit">` carries the `bg-primary` class (resolving to `#41B3C4`)
- **AND** its `class` attribute contains `hover:bg-primary-dark`
- **AND** its `class` attribute does NOT contain `bg-accent`
- **AND** its `class` attribute does NOT contain `rounded` (nor any `rounded-*` variant)

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

El search-form SHALL organizar sus controles con enfoque mobile-first:

- **Below `sm` (< 640px)**: el `<select>` SHALL ocupar una fila completa y el `<input>` y el `<button>` SHALL compartir una segunda fila, con el botón pegado al costado derecho del input y sin separación horizontal entre ellos. El formulario SHALL usar una grilla de dos columnas (`grid-cols-[minmax(0,1fr)_auto]`), el select SHALL abarcar ambas columnas (`col-span-2`), el contenedor del input SHALL declarar `min-w-0` y el botón SHALL declarar `shrink-0`.
- **From `sm` (≥ 640px)**: los tres controles SHALL volver a una sola fila horizontal. El contenedor del `<select>` SHALL reservar un ancho fijo suficiente para mostrar completo el texto de su opción más larga y SHALL declarar `sm:shrink-0` para que no se comprima; el contenedor del `<input>` SHALL declarar `sm:flex-1 min-w-0` y ocupar todo el espacio restante.
- **Short viewports (height <= 400px)**: los tres controles SHALL mantenerse en una sola fila con padding vertical reducido, preservando el presupuesto de altura del grupo sticky. El ancho compacto de 176px del select SHALL aplicar solo por debajo de `sm` (< 640px), donde además SHALL declarar `shrink-0` para que el input no lo comprima; desde `sm` el select conserva `sm:w-64` (256px) aunque la altura sea <= 400px, para no truncar "Todas las categorías".

El layout móvil SHALL permanecer contenido dentro del ancho del viewport sin scroll horizontal. En `sm` el texto del select NO SHALL truncarse ni quedar oculto por el ancho asignado.

#### Scenario: Desktop single row (>= 768px)

- **WHEN** el SearchForm se renderiza en un viewport `>= 640px`
- **THEN** el `<form>` usa `flex-row`
- **AND** el `<select>`, el `<input>` y el `<button>` comparten una fila horizontal
- **AND** el input se expande para llenar el espacio disponible

#### Scenario: Mobile stacked layout (< 768px)

- **WHEN** el SearchForm se renderiza en un viewport `< 640px`
- **THEN** el `<select>` ocupa su propia fila
- **AND** el `<input>` y el `<button>` comparten una segunda fila
- **AND** no hay separación horizontal entre input y botón

#### Scenario: Mobile keeps select on its own row and input + button together

- **WHEN** el SearchForm se renderiza en un viewport de 375×667
- **THEN** el `<form>` usa una grilla de dos columnas
- **AND** el `<select>` ocupa la fila superior completa
- **AND** el `<input>` y el `<button>` comparten la fila inferior
- **AND** la separación horizontal entre el borde derecho del input y el borde izquierdo del botón es de 0px (tolerancia de 1px por borde)
- **AND** existe una separación vertical de 12px entre la fila del select y la fila del input/botón

#### Scenario: From sm the three controls share one row

- **WHEN** el SearchForm se renderiza en un viewport `>= 640px`
- **THEN** el `<form>` usa `flex-row`
- **AND** el `<select>`, el `<input>` y el `<button>` comparten una sola fila horizontal
- **AND** el input se expande para llenar el espacio disponible

#### Scenario: Select keeps its full label and input takes the remaining width at sm

- **WHEN** el SearchForm se renderiza en el viewport `640×800`
- **THEN** el contenedor del `<select>` declara `sm:w-64` y `sm:shrink-0`
- **AND** el ancho renderizado del `<select>` es de al menos 256px menos el borde (±1px)
- **AND** el texto "Todas las categorías" se muestra completo, sin truncarse
- **AND** el contenedor del `<input>` declara `sm:flex-1` y `min-w-0`
- **AND** el `<input>` ocupa el espacio restante de la fila
- **AND** los tres controles permanecen dentro del ancho del viewport

#### Scenario: Short viewports keep a single compact row

- **WHEN** el SearchForm se renderiza en un viewport de 568×320
- **THEN** los tres controles comparten una sola fila
- **AND** el padding vertical del contenedor interno es menor que en portrait
- **AND** el contenedor del select declara el ancho compacto de 176px (`w-44`) porque el ancho es `< 640px`
- **AND** el ancho renderizado del `<select>` es de al menos 170px, sin ser comprimido por el input
- **AND** no hay scroll horizontal

#### Scenario: Large phone in landscape keeps the full select label

- **WHEN** el SearchForm se renderiza en el viewport `640×375` (altura <= 400px, ancho `>= 640px`)
- **THEN** los tres controles comparten una sola fila
- **AND** el padding vertical del contenedor interno se mantiene reducido
- **AND** el contenedor del select NO aplica el ancho compacto de 176px
- **AND** el ancho renderizado del `<select>` es de al menos 256px menos el borde (±1px)
- **AND** el texto "Todas las categorías" se muestra completo, sin truncarse
- **AND** no hay scroll horizontal

#### Scenario: No horizontal overflow at 320px

- **WHEN** se carga cualquier página con buscador en un viewport de 320×568
- **THEN** `document.documentElement.scrollWidth` no supera `document.documentElement.clientWidth + 1`
- **AND** el `boundingBox` del `<form>` queda dentro del ancho del viewport

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

### Requirement: Submit button renders a search icon before the label

The submit button SHALL render a `lucide:search` icon (via `astro-icon` `<Icon>`) positioned before the submit label text in the DOM. The icon SHALL carry `aria-hidden="true"` and SHALL use a 16px size (`h-4 w-4`). On mobile (`< 640px`) the label text SHALL remain in the DOM but hidden from visual rendering, and the accessible name SHALL be provided by `aria-label="BUSCAR"`. From `sm` upward the label text SHALL be visible and the icon SHALL precede it.

#### Scenario: Search icon present before text label

- **WHEN** the search-form renders
- **THEN** the `<button type="submit">` contains an `<Icon>` element with `name="lucide:search"`
- **AND** the `<Icon>` carries `aria-hidden="true"`
- **AND** the `<Icon>` precedes the submit label text within the button

#### Scenario: Icon size is 16px

- **WHEN** the search icon renders inside the button
- **THEN** the `<Icon>` carries class `h-4` and `w-4` (16px × 16px)

#### Scenario: Mobile label is visually hidden but accessible name remains BUSCAR

- **WHEN** el search-form se renderiza en un viewport `< 640px`
- **THEN** el texto `config.submitLabel` no es visible
- **AND** el botón conserva el nombre accesible `BUSCAR`

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

When the three controls (select, input, button) render on the same horizontal row (`>= 640px`, `sm:flex-row`), they SHALL be separated by exactly 1px via `sm:gap-px`. Below `sm`, the select SHALL be separated from the input/button row by a 12px vertical gap (`gap-y-3`), while the input and button SHALL be adjacent with no horizontal gap between them.

#### Scenario: Desktop uses 1px gap between controls

- **WHEN** el SearchForm se renderiza en un viewport `>= 640px`
- **THEN** el `<form>` lleva `sm:gap-px`
- **AND** el `<form>` no lleva `sm:gap-3`
- **AND** en móvil el select se separa de la fila input/botón con `gap-y-3`

#### Scenario: Bounding boxes differ by ≤ 2px on desktop

- **WHEN** el SearchForm se renderiza en un viewport de 1280×720
- **THEN** el borde derecho del `<select>` y el borde izquierdo del `<input>` difieren en ≤ 2px
- **AND** el borde derecho del `<input>` y el borde izquierdo del `<button>` difieren en ≤ 2px

#### Scenario: From sm the controls use a 1px gap

- **WHEN** el SearchForm se renderiza en un viewport `>= 640px`
- **THEN** el `<form>` lleva `sm:gap-px`
- **AND** el `<form>` no lleva `sm:gap-3`

#### Scenario: Mobile separates select from the input/button row

- **WHEN** el SearchForm se renderiza en un viewport `< 640px`
- **THEN** el `<form>` lleva `gap-y-3`
- **AND** el input y el botón no tienen gap horizontal entre ellos

#### Scenario: Bounding boxes differ by ≤ 2px from sm upward

- **WHEN** el SearchForm se renderiza en un viewport de 1280×720
- **THEN** el borde derecho del `<select>` y el borde izquierdo del `<input>` difieren en ≤ 2px
- **AND** el borde derecho del `<input>` y el borde izquierdo del `<button>` difieren en ≤ 2px

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


#### Scenario: Desborde en viewport móvil
- **WHEN** se carga cualquier página con buscador en el viewport `320×568`
- **THEN** `document.documentElement.scrollWidth` no supera `document.documentElement.clientWidth + 1`
- **AND** el `boundingBox` del `<form>` del buscador queda dentro del ancho del viewport
