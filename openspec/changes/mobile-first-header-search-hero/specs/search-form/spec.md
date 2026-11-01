## MODIFIED Requirements

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

### Requirement: SearchForm layout is responsive

El search-form SHALL organizar sus controles con enfoque mobile-first:

- **Below `sm` (< 640px)**: el `<select>` SHALL ocupar una fila completa y el `<input>` y el `<button>` SHALL compartir una segunda fila, con el botón pegado al costado derecho del input y sin separación horizontal entre ellos. El formulario SHALL usar una grilla de dos columnas (`grid-cols-[minmax(0,1fr)_auto]`), el select SHALL abarcar ambas columnas (`col-span-2`), el contenedor del input SHALL declarar `min-w-0` y el botón SHALL declarar `shrink-0`.
- **From `sm` (≥ 640px)**: los tres controles SHALL volver a una sola fila horizontal, con el input expandiéndose para ocupar el espacio disponible.
- **Short viewports (height <= 400px)**: los tres controles SHALL mantenerse en una sola fila con padding vertical reducido, preservando el presupuesto de altura del grupo sticky.

El layout móvil SHALL permanecer contenido dentro del ancho del viewport sin scroll horizontal.

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

#### Scenario: Short viewports keep a single compact row

- **WHEN** el SearchForm se renderiza en un viewport de 568×320
- **THEN** los tres controles comparten una sola fila
- **AND** el padding vertical del contenedor interno es menor que en portrait

#### Scenario: No horizontal overflow at 320px

- **WHEN** se carga cualquier página con buscador en un viewport de 320×568
- **THEN** `document.documentElement.scrollWidth` no supera `document.documentElement.clientWidth + 1`
- **AND** el `boundingBox` del `<form>` queda dentro del ancho del viewport

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
