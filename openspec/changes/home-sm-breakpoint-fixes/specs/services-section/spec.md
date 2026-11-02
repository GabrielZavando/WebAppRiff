## MODIFIED Requirements

### Requirement: ServicesSection renders a responsive 2x2 grid of service cards (mobile-first)

The `services-section` SHALL render a grid of `services` cards sized responsively mobile-first: 1 column on mobile (`< 640px`) and 2 columns from the `sm` breakpoint (`>= 640px`). The grid container SHALL carry the Tailwind utility classes `grid-cols-1 sm:grid-cols-2` and a consistent gap utility. The grid SHALL render exactly N `<article>` cards, where N equals the length of the `services` prop.

#### Scenario: Card grid uses responsive column classes (mobile-first)

- **WHEN** the ServicesSection renders with 4 services
- **THEN** the rendered card grid container carries `grid-cols-1` (mobile default)
- **AND** the rendered card grid container carries `sm:grid-cols-2` (two columns from the `sm` breakpoint)
- **AND** the rendered card grid container does NOT carry `md:grid-cols-2` as its first two-column breakpoint

#### Scenario: Grid shows two columns at 640px

- **WHEN** la home se carga en el viewport `640×800`
- **THEN** la grilla de "Servicios especializados" muestra exactamente 2 columnas
- **AND** las tarjetas quedan contenidas dentro del ancho del viewport sin scroll horizontal
- **AND** el texto de cada tarjeta no desborda su tarjeta

#### Scenario: Grid renders exactly N cards matching the services prop length

- **WHEN** the ServicesSection renders with `services` of length 4
- **THEN** the card grid contains exactly 4 `<article>` elements
- **AND** each `<article>` contains the image, title, description and CTA elements described in the per-card requirements
