# site-header Specification — Delta (real-site-images)

## ADDED Requirements

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

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Header renders logo link
**Reason**: Replaced by "Header renders logo link with the real logo image" (change `real-site-images`), which renders the real raster logo via `astro:assets` `<Image>`.
**Migration**: The logo link now wraps the real logo imported from `@/assets/img/logo-web.webp` with explicit `width`/`height`; the rendered page needs no consumer migration.
