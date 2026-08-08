# site-header Specification

## Purpose
Header principal global del sitio público: logo, navegación de 5 items con estado activo por ruta y CTA de cotización; colapsa a hamburguesa en mobile.
## Requirements
### Requirement: Header renders navigation items in order
The site-header SHALL render the navigation items from the hardcoded `NAVIGATION_ITEMS` constant in the declared order.

#### Scenario: All five items displayed
- **WHEN** the Header renders on a desktop viewport (>= 1024px)
- **THEN** five links are rendered inside a `<nav aria-label="Navegación principal">`
- **AND** the labels appear in order: Inicio, Nosotros, Servicios, Representaciones, Contacto
- **AND** each link has the `href` declared in `NAVIGATION_ITEMS`

### Requirement: Header marks the active item
The site-header SHALL mark the navigation item matching the current path as active. The active state SHALL visually indicate selection via an underline using the `--color-primary` (`#41B3C4`) token (utility `after:bg-primary`), and inactive items SHALL show `text-white/80` with hover `text-white`. The underline pseudo-element SHALL keep `h-0.5` (state indicator funcional, no decorativo). The obsolete utility `after:bg-brand-orange` and references to `--color-brand-orange` SHALL NOT appear.

#### Scenario: Active item has primary underline
- **WHEN** the site-header renders with `activePath=/productos`
- **THEN** the navigation item whose `href=/productos` carries the `aria-current="page"` attribute
- **AND** that item has an `::after` pseudo-element whose background resolves to `--color-primary` (`#41B3C4`)
- **AND** no class on the active item contains the substring `brand-orange`

### Requirement: Header renders the quote CTA
The site-header SHALL render a call-to-action link to request a quote. The CTA SHALL use the `--color-accent` (`#F26A21`) token via the utility `bg-accent` (with `hover:bg-accent-dark`). The CTA SHALL apply the heading font via `font-heading` (Montserrat) with `font-semibold` weight (600), `text-xs` size and `uppercase tracking-wide` per la escala tipográfica canónica. The CTA SHALL NOT apply `rounded` (flat design con radio 0) NOR `shadow-sm` (sombras reservadas para capas flotantes). The obsolete utility `bg-brand-orange` SHALL NOT appear.

#### Scenario: Quote CTA uses accent token and flat square corners
- **WHEN** the site-header renders
- **THEN** the quote CTA link has `href` pointing to the cotización page
- **AND** its `class` attribute contains `bg-accent` (resolving to `#F26A21`)
- **AND** its `class` attribute contains `font-heading` and `font-semibold`
- **AND** its `class` attribute does NOT contain `bg-brand-orange`
- **AND** its `class` attribute does NOT contain `rounded` (nor any `rounded-*` variant)
- **AND** its `class` attribute does NOT contain `shadow-sm` (nor any `shadow-*` utility)

### Requirement: Site Header supports a transparent mode
Header SHALL accept an optional boolean prop `transparent` (default `false`). When `true`, the `<header>` element SHALL use `bg-transparent` instead of `bg-linear-to-r from-secondary to-secondary-light`; the logo, desktop nav, CTA and mobile toggle remain unchanged. When `false` (default), the existing navy gradient SHALL be present.

#### Scenario: Transparent mode replaces header gradient
- **WHEN** Header renders with `transparent: true`
- **THEN** the `<header>` element carries `bg-transparent`
- **AND** its class does NOT contain `from-secondary to-secondary-light`
- **AND** the logo link and navigation items still render

#### Scenario: Default mode keeps gradient header
- **WHEN** Header renders without `transparent`
- **THEN** the `<header>` element carries `bg-linear-to-r from-secondary to-secondary-light`

### Requirement: Header collapses navigation on mobile
The site-header SHALL collapse the desktop navigation into a toggleable hamburger menu on viewports smaller than 1024px. The mobile toggle button SHALL render its menu/close icons via `astro-icon` using `<Icon name="lucide:menu" />` (hamburguesa) and `<Icon name="lucide:x" />` (cerrar) del set único **Lucide** (outline stroke 2px); los iconos `material-symbols:menu-outline` y `material-symbols:close-outline` quedan obsoletos. El per-component `MenuIcon.astro` and `CloseIcon.astro` files SHALL no longer exist in `apps/web/src/components/icons/`. Los items del menú móvil aplican `font-heading font-semibold`.

