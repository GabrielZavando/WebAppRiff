## MODIFIED Requirements

### Requirement: PanelHome renders the left half with eyebrow, headline, description and a navy CTA over a teal background
The `panel-home` SHALL render its left half as a `<div>` (or equivalent) carrying the `bg-primary` class (resolving to `--color-primary` `#41B3C4`), containing un eyebrow `<span>` (uppercase, not a heading) que aplica la heading font via `font-heading` (Montserrat) con peso `font-semibold` y size `text-xs tracking-wider`, a headline `<h2>` que aplica `font-heading font-bold`, a description `<p>` (Open Sans body implícito), and a single CTA `<a href="/contacto">` styled with `bg-secondary text-white font-heading font-semibold` (Montserrat 600, `text-xs uppercase tracking-wide`). The CTA SHALL NOT apply `rounded` (flat design con radio 0). The eyebrow SHALL NOT be rendered as a heading element (`<h1>`–`<h6>`). The obsolete utilities `bg-brand-teal` and `bg-brand-navy`, and references to `--color-brand-teal` / `--color-brand-navy`, SHALL NOT appear anywhere in the panel.

#### Scenario: Left half uses primary (not brand-teal)
- **WHEN** the PanelHome renders
- **THEN** the left half `<div>` carries `bg-primary` (computing to `rgb(65, 179, 196)`)
- **AND** its class string does NOT contain `bg-brand-teal`

#### Scenario: CTA uses secondary, flat square corners
- **WHEN** the PanelHome renders the `/contacto` CTA
- **THEN** the CTA `<a>` carries `bg-secondary text-white` (computing to `rgb(31, 45, 64)`)
- **AND** the CTA `<a>` carries `font-heading` and `font-semibold` classes (Montserrat 600)
- **AND** the CTA `<a>` does NOT contain `rounded` (nor any `rounded-*` variant) in its class
- **AND** its class string does NOT contain `bg-brand-navy`

#### Scenario: Eyebrow and headline use heading font
- **WHEN** the PanelHome renders the left half
- **THEN** the eyebrow `<span>` carries `font-heading` and `font-semibold` classes
- **AND** the headline `<h2>` carries `font-heading` and `font-bold` classes

### Requirement: PanelHome renders the right half with a 2×2 grid of four statistics over a white background
The `panel-home` SHALL render its right half as a `<div>` (or equivalent) carrying the `bg-white` class, containing exactly four stat cells laid out in a `grid-cols-2` grid (2 rows × 2 columns). Each stat cell SHALL render the `value` as a large bold paragraph con la heading font via `font-heading font-bold` (Montserrat 700) y class `text-secondary` (instead of the obsolete `text-brand-navy`), and the `label` as a small uppercase paragraph below it que aplica la body font implícita (`font-body`, Open Sans) y el token `text-text-2` (#5C6675) en lugar de la paleta por defecto Tailwind `text-gray-*`. The grid SHALL keep `grid-cols-2` across all viewports (mobile and desktop).

#### Scenario: Stat value uses secondary and heading font
- **WHEN** the PanelHome renders a stat cell
- **THEN** the value `<p>` carries `text-secondary` (resolving to `#1F2D40`)
- **AND** the value `<p>` carries `font-heading` and `font-bold` classes (Montserrat 700)
- **AND** its class string does NOT contain `text-brand-navy`

#### Scenario: Stat label uses text-text-2 (no gray-*)
- **WHEN** the PanelHome renders a stat cell
- **THEN** the label `<p>` carries the `text-text-2` class (resolving to `#5C6675`)
- **AND** the label `<p>` does NOT contain `text-gray-600`, `text-gray-700` nor any `text-gray-*` literal en su class string
