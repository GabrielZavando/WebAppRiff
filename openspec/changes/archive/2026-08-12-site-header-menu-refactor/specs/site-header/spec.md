## MODIFIED Requirements

### Requirement: Header renders navigation items in order
The site-header SHALL render the navigation items from the hardcoded `NAVIGATION_ITEMS`
constant in the declared order, followed by the CTA as the last item inside the
`<nav>` element. The CTA SHALL keep its `bg-accent` styling (styles unchanged) but
SHALL be rendered inside the `<nav>` rather than as a standalone element. The nav
SHALL be right-aligned on desktop.

#### Scenario: All items displayed in order (desktop)
- **WHEN** the Header renders on a desktop viewport (>= 1024px)
- **THEN** the nav items + CTA are rendered inside a `<nav aria-label="Navegación principal">`
- **AND** the labels appear in order: Inicio, Productos, Servicios, Marcas, Contacto,
  SOLICITAR COTIZACIÓN
- **AND** the nav is right-aligned (container uses `ml-auto` or equivalent)
- **AND** each nav link has the `href` declared in `NAVIGATION_ITEMS` or the `cta` prop
- **AND** the CTA maintains `bg-accent` styling (not relocated to a separate element)

#### Scenario: Updated navigation items
- **WHEN** `NAVIGATION_ITEMS` is inspected
- **THEN** it contains exactly 5 items
- **AND** the labels are: Inicio, Productos, Servicios, Marcas, Contacto
- **AND** the hrefs are: `/`, `/productos`, `/servicios`, `/marcas`, `/contacto`

### Requirement: Header marks the active item
The site-header SHALL mark the navigation item matching the current path as active.
The active state SHALL visually indicate selection via an underline using the
`--color-primary` (`#41B3C4`) token (utility `after:bg-primary`), and inactive items
SHALL show appropriate contrast for their background. The underline pseudo-element
SHALL have a thickness of **3px** (`after:h-[3px]`), replacing the previous 2px
(`after:h-0.5`). The obsolete utility `after:bg-brand-orange` and references to
`--color-brand-orange` SHALL NOT appear. The 3px underline applies on both desktop
and mobile.

#### Scenario: Active item has primary underline (desktop)
- **WHEN** the site-header renders with `activePath=/productos`
- **THEN** the navigation item whose `href=/productos` carries the `aria-current="page"` attribute
- **AND** that item has an `::after` pseudo-element whose background resolves to `--color-primary` (`#41B3C4`)
- **AND** that item's `::after` pseudo-element has a height of 3px (`after:h-[3px]`)
- **AND** no class on the active item contains the substring `brand-orange`

#### Scenario: Active item has primary underline (mobile)
- **WHEN** the mobile menu is open and `activePath=/servicios`
- **THEN** the navigation item whose `href=/servicios` carries the `aria-current="page"` attribute
- **AND** that item has an `::after` pseudo-element with `after:h-[3px]` and `after:bg-primary`

