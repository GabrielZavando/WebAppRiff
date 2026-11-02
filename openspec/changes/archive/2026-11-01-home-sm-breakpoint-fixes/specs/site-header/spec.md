## MODIFIED Requirements

### Requirement: Header renders logo at 2× size with overflow

The header SHALL render the Riff logo from `apps/web/src/assets/img/logo-web.png` via `astro:assets` `<Image>`, with explicit intrinsic dimensions `width={330}` and `height={166}` to preserve the 1080×542 (≈1.99:1) aspect ratio at 2× density in the desktop header. The logo link SHALL remain aligned to the left of the header's inner bar, with the desktop nav occupying the right side via `justify-between`. The logo wrapper SHALL use `h-16 sm:h-24 lg:h-20` with `overflow-visible`; from `sm` the wrapper SHALL be a flex container with `items-center` (`sm:flex sm:items-center`) so the logo is vertically centered inside the taller tablet bar, while `lg:block` restores the accepted top-aligned desktop overflow. The image SHALL keep `max-w-[160px]` below `sm`, `sm:max-w-[240px]` from 640px up, `sm:w-auto` from 640px up so the aspect ratio is preserved when `max-h-full` clamps the height, `max-h-full` below `lg` and `lg:max-h-none` from 1024px up. From `sm` the image height is therefore capped by the 96px inner bar, rendering the logo wider than the 160px mobile cap while keeping at least 8px of clearance above and below inside the header. The logo SHALL keep the descriptive `logoAlt` fallback and the current aspect-ratio preservation. No import or reference to `logo-web.webp` SHALL remain in `Header.astro`. The header container SHALL use the `--color-secondary` (navy `#1F2D40`) token via the Tailwind utility `bg-secondary` for its background; the gradient utilities `bg-linear-to-r from-secondary to-secondary-light` and the obsolete utilities `bg-brand-navy`, `from-brand-navy`, `to-brand-navy-light` SHALL NOT appear.

#### Scenario: Logo asset and intrinsic dimensions

- **WHEN** `Header.astro` is inspected
- **THEN** it imports `logo-web.png`
- **AND** it renders `<Image>` with `width={330}` and `height={166}`
- **AND** the logo image carries `max-w-[160px]`, `sm:max-w-[240px]`, `sm:w-auto`, `max-h-full` and `lg:max-h-none`
- **AND** `logo-web.webp` is not referenced

#### Scenario: Logo is left-aligned and vertically centered

- **WHEN** el site header se renderiza en cualquier viewport
- **THEN** el enlace del logo queda alineado al borde izquierdo del contenedor interno del header
- **AND** desde `sm` el enlace del logo es un contenedor flex con `items-center` que lo centra verticalmente en la barra de 96px
- **AND** el logo NO se centra horizontalmente en el viewport

#### Scenario: Logo keeps at least 8px of air above and below from sm

- **WHEN** el site header se renderiza en el viewport `640×800`
- **THEN** el ancho renderizado del logo es mayor que el cap móvil de `160px`
- **AND** el borde superior del logo deja al menos 8px respecto del borde superior del header
- **AND** el borde inferior del logo deja al menos 8px respecto del borde inferior del header
- **AND** el header no supera el ancho del viewport ni provoca scroll horizontal

#### Scenario: Logo container uses the solid secondary background

- **WHEN** el site header renders in its default (non-transparent) state
- **THEN** the `<header>` container applies `bg-secondary` (resolving to `#1F2D40`)
- **AND** the container does NOT apply `from-secondary to-secondary-light`

### Requirement: Header box contains the full logo height

The `.site-header` container SHALL NOT apply `pb-4` as its mobile base padding. Below `sm` (< 640px) it SHALL apply `py-2` (8px top + 8px bottom) over an inner bar of `h-16` (64px), for a total mobile header height of 80px. From `sm` up to `lg` it SHALL keep `py-2` over an inner bar of `sm:h-24` (96px), for a total tablet header height of 112px, giving the 96px logo 8px of clearance above and below. From `lg` up the header SHALL apply `lg:pt-0` and `lg:pb-2` over an inner bar of `lg:h-20` (80px), preserving the accepted 2× logo visual overflow on desktop. On short viewports (height <= 400px) **below `sm` (< 640px)** the vertical padding SHALL collapse to zero and the inner bar SHALL keep its compact height (`h-12` via a valid `[@media(max-height:400px)]` arbitrary variant scoped to `max-sm`). At `sm` widths and above, short viewports SHALL keep the tablet header (`py-2` + `sm:h-24`, 112px total), so a 640×375 landscape phone renders the tablet header and the full-size logo instead of the compact mobile bar.

#### Scenario: SC-001 — site-header carries pb-10 lg:pb-4

- **WHEN** the site-header renders
- **THEN** the `<header class="site-header">` element does NOT carry `pb-10` or `lg:pb-4`
- **AND** below `lg` it carries `py-2` (except short viewports below `sm`, where the compact `py-0` applies)
- **AND** the inner bar carries `h-16` and `sm:h-24`
- **AND** from `lg` up it carries `lg:pt-0` and `lg:pb-2` over an inner bar of `lg:h-20`

#### Scenario: Mobile header removes pb-4 and distributes vertical padding

- **WHEN** el site-header se renderiza por debajo de `sm`
- **THEN** el `<header class="site-header">` NO lleva `pb-4`
- **AND** el header lleva `py-2`
- **AND** la barra interna lleva `h-16`

#### Scenario: Tablet header distributes vertical padding

- **WHEN** el site-header se renderiza en el viewport `640×800`
- **THEN** el `<header class="site-header">` no lleva `pb-4`
- **AND** el header lleva `py-2`
- **AND** la barra interna lleva `sm:h-24`
- **AND** el logo queda centrado verticalmente con al menos 8px de aire arriba y abajo

#### Scenario: Large phone in landscape keeps the tablet header

- **WHEN** el site-header se renderiza en el viewport `640×375` (teléfono grande rotado)
- **THEN** el modo compacto `max-height:400px` NO aplica porque el ancho es `>= 640px`
- **AND** la barra interna mide 96px (`sm:h-24`) y el header total mide 112px (`py-2`)
- **AND** el logo renderizado mide más de 160px de ancho y deja al menos 8px de aire arriba y abajo
- **AND** el logo NO se limita al cap compacto de 100px
- **AND** el header no provoca scroll horizontal

#### Scenario: Small phone in landscape keeps the compact header

- **WHEN** el site-header se renderiza en el viewport `568×320`
- **THEN** el modo compacto `max-height:400px` aplica (ancho `< 640px`)
- **AND** el header lleva `py-0` y la barra interna mide 48px (`h-12`)
- **AND** el logo queda limitado por el cap compacto de 100px

#### Scenario: Logo keeps top clearance on mobile

- **WHEN** el site-header se renderiza en un viewport móvil (por ejemplo `375×667`)
- **THEN** el logo queda centrado verticalmente en el header
- **AND** el borde superior del logo deja al menos 8px de separación respecto del borde superior del header

#### Scenario: Desktop padding contract preserved

- **WHEN** el site-header se renderiza en un viewport `>= 1024px`
- **THEN** el header carries `lg:pt-0` and `lg:pb-2`
- **AND** the inner bar carries `lg:h-20`
- **AND** the accepted 2× logo overflow on desktop remains
