## MODIFIED Requirements

### Requirement: Header renders logo at 2× size with overflow

The header SHALL render the Riff logo from `apps/web/src/assets/img/logo-web.png` via `astro:assets` `<Image>`, with explicit intrinsic dimensions `width={330}` and `height={166}` to preserve the 1080×542 (≈1.99:1) aspect ratio at 2× density in the desktop header. The logo link SHALL remain aligned to the left of the header's inner bar, with the desktop nav occupying the right side via `justify-between`, and SHALL be vertically centered with `items-center`. The logo wrapper SHALL use `h-16 lg:h-20` with `overflow-visible`; the image SHALL keep `max-w-[160px]` below the `sm` breakpoint, `sm:max-w-[240px]` from 640px up, `max-h-full` below `sm` and `sm:max-h-none` from 640px up. The logo SHALL keep the descriptive `logoAlt` fallback and the current aspect-ratio preservation. No import or reference to `logo-web.webp` SHALL remain in `Header.astro`. The header container SHALL use the `--color-secondary` (navy `#1F2D40`) token via the Tailwind utility `bg-secondary` for its background; the gradient utilities `bg-linear-to-r from-secondary to-secondary-light` and the obsolete utilities `bg-brand-navy`, `from-brand-navy`, `to-brand-navy-light` SHALL NOT appear.

#### Scenario: Logo asset and intrinsic dimensions

- **WHEN** `Header.astro` is inspected
- **THEN** it imports `logo-web.png`
- **AND** it renders `<Image>` with `width={330}` and `height={166}`
- **AND** the logo image carries `max-w-[160px]` and `sm:max-w-[240px]`
- **AND** `logo-web.webp` is not referenced

#### Scenario: Logo is left-aligned and vertically centered

- **WHEN** el site header se renderiza en cualquier viewport
- **THEN** el enlace del logo queda alineado al borde izquierdo del contenedor interno del header
- **AND** el logo queda centrado verticalmente dentro de la barra del header
- **AND** el logo NO se centra horizontalmente en el viewport

#### Scenario: Logo container uses the solid secondary background

- **WHEN** el site header renders in its default (non-transparent) state
- **THEN** the `<header>` container applies `bg-secondary` (resolving to `#1F2D40`)
- **AND** the container does NOT apply `from-secondary to-secondary-light`

### Requirement: Header box contains the full logo height

The `.site-header` container SHALL NOT apply `pb-4` as its mobile base padding. Below the `lg` breakpoint it SHALL apply `py-2` (8px top + 8px bottom) over an inner bar of `h-16` (64px), for a total mobile header height of 80px; this distributes the former bottom-only padding so the logo keeps 8px of clearance from the top edge. From `lg` up the header SHALL apply `lg:pt-0` and `lg:pb-2` over an inner bar of `lg:h-20` (80px), preserving the accepted 2× logo visual overflow on desktop. On short viewports (height <= 400px) the vertical padding SHALL collapse to zero and the inner bar SHALL keep its compact height.

#### Scenario: SC-001 — site-header carries pb-10 lg:pb-4

- **WHEN** the site-header renders
- **THEN** the `<header class="site-header">` element does NOT carry `pb-10` or `lg:pb-4`
- **AND** below `lg` it carries `py-2` and the inner bar carries `h-16`
- **AND** from `lg` up it carries `lg:pt-0` and `lg:pb-2` over an inner bar of `lg:h-20`

#### Scenario: Mobile header removes pb-4 and distributes vertical padding

- **WHEN** the site-header renders below `lg`
- **THEN** the `<header class="site-header">` element does NOT carry `pb-4`
- **AND** the header carries `py-2`
- **AND** the inner bar carries `h-16`

#### Scenario: Logo keeps top clearance on mobile

- **WHEN** el site-header se renderiza en un viewport móvil (por ejemplo `375×667`)
- **THEN** el logo queda centrado verticalmente en el header
- **AND** el borde superior del logo deja al menos 8px de separación respecto del borde superior del header

#### Scenario: Desktop padding contract preserved

- **WHEN** el site-header se renderiza en un viewport `>= 1024px`
- **THEN** el header carries `lg:pt-0` and `lg:pb-2`
- **AND** the inner bar carries `lg:h-20`
- **AND** the accepted 2× logo overflow on desktop remains

## ADDED Requirements

### Requirement: Mobile menu keeps working after client-side navigation

The hamburger menu toggle SHALL keep its click behavior after every client-side navigation performed by Astro's `ClientRouter`. The header script SHALL initialize the toggle through a reusable initializer that runs on the initial page load and re-runs on Astro's official `astro:page-load` lifecycle event, so the newly swapped `<header>` button receives a click listener. Initialization SHALL be idempotent: a toggle SHALL not receive duplicate click listeners and the `astro:page-load` listener SHALL not be registered more than once.

#### Scenario: Toggle opens the menu after navigating to another page

- **WHEN** the user navigates from `/` to `/servicios` through an internal link and `astro:page-load` fires
- **THEN** the new hamburger button responds to a click
- **AND** the `<header>` switches `data-menu-open` to `"true"`
- **AND** the overlay becomes visible with the accessible button name `Cerrar menú`

#### Scenario: Initialization does not duplicate listeners

- **WHEN** the mobile menu initializer runs multiple times for the same `<header>` (initial load plus `astro:page-load`)
- **THEN** one click toggles the menu open exactly once
- **AND** one subsequent click toggles it closed exactly once
- **AND** no duplicate `astro:page-load` listeners are registered
