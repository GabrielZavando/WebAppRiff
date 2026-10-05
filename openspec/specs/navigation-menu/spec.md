# navigation-menu Specification

## Purpose
La navegación del sitio público incluye el enlace a la página Nosotros.
## Requirements
### Requirement: Navigation includes the Nosotros page link
The main menu (`NAVIGATION_ITEMS` in `lib/config/navigation.ts`) SHALL include the item `{ label: 'Nosotros', href: '/nosotros' }` placed after "Inicio" (order: Inicio, Nosotros, Productos, Servicios, Marcas, Contacto). Both navs rendered by `Header.astro` (desktop and mobile) render from the same list, so the new item SHALL appear in both; `isActive('/nosotros', currentPath)` SHALL mark it active on `/nosotros` (exact and prefix matching already supported). (ADDED in `ui-chrome-polish`.)

#### Scenario: SC-006 — Nosotros link renders in both navs with active state
- **WHEN** the site header renders (desktop nav or mobile menu) on any page
- **THEN** the navigation includes the link "Nosotros" pointing to `/nosotros`
- **AND** when the current path is `/nosotros`, the link carries `aria-current="page"`
- **AND** the empty `/nosotros` page (Header + Footer only) is reachable from the menu

