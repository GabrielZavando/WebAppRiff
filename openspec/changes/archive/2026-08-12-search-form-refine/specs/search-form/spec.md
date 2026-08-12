# search-form Specification — DELTA (search-form-refine)

> This delta modifies requirements from the canonical spec at `openspec/specs/search-form/spec.md`.
> Archived at: `openspec/changes/search-form-refine/`

## MODIFIED Requirements

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

## ADDED Requirements

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

### Requirement: SearchForm inner container is constrained to 860px and centered
The SearchForm SHALL constrain its form content area to a maximum width of 860px and center it horizontally. The inner container div (direct parent of `<form>`) SHALL carry `max-w-[860px]` and `mx-auto` and SHALL NOT carry the `container` utility (which applies `max-w-7xl` = 1280px with horizontal padding). The outer `role="search"` wrapper SHALL retain full viewport width with its background and border.

#### Scenario: Inner container uses max-w-860px without padding
- **WHEN** the SearchForm renders
- **THEN** the div directly wrapping `<form>` carries `max-w-[860px]`
- **AND** that div carries `mx-auto` (centered)
- **AND** that div does NOT contain the `container` utility class (which is `max-w-7xl`)
- **AND** that div does NOT contain `px-4`, `px-6`, or `px-8` (no horizontal padding)

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
