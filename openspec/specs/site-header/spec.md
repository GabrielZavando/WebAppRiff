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

### Requirement: Header accessibility
The site-header SHALL meet accessibility requirements and ensure a single `<header>` landmark per page. The hamburger/X toggle button SHALL remain visible over the fullscreen overlay with a color that contrasts both the navy header and the white overlay. The retired top bar SHALL NOT introduce a second landmark or a contact region.

#### Scenario: Semantic landmarks
- **WHEN** any page renders the Header
- **THEN** exactly one `<header>` element exists in the document
- **AND** no element with `role="region"` and `aria-label="Barra de contacto"` exists
- **AND** the navigation is wrapped in `<nav aria-label="Navegación principal">`

#### Scenario: Interactive element labels
- **WHEN** the Header renders
- **THEN** the logo link has `aria-label="Ir al inicio"`
- **AND** the logo image has a meaningful `alt` (from `logoAlt`)
- **AND** the mobile toggle has an `aria-label` describing its action (switches between "Abrir menú" and "Cerrar menú")
- **AND** the active nav item has `aria-current="page"`

### Requirement: Navigation configuration is hardcoded
The navigation items SHALL come from the hardcoded `NAVIGATION_ITEMS` constant (5 items: Inicio, Productos, Servicios, Marcas, Contacto), and the CTA SHALL come from `getCtaConfig()` with graceful fallback to defaults.

#### Scenario: Navigation items and CTA come from hardcoded config
- **WHEN** the navigation configuration used by `Header.astro` is inspected
- **THEN** the nav items come from `NAVIGATION_ITEMS`
- **AND** each item declares both `label` and `href`
- **AND** the CTA comes from `getCtaConfig()` and falls back to defaults when environment variables are missing

### Requirement: Desktop nav visible from xl breakpoint and compact in lg→xl
El menú de escritorio SHALL ser visible desde `xl` (1280px). En el rango `lg` (1024px) a menos de 1280px, el header SHALL mantener el acceso a la navegación mediante el menú hamburguesa con overlay a pantalla completa, y los elementos del nav de escritorio (íconos de navegación, CTA y logo) SHALL estar dimensionados de modo que, cuando el nav de escritorio se renderiza, el conjunto completo quepa dentro del ancho del viewport sin scroll horizontal.

#### Scenario: Menú de escritorio visible desde 1280px
- **WHEN** el header se renderiza en un viewport `>= 1280px`
- **THEN** el `<nav aria-label="Navegación principal">` es visible y el botón hamburguesa está oculto

#### Scenario: Menú móvil por debajo de 1280px
- **WHEN** el header se renderiza en un viewport de `1024px` a `1279px`
- **THEN** el `<nav aria-label="Navegación principal">` de escritorio está oculto
- **AND** el botón hamburguesa está visible y abre el overlay de navegación

#### Scenario: Sin desborde del header en el rango 1024–1279px
- **WHEN** el header se renderiza en los viewports `1024×768` y `1204×800`
- **THEN** el ancho del `<header>` no supera el ancho del viewport
- **AND** ningún hijo directo del header (logo, navegación, CTA) extiende su `boundingBox` más allá del borde derecho del viewport

#### Scenario: Compactación activa en el rango lg→xl
- **WHEN** se inspecciona el source de `Header.astro`
- **THEN** el nav y/o sus ítems declaran utilidades de compactación con breakpoint `lg:` (o menor) que difieren de las aplicadas en `xl:`
- **AND** el logo NO declara un ancho máximo distinto en `lg:` que en `xl:`

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
