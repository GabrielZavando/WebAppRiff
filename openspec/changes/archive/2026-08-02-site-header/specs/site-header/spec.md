## ADDED Requirements

### Requirement: Header renders logo link
The site-header SHALL render a logo link pointing to the home page.

#### Scenario: Logo placeholder rendered
- **WHEN** the Header renders with default logo props
- **THEN** an `<a>` element with `href="/"` and `aria-label="Ir al inicio"` wraps the logo
- **AND** the logo placeholder has the documented width/height and a visible placeholder label
- **AND** a `TODO` comment marks the exact location to swap in the real logo asset

### Requirement: Header renders navigation items in order
The site-header SHALL render the navigation items from the hardcoded `NAVIGATION_ITEMS` constant in the declared order.

#### Scenario: All five items displayed
- **WHEN** the Header renders on a desktop viewport (>= 1024px)
- **THEN** five links are rendered inside a `<nav aria-label="Navegación principal">`
- **AND** the labels appear in order: Inicio, Nosotros, Servicios, Representaciones, Contacto
- **AND** each link has the `href` declared in `NAVIGATION_ITEMS`

### Requirement: Header marks the active item
The site-header SHALL mark the navigation item matching the current path as active.

#### Scenario: Active item highlighted
- **WHEN** the Header renders with `activePath` equal to a non-root item href
- **THEN** that item's link carries `aria-current="page"`
- **AND** the active item shows a visual underline using the `brand-orange` color

#### Scenario: Inicio is active only at root
- **WHEN** the Header renders with `activePath === "/"`
- **THEN** the Inicio link carries `aria-current="page"`
- **AND** no other item carries `aria-current="page"`

#### Scenario: Inicio is not active on other paths
- **WHEN** the Header renders with `activePath === "/nosotros"`
- **THEN** the Inicio link does NOT carry `aria-current="page"`
- **AND** the Nosotros link does carry `aria-current="page"`

### Requirement: Header renders the quote CTA
The site-header SHALL render a call-to-action link to request a quote.

#### Scenario: CTA rendered
- **WHEN** the Header renders with a cta config
- **THEN** an `<a>` element is rendered with the CTA label text and its configured `href`
- **AND** the CTA uses the `brand-orange` background, bold uppercase text, and hover feedback

### Requirement: Header collapses navigation on mobile
The site-header SHALL collapse the desktop navigation into a toggleable hamburger menu on viewports smaller than 1024px.

#### Scenario: Desktop navigation hidden on mobile
- **WHEN** the viewport is smaller than 1024px
- **THEN** the desktop `<nav>` has class `hidden lg:flex`
- **AND** a hamburger toggle button with class `lg:hidden` is visible

#### Scenario: Mobile menu opens and closes
- **WHEN** the user clicks the hamburger toggle
- **THEN** the button's `aria-expanded` toggles between `"false"` and `"true"`
- **AND** the mobile panel toggles its `hidden` attribute accordingly
- **AND** the button `aria-label` switches between open/close intent

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
