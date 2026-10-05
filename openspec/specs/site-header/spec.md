# site-header Specification

## Purpose
Header principal global del sitio público: logo (2× tamaño), navegación de 5 items con estado activo por ruta, CTA de cotización integrada en el menú, y menú móvil a pantalla completa con animación de deslizamiento.
## Requirements
### Requirement: Header renders navigation items in order
The site-header SHALL render the navigation items from the hardcoded `NAVIGATION_ITEMS` constant in the declared order, followed by the CTA as the last item inside the `<nav>` element. The CTA SHALL keep its `bg-accent` styling but SHALL be rendered inside the `<nav>` rather than as a standalone element outside it. The nav SHALL be right-aligned on desktop.

#### Scenario: All items displayed in order (desktop)
- **WHEN** the Header renders on a desktop viewport (>= 1024px)
- **THEN** the nav items + CTA are rendered inside a `<nav aria-label="Navegación principal">`
- **AND** the labels appear in order: Inicio, Productos, Servicios, Marcas, Contacto, SOLICITAR COTIZACIÓN
- **AND** the nav is right-aligned (uses `ml-auto` or equivalent)
- **AND** each nav link has the `href` declared in `NAVIGATION_ITEMS` or the `cta` config
- **AND** the CTA maintains `bg-accent` styling (not relocated to a separate element)

#### Scenario: Updated navigation items
- **WHEN** `NAVIGATION_ITEMS` is inspected
- **THEN** it contains exactly 5 items
- **AND** the labels are: Inicio, Productos, Servicios, Marcas, Contacto
- **AND** the hrefs are: `/`, `/productos`, `/servicios`, `/marcas`, `/contacto`

