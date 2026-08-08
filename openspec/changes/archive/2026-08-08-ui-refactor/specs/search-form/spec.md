## MODIFIED Requirements

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
The search-form SHALL render a `<input type="search">` with `name="q"`, the configured placeholder, and a visually associated `<label>`. The input border SHALL use the `--color-border` token via `border-border`; el texto del control SHALL usar el token `text-text-2` (#5C6675) en lugar de la paleta por defecto Tailwind `text-gray-*`. The input SHALL NOT apply `rounded` (flat design con radio 0).

#### Scenario: Input rendered with placeholder
- **WHEN** the SearchForm renders with default config
- **THEN** an `<input type="search">` is rendered with `name="q"`
- **AND** its `placeholder` attribute equals the configured placeholder text (default "¿Qué solución está buscando?")
- **AND** a `<label>` element is rendered with `for` pointing to the input's `id`
- **AND** the label text is non-empty (e.g., "Buscar productos")
- **AND** the input carries `border-border` and `text-text-2` (not `text-gray-700`)
- **AND** the input does NOT carry `rounded` (nor any `rounded-*` variant)

#### Scenario: Initial query pre-filled when provided
- **WHEN** the SearchForm renders with `initialQuery="taladro"`
- **THEN** the search input's `value` attribute equals "taladro"
- **AND** `initialQuery` is reflected verbatim without trimming in the rendered value

### Requirement: SearchForm renders the submit button
The search-form SHALL render a `<button type="submit">` labelled with the configured submit text using the `--color-accent` (`#F26A21`) token via the Tailwind utility `bg-accent` (with a hover state derived from `--color-accent-dark` `#D14E12`). The button SHALL apply la heading font via `font-heading` (Montserrat) con peso `font-semibold` (600), `text-xs` size y `uppercase tracking-wide` per la escala tipográfica canónica. The button SHALL NOT apply `rounded` (flat design con radio 0). The obsolete utility `bg-brand-orange` and references to `--color-brand-orange` SHALL NOT appear.

#### Scenario: Submit button uses accent token and flat square corners
- **WHEN** the search-form renders
- **THEN** the `<button type="submit">` carries the `bg-accent` class (resolving to `#F26A21`)
- **AND** its `class` attribute contains `font-heading` and `font-semibold`
- **AND** its `class` attribute does NOT contain `bg-brand-orange`
- **AND** its `class` attribute does NOT contain `rounded` (nor any `rounded-*` variant)
- **AND** the label text is the configured `submitLabel`

### Requirement: SearchForm supports a transparent mode
SearchForm SHALL accept an optional boolean prop `transparent` (default `false`). When `true`, the outer `role="search"` wrapper SHALL be `bg-transparent` with a translucent bottom border, instead of `bg-white border-b border-border`. The select and input fields keep their white background for legibility, and the submit button keeps `bg-accent`. En el modo default (`transparent=false`), el wrapper SHALL usar el token `border-border` (resolving to `--color-border` `#E3E8ED`) — la utility obsoleta `border-gray-200` y la paleta por defecto Tailwind `gray-*` NO se usan en el wrapper ni en ningún control.

#### Scenario: Transparent mode removes the white wrapper
- **WHEN** SearchForm renders with `transparent: true`
- **THEN** the `role="search"` wrapper carries `bg-transparent`
- **AND** the wrapper does NOT contain `bg-white` nor `border-gray-200`
- **AND** the input fields still carry `bg-white`

#### Scenario: Default mode keeps the white wrapper with border-border
- **WHEN** SearchForm renders without `transparent`
- **THEN** the `role="search"` wrapper carries `bg-white border-b border-border`
- **AND** the wrapper does NOT contain `border-gray-200` (the obsolete gray literal)
