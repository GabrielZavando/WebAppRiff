# site-header Specification

## MODIFIED Requirements

### Requirement: Header renders navigation items in order
The site-header SHALL render the navigation items from the hardcoded `NAVIGATION_ITEMS` constant in the declared order, followed by the CTA as the last item inside the `<nav>` element. The CTA SHALL keep its `bg-accent` styling but SHALL be rendered inside the `<nav>` rather than as a standalone element outside it. The nav SHALL be right-aligned on desktop. The desktop nav SHALL be visible only from the `xl` breakpoint (`1280px`) via `hidden xl:flex`; below that width the navigation SHALL be reachable through the mobile overlay. (MODIFIED in `responsive-web-design-fixes` — el breakpoint del menú de escritorio pasa de `lg` (1024px) a `xl` (1280px) para eliminar el desborde horizontal del nav en el rango 1024–1279px.)

#### Scenario: All items displayed in order (desktop)
- **WHEN** the Header renders on a desktop viewport (>= 1280px)
- **THEN** the nav items + CTA are rendered inside a `<nav aria-label="Navegación principal">`
- **AND** the labels appear in order: Inicio, Nosotros, Productos, Servicios, Representaciones, Contacto, SOLICITAR COTIZACIÓN
- **AND** the nav is right-aligned (uses `ml-auto` or equivalent)
- **AND** each nav link has the `href` declared in `NAVIGATION_ITEMS` or the `cta` config
- **AND** the CTA maintains `bg-accent` styling (not relocated to a separate element)

#### Scenario: Updated navigation items
- **WHEN** `NAVIGATION_ITEMS` is inspected
- **THEN** it contains exactly 6 items
- **AND** the labels are: Inicio, Nosotros, Productos, Servicios, Representaciones, Contacto
- **AND** the hrefs are: `/`, `/nosotros`, `/productos`, `/servicios`, `/representaciones`, `/contacto`

#### Scenario: Desktop nav is hidden below the xl breakpoint
- **WHEN** the Header renders on a viewport < 1280px
- **THEN** the desktop `<nav>` element is hidden (carries `hidden xl:flex`)
- **AND** the hamburger toggle is visible (carries `xl:hidden`)

