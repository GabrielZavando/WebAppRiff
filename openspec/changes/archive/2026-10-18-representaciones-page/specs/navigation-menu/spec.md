## MODIFIED Requirements

### Requirement: Navigation includes the Nosotros page link
The main menu (`NAVIGATION_ITEMS` in `lib/config/navigation.ts`) SHALL include the item `{ label: 'Nosotros', href: '/nosotros' }` placed after "Inicio" (order: Inicio, Nosotros, Productos, Servicios, Representaciones, Contacto). Both navs rendered by `Header.astro` (desktop and mobile) render from the same list, so the new item SHALL appear in both; `isActive('/nosotros', currentPath)` SHALL mark it active on `/nosotros` (exact and prefix matching already supported). (ADDED in `ui-chrome-polish`; MODIFIED in `nosotros-page` — la página `/nosotros` ya no está vacía: ahora renderiza las secciones institucionales de la capability `nosotros-page`; MODIFIED in `representaciones-page` — el ítem `Marcas` del orden de referencia se renombra a `Representaciones`.)

#### Scenario: SC-006 — Nosotros link renders in both navs with active state
- **WHEN** the site header renders (desktop nav or mobile menu) on any page
- **THEN** the navigation includes the link "Nosotros" pointing to `/nosotros`
- **AND** when the current path is `/nosotros`, the link carries `aria-current="page"`
- **AND** the `/nosotros` page (institutional content, per the `nosotros-page` capability) is reachable from the menu

## ADDED Requirements

### Requirement: Navigation includes the Representaciones page link (renamed from Marcas)

The main menu (`NAVIGATION_ITEMS` in `lib/config/navigation.ts`) SHALL replace the former item `{ label: 'Marcas', href: '/marcas' }` with `{ label: 'Representaciones', href: '/representaciones' }`. Both navs rendered by `Header.astro` (desktop nav and mobile menu) render from the same list, so the renamed item SHALL appear in both. `isActive('/representaciones', currentPath)` SHALL mark it active on `/representaciones` (exact and prefix matching already supported). No navigation item labelled "Marcas" pointing to `/marcas` SHALL remain anywhere in the menu.

#### Scenario: SC-REP-NAV — Representaciones link renders in both navs with active state

- **WHEN** the site header renders (desktop nav or mobile menu) on any page
- **THEN** the navigation includes the link "Representaciones" pointing to `/representaciones`
- **AND** no navigation item labelled "Marcas" or pointing to `/marcas` is rendered
- **AND** when the current path is `/representaciones`, the link carries `aria-current="page"`
- **AND** the `/representaciones` page (per the `representaciones-page` capability) is reachable from the menu
