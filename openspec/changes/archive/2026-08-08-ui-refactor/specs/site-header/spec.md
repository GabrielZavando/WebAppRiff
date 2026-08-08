## MODIFIED Requirements

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

### Requirement: Header marks the active item
The site-header SHALL mark the navigation item matching the current path as active. The active state SHALL visually indicate selection via an underline using the `--color-primary` (`#41B3C4`) token (utility `after:bg-primary`), and inactive items SHALL show `text-white/80` with hover `text-white`. The underline pseudo-element SHALL keep `h-0.5` (state indicator funcional, no decorativo). The obsolete utility `after:bg-brand-orange` and references to `--color-brand-orange` SHALL NOT appear.

#### Scenario: Active item has primary underline
- **WHEN** the site-header renders with `activePath=/productos`
- **THEN** the navigation item whose `href=/productos` carries the `aria-current="page"` attribute
- **AND** that item has an `::after` pseudo-element whose background resolves to `--color-primary` (`#41B3C4`)
- **AND** no class on the active item contains the substring `brand-orange`

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