### Requirement: Header marks the active item
The site-header SHALL mark the navigation item matching the current path as active. The active state SHALL visually indicate selection via an underline using the `--color-primary` (`#41B3C4`) token (utility `after:bg-primary`), and inactive items SHALL show appropriate contrast for their background. The underline pseudo-element SHALL have a thickness of **3px** (`after:h-[3px]`), replacing the previous 2px (`after:h-0.5`). The obsolete utility `after:bg-brand-orange` and references to `--color-brand-orange` SHALL NOT appear. The 3px underline applies on both desktop and mobile.

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
The site-header SHALL render a call-to-action link to request a quote as the last item inside the `<nav>` element. The CTA SHALL use the `--color-accent` (`#F26A21`) token via the utility `bg-accent` (with `hover:bg-accent-dark`). The CTA SHALL apply the heading font via `font-heading` (Montserrat) with `font-semibold` weight (600), `text-xs` size and `uppercase tracking-wide` per la escala tipográfica canónica. The CTA SHALL NOT apply `rounded` (flat design con radio 0) NOR `shadow-sm` (sombras reservadas para capas flotantes). The obsolete utility `bg-brand-orange` SHALL NOT appear. The CTA SHALL NOT use `hidden sm:inline-flex` (no longer needed since the nav's own responsive classes handle visibility via `hidden lg:flex` on desktop and `lg:hidden` on the overlay).

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

### Requirement: Site Header supports a transparent mode
Header SHALL accept an optional boolean prop `transparent` (default `false`). When `true`, the `<header>` element SHALL use `bg-transparent` instead of the solid `bg-secondary`; the logo, desktop nav, CTA and mobile toggle remain unchanged. When `false` (default), the solid navy `bg-secondary` background SHALL be present — uniform with the search bar and the top bar; the gradient `bg-linear-to-r from-secondary to-secondary-light` was removed in `ui-chrome-uniform`. (MODIFIED in `ui-chrome-uniform`.)

#### Scenario: Transparent mode replaces the solid header background
- **WHEN** the Header renders with `transparent: true`
- **THEN** the `<header>` element carries `bg-transparent`
- **AND** the `<header>` element does NOT carry `bg-secondary` nor the gradient utilities

#### Scenario: Default mode renders the solid secondary header
- **WHEN** the Header renders without `transparent`
- **THEN** the `<header>` element carries `bg-secondary` (solid var(--color-secondary))
- **AND** the `<header>` element does NOT carry `bg-linear-to-r from-secondary to-secondary-light`

### Requirement: Header supports a fullscreen mobile overlay with slide animation
The site-header SHALL collapse the desktop navigation into a toggleable hamburger menu on viewports smaller than 1024px. When toggled open, the mobile menu SHALL render as a **full-viewport overlay** (`100vw` × `100vh`) with a **white background** (`bg-white`), showing only the menu items and CTA. The overlay SHALL slide in from the right (off-screen `translateX(100%)` → visible `translateX(0)`) with a smooth `300ms ease-in-out` CSS transition. The hamburger button SHALL transform into an X button and SHALL remain always visible — positioned `fixed` with `z-50` (above the overlay's `z-40`) so the sliding menu layer does NOT cover it. The button's icon color SHALL adapt from white (on the navy header) to secondary `#1F2D40` (on the white overlay) via CSS driven by a `data-menu-open` attribute on the `<header>`. Body scroll SHALL be locked (`overflow:hidden` on `<body>`) while the overlay is open.

#### Scenario: Menu toggles open as fullscreen overlay
- **WHEN** the user clicks the toggle button
- **THEN** the `<header>` element's `data-menu-open` attribute switches to `"true"`
- **AND** the overlay has `bg-white` and `fixed inset-0`
- **AND** the overlay shows only the menu items + CTA
- **AND** the `aria-expanded` attribute on the toggle button switches to `"true"`
- **AND** the `aria-label` switches to "Cerrar menú"
- **AND** `document.body.style.overflow` is set to `"hidden"`

#### Scenario: Menu slides in from right with smooth animation
- **WHEN** the mobile menu opens
- **THEN** the overlay's `transform` transitions from `translateX(100%)` to `translateX(0)`
- **AND** the animation uses `transition-transform duration-300 ease-in-out`
- **AND** the overlay does not jump instantly

#### Scenario: Toggle button is always visible above the overlay
- **WHEN** the mobile menu is open
- **THEN** the toggle button remains visible
- **AND** the toggle button has `position: fixed` with `z-index: 50`
- **AND** the overlay has `z-index: 40`
- **AND** the toggle button icon color is secondary `#1F2D40` (visible on white bg)

#### Scenario: Menu toggles closed
- **WHEN** the user clicks the X toggle button
- **THEN** the `<header>` element's `data-menu-open` attribute switches back to `"false"`
- **AND** the overlay's `transform` transitions back to `translateX(100%)`
- **AND** `aria-expanded` switches to `"false"`
- **AND** `aria-label` switches to "Abrir menú"
- **AND** body scroll lock is removed (`overflow` restored)

### Requirement: Header does not depend on local SVG icon components
The site-header SHALL obtain its menu and close icons via `astro-icon` (`<Icon>` element) del conjunto único **Lucide**: `lucide:menu` y `lucide:x`. Los sets `material-symbols` NO se referencian en `Header.astro`. Los archivos `apps/web/src/components/icons/MenuIcon.astro` and `CloseIcon.astro` SHALL not exist.

#### Scenario: No local SVG menu/close components
- **WHEN** the filesystem of `apps/web/src/components/icons/` is inspected
- **THEN** no files named `MenuIcon.astro` or `CloseIcon.astro` exist
- **AND** the site-header still renders the toggle button with two states displayable

#### Scenario: Header imports astro-icon Icon and uses Lucide
- **WHEN** the source of `apps/web/src/components/Header.astro` is inspected
- **THEN** it contains `import { Icon } from 'astro-icon/components'` (or equivalent Astro import)
- **AND** it does not import `MenuIcon.astro` or `CloseIcon.astro`
- **AND** all `<Icon name="...">` references start with the prefix `lucide:`

### Requirement: Header renders logo at 2× size with overflow
(section on tokens) The header container SHALL use the `--color-secondary` (navy `#1F2D40`) token via the Tailwind utility `bg-secondary` for its background; the gradient utilities `bg-linear-to-r from-secondary to-secondary-light` and the obsolete utilities `bg-brand-navy`, `from-brand-navy`, `to-brand-navy-light` SHALL NOT appear. (MODIFIED in `ui-chrome-uniform` — the logo rendering contract is unchanged; only the background token sentence changed from gradient to solid.)

#### Scenario: Logo container uses the solid secondary background
- **WHEN** the site header renders in its default (non-transparent) state
- **THEN** the `<header>` container applies `bg-secondary` (resolving to `#1F2D40`)
- **AND** the container does NOT apply `from-secondary to-secondary-light`

### Requirement: Header accessibility
The site-header SHALL meet accessibility requirements and ensure a single `<header>` landmark per page. The hamburger/X toggle button SHALL remain visible over the fullscreen overlay with a color that contrasts both the navy header and the white overlay.

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

### Requirement: Navigation configuration is hardcoded
The navigation items SHALL come from the hardcoded `NAVIGATION_ITEMS` constant (5 items: Inicio, Productos, Servicios, Marcas, Contacto), and the CTA SHALL come from `getCtaConfig()` with graceful fallback to defaults.

#### Scenario: CTA config with env vars absent
- **WHEN** `CTA_LABEL` and `CTA_HREF` environment variables are not set
- **THEN** `getCtaConfig()` returns `{ label: 'SOLICITAR COTIZACIÓN', href: '/cotizacion' }`

#### Scenario: CTA config with env vars present
- **WHEN** `CTA_LABEL` and `CTA_HREF` environment variables are set
- **THEN** `getCtaConfig()` returns their values

### Requirement: CTA destination page exists
The site SHALL serve the CTA destination page at `/cotizacion`.

#### Scenario: Cotizacion page responds
- **WHEN** a GET request is made to `/cotizacion`
- **THEN** the server responds with HTTP 200
- **AND** the page contains the heading "Solicitar cotización"

### Requirement: Header box contains the full logo height
The `.site-header` container SHALL include a responsive `padding-bottom` of `pb-10 lg:pb-4` (client decision in `ui-chrome-polish`, previously `pb-10 lg:pb-12`): mobile keeps 80px (h-20) + 40px (pb-10) ≥ ~81px logo (full containment); desktop relaxes to 96px (lg:h-24) + 16px (lg:pb-4) = 112px vs ~122px logo at the 300px cap — a slight visual overflow of the 2× logo on desktop that the client explicitly accepted ("así se ve mejor"), preserving the logo wrapper's `overflow-visible` behavior. (MODIFIED in `ui-chrome-polish`.)

#### Scenario: SC-001 — site-header carries pb-10 lg:pb-4
- **WHEN** the site-header renders
- **THEN** the `<header class="site-header">` element carries `pb-10` and `lg:pb-4`
- **AND** the previous `lg:pb-12` value does NOT appear in the header classes
- **AND** on mobile the header box still contains the full logo height; on desktop the slight 2× logo overflow is accepted by the client

