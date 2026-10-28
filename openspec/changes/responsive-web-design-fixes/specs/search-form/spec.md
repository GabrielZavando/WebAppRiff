# search-form Specification

## MODIFIED Requirements

### Requirement: SearchForm layout is responsive

The search-form SHALL render the three controls (select, input, button) inline on desktop viewports (>= 768px) and stacked vertically full-width on mobile viewports (< 768px). On short viewports (height <= 400px, e.g. `568×320`) the search-form SHALL compact itself: the vertical padding of its inner container SHALL be reduced and the three controls SHALL be laid out in a single row (the category select keeping a bounded width) so that the sticky header + search group respects the viewport-height budget defined in `responsive-layout`. The compaction SHALL NOT apply to desktop viewports with a landscape orientation but a larger height (e.g. `1440×900`). (MODIFIED in `responsive-web-design-fixes` — compactación por altura de viewport.)

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

#### Scenario: Compactación en viewports de baja altura
- **WHEN** el SearchForm se renderiza en un viewport de altura <= 400px (por ejemplo `568×320`)
- **THEN** el contenedor interno del buscador declara un padding vertical menor que en portrait (variante `[@media(max-height:400px)]:`)
- **AND** los tres controles se mantienen en una sola fila, en lugar de apilarse verticalmente
- **AND** la compactación NO se aplica en un viewport de escritorio con orientación landscape y altura mayor (por ejemplo `1440×900`)

#### Scenario: El buscador no domina el alto del viewport
- **WHEN** la home se renderiza en el viewport `568×320`
- **THEN** la altura del buscador es menor o igual al 25% de la altura del viewport (80px)
- **AND** el grupo sticky (header + buscador) no supera el 50% de la altura del viewport

## ADDED Requirements

### Requirement: SearchForm never forces horizontal overflow

El buscador global SHALL permanecer dentro del ancho del viewport en todos los anchos soportados. Sus controles SHALL declarar `min-w-0` (o equivalente) en el layout flexible para que el campo de texto pueda encogerse por debajo de su ancho intrínseco, y el botón de envío SHALL mantener `whitespace-nowrap` sin exceder el ancho disponible.

#### Scenario: Sin scroll horizontal en el buscador

- **WHEN** se carga cualquier página con buscador en el viewport `320×568`
- **THEN** `document.documentElement.scrollWidth` no supera `document.documentElement.clientWidth + 1`
- **AND** el `boundingBox` del `<form>` del buscador queda dentro del ancho del viewport