### Requirement: Header renders the quote CTA inside the nav
The site-header SHALL render a call-to-action link to request a quote as the last item inside the `<nav>` element. The CTA SHALL use the `--color-accent` (`#F26A21`) token via the utility `bg-accent` (with `hover:bg-accent-dark`). The CTA SHALL apply the heading font via `font-heading` (Montserrat) with `font-semibold` weight (600), `text-xs` size and `uppercase tracking-wide` per la escala tipográfica canónica. The CTA SHALL NOT apply `rounded` (flat design con radio 0) NOR `shadow-sm` (sombras reservadas para capas flotantes). The obsolete utility `bg-brand-orange` SHALL NOT appear. The CTA SHALL NOT use `hidden sm:inline-flex` (no longer needed since the nav's own responsive classes handle visibility via `hidden xl:flex` on desktop and `xl:hidden` on the overlay). (MODIFIED in `responsive-web-design-fixes` — las clases de visibilidad del nav pasan de `lg` a `xl`.)

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

### Requirement: Header supports a fullscreen mobile overlay with slide animation
The site-header SHALL collapse the desktop navigation into a toggleable hamburger menu on viewports smaller than 1280px. When toggled open, the mobile menu SHALL render as a **full-viewport overlay** (`100vw` × `100vh`) with a **white background** (`bg-white`), showing only the menu items and CTA. The overlay SHALL slide in from the right (off-screen `translateX(100%)` → visible `translateX(0)`) with a smooth `300ms ease-in-out` CSS transition. The hamburger button SHALL transform into an X button and SHALL remain always visible — positioned `fixed` with `z-50` (above the overlay's `z-40`) so the sliding menu layer does NOT cover it. The button's icon color SHALL adapt from white (on the navy header) to secondary `#1F2D40` (on the white overlay) via CSS driven by a `data-menu-open` attribute on the `<header>`. Body scroll SHALL be locked (`overflow:hidden` on `<body>`) while the overlay is open. The overlay SHALL fit fully within the viewport: neither its content nor the toggle button SHALL be clipped by the viewport edges. (MODIFIED in `responsive-web-design-fixes` — el breakpoint de colapso pasa de 1024px a 1280px y se exige que el overlay no recorte su contenido en viewports cortos.)

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

#### Scenario: El overlay no se recorta en viewports cortos
- **WHEN** el menú móvil se abre en el viewport `568×320`
- **THEN** todos los enlaces del menú y el CTA quedan dentro del alto del viewport (320px), sin recorte inferior
- **AND** el botón hamburguesa (fijo, `z-50`) queda completamente visible dentro del viewport

### Requirement: Header box contains the full logo height
The `.site-header` container SHALL include a responsive `padding-bottom` of `pb-10 lg:pb-4`: mobile keeps 80px (`h-20`) + 40px (`pb-10`) = 120px against a ~80.4px rendered logo at the 160px cap (full containment); desktop keeps 96px (`lg:h-24`) + 16px (`lg:pb-4`) = 112px against a ~120.5px rendered logo at the 240px cap — the same slight visual overflow accepted by the client in `ui-chrome-polish`, preserved by keeping the logo wrapper's `overflow-visible` behavior and the previous rendered heights. In short viewports (altura <= 400px, por ejemplo `568×320`) the header SHALL reduce its vertical padding and the height of its inner bar via a viewport-height media-query variant (`[@media(max-height:400px)]:`) so that the header + search group respects the viewport-height budget defined in `responsive-layout`. The compaction SHALL NOT apply to desktop viewports with a landscape orientation but a larger height (e.g. `1440×900`), whose approved composition is preserved. (MODIFIED in `responsive-web-design-fixes` — se agrega compactación por altura de viewport.)

#### Scenario: SC-001 — site-header carries pb-10 lg:pb-4
- **WHEN** the site-header renders
- **THEN** the `<header class="site-header">` element carries `pb-10` and `lg:pb-4`
- **AND** the previous `lg:pb-12` value does NOT appear in the header classes
- **AND** on mobile the header box contains the full logo height; on desktop the same slight 2× logo overflow accepted by the client remains

#### Scenario: Padding vertical reducido en viewports de baja altura
- **WHEN** el header se renderiza en un viewport de altura <= 400px (por ejemplo `568×320`)
- **THEN** el `<header>` aplica un padding vertical menor que el de portrait (variante `[@media(max-height:400px)]:`)
- **AND** el padding vertical reducido NO se aplica en un viewport de escritorio con orientación landscape y altura mayor (por ejemplo `1440×900`)

## ADDED Requirements

### Requirement: Header compacts the desktop navigation and never overflows horizontally

El header SHALL dimensionar el logo, los ítems de navegación y el CTA de modo que el conjunto completo (logo + nav + CTA) quepa dentro del ancho del viewport cuando el menú de escritorio está activo, sin generar scroll horizontal. Por debajo de `xl` (1280px) el menú de escritorio está colapsado (hamburguesa), por lo que el header solo expone el logo y el botón hamburguesa y no puede desbordar. El nav de escritorio SHALL declarar utilidades de compactación con breakpoint `lg:` (gap entre ítems, padding horizontal de los ítems y del CTA) que difieren de las aplicadas en `xl:`, de modo que la densidad de navegación compacta quepa en 1024px de ancho disponible y la de `xl:` conserve la densidad de escritorio con holgura. El ancho máximo del logo SHALL permanecer el declarado por la spec vigente (`max-w-[160px]` / `sm:max-w-[240px]`), sin variantes por rango `lg`→`xl`.

#### Scenario: El header cabe a 1024px

- **WHEN** el header se renderiza en el viewport `1024×768`
- **THEN** el `<nav aria-label="Navegación principal">` de escritorio está oculto y el botón hamburguesa está visible
- **AND** el ancho del `<header>` no supera el ancho del viewport
- **AND** `document.documentElement.scrollWidth` no supera `document.documentElement.clientWidth + 1`

#### Scenario: El header cabe a 1204px

- **WHEN** el header se renderiza en el viewport `1204×800`
- **THEN** el `<nav aria-label="Navegación principal">` de escritorio está oculto y el botón hamburguesa está visible
- **AND** ningún hijo visible del `<header>` extiende su `boundingBox` más allá del borde derecho del viewport

#### Scenario: El nav de escritorio cabe cuando está activo

- **WHEN** el header se renderiza con el menú de escritorio activo en el viewport `1280×800`
- **THEN** la suma de los anchos del logo, del nav y del CTA no supera el ancho disponible del contenedor
- **AND** el CTA "SOLICITAR COTIZACIÓN" permanece completamente visible
- **AND** `document.documentElement.scrollWidth` no supera `document.documentElement.clientWidth + 1`

#### Scenario: Compactación activa en el rango lg→xl

- **WHEN** se inspecciona el source de `Header.astro`
- **THEN** el nav y/o sus ítems declaran utilidades de compactación con breakpoint `lg:` (o menor) que difieren de las aplicadas en `xl:`
- **AND** el logo NO declara un ancho máximo distinto en `lg:` que en `xl:`
