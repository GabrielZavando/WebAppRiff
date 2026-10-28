# panel-home Specification

## MODIFIED Requirements

### Requirement: PanelHome renders the right half with a 2×2 grid of four statistics over a white background
The `panel-home` SHALL render its right half as a `<div>` (or equivalent) carrying the `bg-white` class, containing exactly four stat cells laid out in a `grid-cols-2` grid (2 rows × 2 columns). Each stat cell SHALL render the `value` as a large bold paragraph con la heading font via `font-heading font-bold` (Montserrat 700) y class `text-secondary` (instead of the obsolete `text-brand-navy`), and the `label` as a small uppercase paragraph below it que aplica la body font implícita (`font-body`, Open Sans) y el token `text-text-2` (#5C6675) en lugar de la paleta por defecto Tailwind `text-gray-*`. The grid SHALL keep `grid-cols-2` across all viewports (mobile and desktop). Each stat cell SHALL adapt its inner padding and the font size of the value to the available width so that the longest configured value (`30.000+`) stays fully inside its cell at 320px and 375px viewports. (MODIFIED in `responsive-web-design-fixes` — se exige contención del valor dentro de la celda en viewports estrechos.)

#### Scenario: Stat value uses secondary and heading font
- **WHEN** the PanelHome renders a stat cell
- **THEN** the value `<p>` carries `text-secondary` (resolving to `#1F2D40`)
- **AND** the value `<p>` carries `font-heading` and `font-bold` classes (Montserrat 700)
- **AND** its class string does NOT contain `text-brand-navy`

#### Scenario: Stat label uses text-text-2 (no gray-*)
- **WHEN** the PanelHome renders a stat cell
- **THEN** the label `<p>` carries the `text-text-2` class (resolving to `#5C6675`)
- **AND** the label `<p>` does NOT contain `text-gray-600`, `text-gray-700` nor any `text-gray-*` literal en su class string

#### Scenario: El valor más largo queda dentro de su celda
- **WHEN** el PanelHome se renderiza en el viewport `320×568` o `375×667`
- **THEN** el `boundingBox` del párrafo de valor `30.000+` queda dentro del `boundingBox` de su celda
- **AND** el texto `30.000+` es visible completo (no recortado ni desbordado)

#### Scenario: Padding de la celda adaptado al viewport
- **WHEN** se inspecciona el source de `PanelHome.astro`
- **THEN** la celda de estadística declara un padding horizontal menor en la base (móvil) que en `md:` (por ejemplo `p-4 md:p-8 md:lg:p-12`)
- **AND** el padding de la mitad derecha NO mantiene `p-8 md:p-12` como único valor en móvil

### Requirement: PanelHome reduces its inner padding on desktop
The `panel-home` left half (`<div>` carrying `bg-primary`) SHALL use reduced inner padding on desktop: `lg:p-12` (48px) instead of the larger `lg:p-16` (64px) used previously, so the panel reads tighter on large screens. The mobile/tablet padding (`p-8 md:p-12`) is unchanged for the left half. The right half SHALL use a responsive padding that keeps the stat values contained on narrow viewports (e.g. `p-4 md:p-8 lg:p-12`) instead of the previous fixed `p-8 md:p-12`. (MODIFIED in `responsive-web-design-fixes` — el padding de la mitad derecha se hace responsivo para evitar el recorte de los valores en 320–375px.)

#### Scenario: Left half uses reduced desktop padding lg:p-12
- **WHEN** the PanelHome renders the left (bg-primary) half
- **THEN** the left half `<div>` carries `lg:p-12`
- **AND** the left half `<div>` does NOT carry `lg:p-16`

#### Scenario: Right half uses a responsive padding
- **WHEN** el PanelHome renderiza la mitad derecha (`bg-white`)
- **THEN** sus celdas de estadística declaran un padding base menor que el aplicado en `md:`/`lg:`
- **AND** el padding en `lg:` se mantiene en `p-12` para conservar la densidad desktop

## ADDED Requirements

### Requirement: PanelHome stat values scale down on narrow viewports

El tamaño de fuente computado del valor de cada estadística SHALL adaptarse al ancho disponible: el valor SHALL usar un tamaño base reducido en móvil y escalar hacia arriba en `md:`. La celda SHALL impedir además el desborde horizontal mediante `min-w-0` y/o quiebre de palabra sobre el texto del valor.

#### Scenario: Escala tipográfica del valor

- **WHEN** se mide el `font-size` computado del valor `30.000+` en los viewports `320×568`, `375×667` y `1280×800`
- **THEN** el valor en `320×568` es menor que el valor en `1280×800`
- **AND** el valor en `375×667` es menor o igual que el valor en `1280×800`

#### Scenario: La celda no impone un ancho mínimo

- **WHEN** se renderiza el PanelHome en el viewport `320×568`
- **THEN** la celda de estadística no declara un `min-width` superior al ancho disponible de su columna
- **AND** la celda sigue siendo visible y con el texto completo
