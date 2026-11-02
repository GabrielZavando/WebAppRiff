## REMOVED Requirements

### Requirement: SearchForm renders the submit button

**Reason**: El requisito exigía mostrar el ícono y el texto `submitLabel` desde `sm` con `px-8`. El cliente pidió que desde `sm` el botón muestre ÚNICAMENTE el ícono de la lupa, con un ancho máximo de 60px, dejando el ancho liberado a los otros controles.

**Migration**: El requisito queda reemplazado por "SearchForm renders an icon-only submit button". El botón conserva `bg-primary`, `hover:bg-primary-dark`, `aria-label="BUSCAR"`, el ícono `lucide:search` decorativo, el layout `flex items-center justify-center` y el design plano (sin `rounded*`); cambia el padding de `sm:px-8` a `px-4` y se agrega `sm:max-w-[60px]`.

### Requirement: Submit button renders a search icon before the label

**Reason**: El requisito fijaba que desde `sm` el texto del botón volviera a ser visible. Con el botón solo-ícono esa restauración deja de aplicar.

**Migration**: El requisito queda reemplazado por "Search button renders a search icon before the hidden label". El `<span>` con `config.submitLabel` permanece en el DOM con la utility `hidden` (sin variante `sm:`) y el nombre accesible lo aporta `aria-label="BUSCAR"`.

## ADDED Requirements

### Requirement: SearchForm renders an icon-only submit button

The search-form SHALL render a `<button type="submit">` using the `--color-primary` (`#41B3C4`) token via the Tailwind utility `bg-primary` (with a hover state derived from `--color-primary-dark` `#2E9AAD`). The button SHALL display only the `lucide:search` icon at every breakpoint, with no visible text, and SHALL expose the accessible name `BUSCAR` via `aria-label="BUSCAR"`. The icon SHALL remain decorative (`aria-hidden="true"`).

- **Mobile (`< 640px`)**: the button SHALL use compact horizontal padding (`px-4`) and SHALL NOT stretch to the full form width.
- **From `sm` (≥ 640px)**: the button SHALL keep the compact horizontal padding (`px-4`), SHALL NOT restore the wide `px-8`, and SHALL be constrained to a maximum width of 60px (`sm:max-w-[60px]`), so the row of controls does not lose width to the label.

The button SHALL NOT apply `rounded` (flat design con radio 0). The obsolete utility `bg-brand-orange` and references to `--color-brand-orange` SHALL NOT appear. The previous contract that required visible text and `px-8` from `sm` upward is superseded.

#### Scenario: Submit button hover resolves to primary-dark token

- **WHEN** the submit button is hovered
- **THEN** its background color resolves from `--color-primary-dark` (`#2E9AAD`)
- **AND** its class contains `hover:bg-primary-dark`

#### Scenario: Button uses flex layout for the icon alignment

- **WHEN** el search-form se renderiza
- **THEN** el `<button type="submit">` lleva `flex items-center justify-center gap-2`
- **AND** el ícono queda centrado verticalmente

#### Scenario: Button uses compact horizontal padding at every breakpoint

- **WHEN** el search-form se renderiza en un viewport `>= 640px`
- **THEN** el `<button type="submit">` lleva `px-4` (no `px-8` ni `px-6`)
- **AND** en móvil mantiene `px-4`

#### Scenario: Button shows only the search icon at every breakpoint

- **WHEN** el search-form se renderiza en cualquier viewport
- **THEN** el `<button type="submit">` contiene el ícono `lucide:search`
- **AND** no muestra texto visible de `config.submitLabel`
- **AND** el `<button>` lleva `aria-label="BUSCAR"`
- **AND** el ícono lleva `aria-hidden="true"`

#### Scenario: Button accessible name is BUSCAR

- **WHEN** un lector de pantalla enfoca el botón de búsqueda
- **THEN** el nombre accesible del botón es `BUSCAR`

#### Scenario: From sm the button is capped at 60px wide

- **WHEN** el search-form se renderiza en un viewport `>= 640px`
- **THEN** el `<button type="submit">` lleva `sm:max-w-[60px]`
- **AND** su ancho renderizado es de como máximo 60px (±1px)
- **AND** el ícono de 16px permanece visible dentro del botón

#### Scenario: Submit button uses primary token and flat square corners

- **WHEN** the search-form renders
- **THEN** the `<button type="submit">` carries the `bg-primary` class (resolving to `#41B3C4`)
- **AND** its `class` attribute contains `hover:bg-primary-dark`
- **AND** its `class` attribute does NOT contain `bg-accent`
- **AND** its `class` attribute does NOT contain `rounded` (nor any `rounded-*` variant)

### Requirement: Search button renders a search icon before the hidden label

The submit button SHALL render a `lucide:search` icon (via `astro-icon` `<Icon>`) positioned before the submit label text in the DOM. The icon SHALL carry `aria-hidden="true"` and SHALL use a 16px size (`h-4 w-4`). The submit label text SHALL remain in the DOM but SHALL be visually hidden at every breakpoint (`hidden` utility, without any `sm:` variant that re-shows it), and the accessible name SHALL be provided by `aria-label="BUSCAR"`.