### Requirement: Header renders the quote CTA inside the nav
The site-header SHALL render a call-to-action link to request a quote as the last
item inside the `<nav>` element. The CTA SHALL use the `--color-accent` (`#F26A21`)
token via the utility `bg-accent` (with `hover:bg-accent-dark`). The CTA SHALL apply
the heading font via `font-heading` (Montserrat) with `font-semibold` weight (600),
`text-xs` size and `uppercase tracking-wide` per la escala tipográfica canónica.
The CTA SHALL NOT apply `rounded` (flat design con radio 0) NOR `shadow-sm`
(sombras reservadas para capas flotantes). The obsolete utility `bg-brand-orange`
SHALL NOT appear. The CTA SHALL NOT use `hidden sm:inline-flex` (no longer needed
since the nav's own responsive classes handle visibility).

#### Scenario: Quote CTA is inside the nav with accent styling
- **WHEN** the site-header renders
- **THEN** the quote CTA link is a descendant of `<nav aria-label="Navegación principal">`
- **AND** the quote CTA link is the last `<a>` inside the nav
- **AND** its `class` attribute contains `bg-accent` (resolving to `#F26A21`)
- **AND** its `class` attribute contains `font-heading` and `font-semibold`
- **AND** its `class` attribute does NOT contain `bg-brand-orange`
- **AND** its `class` attribute does NOT contain `rounded` (nor any `rounded-*` variant)
- **AND** its `class` attribute does NOT contain `shadow-sm` (nor any `shadow-*` utility)

#### Scenario: CTA is the last item in the mobile menu
- **WHEN** the mobile menu is open
- **THEN** the quote CTA link is rendered inside `<nav aria-label="Navegación móvil">`
- **AND** the CTA is the last link in the mobile nav
- **AND** the CTA retains `bg-accent` styling

### Requirement: Header supports full-viewport mobile overlay with slide animation
The site-header SHALL collapse the desktop navigation into a toggleable hamburger
menu on viewports smaller than 1024px. When toggled open, the mobile menu SHALL
render as a **full-viewport overlay** (`100vw` × `100vh`) with a **white background**
(`bg-white`), showing only the menu items and CTA. The overlay SHALL slide in from
the right (off-screen `translate-x-full` → visible `translate-x-0`) with a smooth
`300ms ease-in-out` CSS transition. The hamburger button SHALL transform into an X
button and SHALL remain always visible — positioned `fixed` with a z-index above
the overlay so the sliding menu layer does NOT cover it. The button's icon color
SHALL adapt from white (on the navy header) to secondary `#1F2D40` (on the white
overlay) via CSS driven by a `data-menu-open` attribute on the `<header>`.

#### Scenario: Menu toggles open as fullscreen overlay
- **WHEN** the user clicks the toggle button
- **THEN** the mobile navigation overlay becomes visible (`data-menu-open="true"`)
- **AND** the overlay has `bg-white` and `fixed inset-0`
- **AND** the overlay shows only the menu items + CTA
- **AND** the `aria-expanded` attribute on the toggle button switches to `"true"`
- **AND** the `aria-label` switches to "Cerrar menú"
- **AND** the hamburger icon is hidden and the X icon is shown

#### Scenario: Menu slides in from right with smooth animation
- **WHEN** the mobile menu opens
- **THEN** the overlay animates from `translate-x-full` to `translate-x-0`
- **AND** the animation uses `transition-transform duration-300 ease-in-out`
- **AND** the overlay does not jump instantly

#### Scenario: Toggle button is always visible above the overlay
- **WHEN** the mobile menu is open
- **THEN** the toggle button remains visible
- **AND** the toggle button has a z-index higher than the overlay (`z-50` vs `z-40`)
- **AND** the overlay does NOT cover the toggle button
- **AND** the toggle button icon color is secondary `#1F2D40` (visible on white bg)

#### Scenario: Menu toggles closed
- **WHEN** the user clicks the X toggle button
- **THEN** the overlay animates back to `translate-x-full` (off-screen right)
- **AND** `aria-expanded` switches to `"false"`
- **AND** `aria-label` switches to "Abrir menú"
- **AND** body scroll lock is removed

#### Scenario: Body scroll is locked while overlay is open
- **WHEN** the mobile menu is open
- **THEN** `<body>` has `overflow:hidden`
- **AND** when the menu closes, `overflow` is restored

### Requirement: Header renders logo at 2× size with overflow
The site-header SHALL render the logo link pointing to the home page, wrapping the
real raster logo imported from `@/assets/img/` (`logo-web.webp`) via the built-in
`astro:assets` `<Image>` component. The `<img>` SHALL carry the `alt` text from the
`logoAlt` prop and **double** the previous `width`/`height` attributes (from
`165`/`67` to `330`/`134`). The wrapping `<a>` SHALL use `overflow-visible` and a
constrained height (`h-24`) so the logo may visually overflow the header's height
without growing the header container or displacing sibling elements.

#### Scenario: Logo is doubled in size with overflow
- **WHEN** the site-header renders
- **THEN** the logo `<img>` has `width="330"` and `height="134"`
- **AND** the logo link `<a>` has `overflow-visible` and a constrained height (`h-24`)
- **AND** the `<header>` container maintains its original height (no layout shift
  from the oversized logo)
- **AND** the rendered HTML does NOT contain "Logo placeholder"

### Requirement: Header accessibility
The site-header SHALL meet accessibility requirements and ensure a single `<header>`
landmark per page. The hamburger/X toggle button SHALL remain visible over the
fullscreen overlay with a color that contrasts both the navy header and the white
overlay.

#### Scenario: Semantic landmarks
- **WHEN** the page renders the Header and TopHeader together
- **THEN** exactly one `<header>` element exists in the document
- **AND** the TopHeader wrapper is a non-landmark element (`<div role="region" aria-label="Barra de contacto">`)
- **AND** the navigation is wrapped in `<nav aria-label="Navegación principal">`

#### Scenario: Interactive element labels
- **WHEN** the Header renders
- **THEN** the logo link has `aria-label="Ir al inicio"`
- **AND** the logo image has a meaningful `alt` (from `logoAlt`)
- **AND** the mobile toggle has an `aria-label` describing its action (switches between "Abrir menú" and "Cerrar menú")
- **AND** the active nav item has `aria-current="page"`

## UNCHANGED Requirements (for reference)

The following requirements from the original `openspec/specs/site-header/spec.md` are
**not modified** by this change and remain in effect:

- Requirement: Site Header supports a transparent mode
- Requirement: Header does not depend on local SVG icon components
- Requirement: Navigation configuration is hardcoded
- Requirement: CTA destination page exists
  - *Note*: the CTA (`getCtaConfig()`) is unchanged; only its rendering location moves
    from outside `<nav>` to inside `<nav>`.
