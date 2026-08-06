# site-header Specification — delta for design-system-revision

## MODIFIED Requirements

### Requirement: Header renders logo link
The site-header SHALL render a logo link pointing to the home page. The header container SHALL use the `--color-secondary` (navy `#1F2D40`) and `--color-secondary-light` (`#35455E`) tokens via Tailwind utilities `bg-secondary` / a gradient `from-secondary to-secondary-light`; the obsolete utilities `bg-brand-navy`, `from-brand-navy`, `to-brand-navy-light` SHALL NOT appear.

#### Scenario: Logo link points to home
- **WHEN** the site-header renders
- **THEN** the logo link has `href="/"`
- **AND** the logo link is inside a container with a gradient `from-secondary to-secondary-light`
- **AND** the rendered HTML contains no `brand-navy` token references

### Requirement: Header marks the active item
The site-header SHALL mark the navigation item matching the current path as active. The active state SHALL visually indicate selection via an underline using the `--color-primary` (`#41B3C4`) token (utility `after:bg-primary`), and inactive items SHALL show `text-white/80` with hover `text-white`. The obsolete utility `after:bg-brand-orange` and references to `--color-brand-orange` SHALL NOT appear.

#### Scenario: Active item has primary underline
- **WHEN** the site-header renders with `activePath=/productos`
- **THEN** the navigation item whose `href=/productos` carries the `aria-current="page"` attribute
- **AND** that item has an `::after` pseudo-element whose background resolves to `--color-primary` (`#41B3C4`)
- **AND** no class on the active item contains the substring `brand-orange`

### Requirement: Header renders the quote CTA
The site-header SHALL render a call-to-action link to request a quote. The CTA SHALL use the `--color-accent` (`#F26A21`) token via the utility `bg-accent` (with `hover:bg-orange-600` replaced by a hover state derived from `--color-accent-dark` or a darker alpha overlay). The obsolete utility `bg-brand-orange` SHALL NOT appear.

#### Scenario: Quote CTA uses accent token
- **WHEN** the site-header renders
- **THEN** the quote CTA link has `href` pointing to the cotización page
- **AND** its `class` attribute contains `bg-accent` (resolving to `#F26A21`)
- **AND** its `class` attribute does NOT contain `bg-brand-orange`

### Requirement: Header collapses navigation on mobile
The site-header SHALL collapse the desktop navigation into a toggleable hamburger menu on viewports smaller than 1024px. The mobile toggle button SHALL render its menu/close icons via `astro-icon` using `<Icon name="material-symbols:menu-outline" />` and `<Icon name="material-symbols:close-outline" />` from the Material Symbols Outline set; the per-component `MenuIcon.astro` and `CloseIcon.astro` files SHALL no longer exist in `apps/web/src/components/icons/`.

#### Scenario: Hamburger toggle uses Material Symbols icons
- **WHEN** the site-header renders on a viewport < 1024px
- **THEN** the toggle button contains two `<Icon>` elements (for menu and close states)
- **AND** each `<Icon>` has a `name` attribute starting with `material-symbols:`
- **AND** no inline `<svg>` is rendered for the menu or close icon

#### Scenario: Menu toggles open and closed
- **WHEN** the user clicks the toggle button
- **THEN** the mobile navigation panel toggles its visibility
- **AND** the `aria-expanded` attribute on the toggle button switches between `"true"` and `"false"`
- **AND** the `aria-label` switches between "Abrir menú" and "Cerrar menú"

## ADDED Requirements

### Requirement: Header does not depend on local SVG icon components
The site-header SHALL obtain its menu and close icons via `astro-icon` (`<Icon>` element) from the Material Symbols Outline set. The files `apps/web/src/components/icons/MenuIcon.astro` and `apps/web/src/components/icons/CloseIcon.astro` SHALL not exist after this change.

#### Scenario: No local SVG menu/close components
- **WHEN** the filesystem of `apps/web/src/components/icons/` is inspected
- **THEN** no files named `MenuIcon.astro` or `CloseIcon.astro` exist
- **AND** the site-header still renders the toggle button with two states displayable

#### Scenario: Header imports astro-icon Icon
- **WHEN** the source of `apps/web/src/components/Header.astro` is inspected
- **THEN** it contains `import { Icon } from 'astro-icon/components'` (or equivalent Astro import)
- **AND** it does not import `MenuIcon.astro` or `CloseIcon.astro`