#### Scenario: Search icon present before text label

- **WHEN** the search-form renders
- **THEN** the `<button type="submit">` contains an `<Icon>` element with `name="lucide:search"`
- **AND** the `<Icon>` carries `aria-hidden="true"`
- **AND** the `<Icon>` precedes the submit label text within the button

#### Scenario: Icon size is 16px

- **WHEN** the search icon renders inside the button
- **THEN** the `<Icon>` carries class `h-4` and `w-4` (16px × 16px)

#### Scenario: Label text is visually hidden at every breakpoint

- **WHEN** el search-form se renderiza en cualquier viewport
- **THEN** el texto `config.submitLabel` no es visible
- **AND** el `<span>` que lo contiene lleva la utility `hidden` y NO lleva ninguna variante `sm:` que lo vuelva a mostrar
- **AND** el botón conserva el nombre accesible `BUSCAR`

## MODIFIED Requirements

### Requirement: SearchForm layout is responsive

El search-form SHALL organizar sus controles con enfoque mobile-first:

- **Below `sm` (< 640px)**: el `<select>` SHALL ocupar una fila completa y el `<input>` y el `<button>` SHALL compartir una segunda fila, con el botón pegado al costado derecho del input y sin separación horizontal entre ellos. El formulario SHALL usar una grilla de dos columnas (`grid-cols-[minmax(0,1fr)_auto]`), el select SHALL abarcar ambas columnas (`col-span-2`), el contenedor del input SHALL declarar `min-w-0` y el botón SHALL declarar `shrink-0`.
- **From `sm` (≥ 640px)**: los tres controles SHALL volver a una sola fila horizontal. El contenedor del `<select>` y el contenedor del `<input>` SHALL repartirse el espacio restante de forma equitativa, declarando ambos `sm:flex-1` y `min-w-0` (base de crecimiento 0%, de modo que cada uno ocupe la mitad del espacio libre); el `<button>` SHALL conservar `shrink-0` y SHALL ocupar como máximo 60px (`sm:max-w-[60px]`). El `<select>` SHALL NOT conservar el ancho fijo `sm:w-64` ni `sm:shrink-0`, que quedan supersedidos por el reparto equitativo.
- **Short viewports (height <= 400px)**: los tres controles SHALL mantenerse en una sola fila con padding vertical reducido, preservando el presupuesto de altura del grupo sticky. El ancho compacto de 176px del select SHALL aplicar solo por debajo de `sm` (< 640px), donde además SHALL declarar `shrink-0` para que el input no lo comprima; desde `sm` el select se reparte el espacio con el input, sin ancho fijo.

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
- **THEN** el contenedor del `<select>` declara `sm:flex-1` y `min-w-0`
- **AND** el contenedor del `<input>` declara `sm:flex-1` y `min-w-0`
- **AND** el contenedor del `<select>` NO declara `sm:w-64` ni `sm:shrink-0`
- **AND** la diferencia entre el ancho renderizado del `<select>` y el del `<input>` es de ≤ 2px (reparto equitativo)
- **AND** el ancho renderizado del `<select>` es de al menos 256px menos el borde (±1px), de modo que "Todas las categorías" se muestre completo, sin truncarse
- **AND** el ancho renderizado del `<button>` es de como máximo 60px (±1px)
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

### Requirement: SearchForm renders a labelled search input

The search-form SHALL render a `<input type="search">` with `name="q"`, the configured placeholder, and a visually associated `<label>`. The input border SHALL use the `--color-border` token via `border-border`; el texto del control SHALL usar el token `text-text-2` (#5C6675). The input SHALL NOT apply `rounded` (flat design con radio 0). The default placeholder SHALL be "¿Qué estás buscando?" (changed from "¿Qué productos estás buscando?").

#### Scenario: Input rendered with placeholder
- **WHEN** the SearchForm renders with default config
- **THEN** an `<input type="search">` is rendered with `name="q"`
- **AND** its `placeholder` attribute equals "¿Qué estás buscando?" (default, changed from "¿Qué productos estás buscando?")
- **AND** a `<label>` element is rendered with `for` pointing to the input's `id`
- **AND** the label text is non-empty (e.g., "Buscar productos")
- **AND** the input carries `border-border` and `text-text-2` (not `text-gray-700`)
- **AND** the input does NOT carry `rounded` (nor any `rounded-*` variant)

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
- **THEN** it returns `{ action: "/productos", submitLabel: "BUSCAR", inputPlaceholder: "¿Qué estás buscando?", inputName: "q", selectName: "categoriaId" }`

#### Scenario: SEARCH_FORM_CONFIG honours env vars when present
- **WHEN** `getSearchFormConfig()` is called with `SEARCH_RESULTS_PATH="/catalogo"` and `SEARCH_SUBMIT_LABEL="IR"` set
- **THEN** it returns `{ action: "/catalogo", submitLabel: "IR", inputPlaceholder: "¿Qué estás buscando?", inputName: "q", selectName: "categoriaId" }`