#### Scenario: Hamburger toggle uses Lucide icons
- **WHEN** the site-header renders on a viewport < 1024px
- **THEN** the toggle button contains two `<Icon>` elements (for menu and close states)
- **AND** the menu `<Icon>` has `name="lucide:menu"`
- **AND** the close `<Icon>` has `name="lucide:x"`
- **AND** no inline `<svg>` is rendered for the menu or close icon
- **AND** the source does NOT reference `material-symbols:menu-outline` nor `material-symbols:close-outline`

#### Scenario: Menu toggles open and closed
- **WHEN** the user clicks the toggle button
- **THEN** the mobile navigation panel toggles its visibility
- **AND** the `aria-expanded` attribute on the toggle button switches between `"true"` and `"false"`
- **AND** the `aria-label` switches between "Abrir menú" and "Cerrar menú"

### Requirement: Header does not depend on local SVG icon components
The site-header SHALL obtain its menu and close icons via `astro-icon` (`<Icon>` element) del set único **Lucide**: `lucide:menu` y `lucide:x`. Los sets `material-symbols` NO se referencian en `Header.astro`. Los archivos `apps/web/src/components/icons/MenuIcon.astro` and `CloseIcon.astro` SHALL not exist.

#### Scenario: No local SVG menu/close components
- **WHEN** the filesystem of `apps/web/src/components/icons/` is inspected
- **THEN** no files named `MenuIcon.astro` or `CloseIcon.astro` exist
- **AND** the site-header still renders the toggle button with two states displayable

#### Scenario: Header imports astro-icon Icon and uses Lucide
- **WHEN** the source of `apps/web/src/components/Header.astro` is inspected
- **THEN** it contains `import { Icon } from 'astro-icon/components'` (or equivalent Astro import)
- **AND** it does not import `MenuIcon.astro` or `CloseIcon.astro`
- **AND** all `<Icon name="...">` references start with the prefix `lucide:`

### Requirement: Header accessibility
The site-header SHALL meet accessibility requirements and ensure a single `<header>` landmark per page.

#### Scenario: Semantic landmarks
- **WHEN** the page renders the Header and TopHeader together
- **THEN** exactly one `<header>` element exists in the document
- **AND** the TopHeader wrapper is a non-landmark element (`<div role="region" aria-label="Barra de contacto">`)
- **AND** the navigation is wrapped in `<nav aria-label="Navegación principal">`

#### Scenario: Interactive element labels
- **WHEN** the Header renders
- **THEN** the logo link has `aria-label="Ir al inicio"`
- **AND** the logo image has a meaningful `alt` (from `logoAlt`)
- **AND** the mobile toggle has an `aria-label` describing its action
- **AND** the active nav item has `aria-current="page"`

### Requirement: Navigation configuration is hardcoded
The navigation items SHALL come from the hardcoded `NAVIGATION_ITEMS` constant, and the CTA SHALL come from `getCtaConfig()` with graceful fallback to defaults.

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

### Requirement: Header renders logo link with the real logo image
The site-header SHALL render a logo link pointing to the home page, wrapping the real raster logo imported from `@/assets/img/` (`logo-web.webp`) and rendered with the built-in `astro:assets` `<Image>` component. The `<img>` SHALL carry the `alt` text from the `logoAlt` prop and explicit `width="165"` and `height="67"` attributes (placeholder width preserving the native 600×243 aspect ratio) to avoid layout shift. The placeholder text "Logo placeholder" SHALL no longer appear. The header container SHALL use the `--color-secondary` (navy `#1F2D40`) and `--color-secondary-light` (`#35455E`) tokens via Tailwind utilities `bg-secondary` / a gradient `from-secondary to-secondary-light`; the obsolete utilities `bg-brand-navy`, `from-brand-navy`, `to-brand-navy-light` SHALL NOT appear.

#### Scenario: Logo link points to home
- **WHEN** the site-header renders
- **THEN** the logo link has `href="/"` and `aria-label="Ir al inicio"`
- **AND** the logo link is inside a container with a gradient `from-secondary to-secondary-light`
- **AND** the rendered HTML contains no `brand-navy` token references

#### Scenario: Logo image is the real raster asset
- **WHEN** the site-header renders
- **THEN** the logo link contains an `<img>` element whose `src` resolves to the imported asset from `@/assets/img/` (`logo-web.webp`, 600×243 native)
- **AND** the `<img>` carries `alt="Riff"` (the `logoAlt` prop value)
- **AND** the `<img>` carries explicit `width="165"` and `height="67"` attributes (placeholder width preserving the native 2.47:1 aspect ratio)
- **AND** the rendered HTML does NOT contain "Logo placeholder"

