## Why

El sitio público Astro (apps/web/) necesita un header principal global que dé identidad de marca (logo), navegación entre las secciones del catálogo y un CTA de conversión visible en todas las páginas. Es la segunda pieza de UI real del sitio (después de TopHeader) y desbloquea la navegación hacia las futuras páginas (nosotros, servicios, representaciones, contacto, cotización).

## What Changes

- Nuevo componente presentacional `Header.astro` en `apps/web/src/components/` (logo placeholder + nav de 5 items + CTA)
- Iconos SVG `MenuIcon.astro` y `CloseIcon.astro` para el menú mobile
- Tipos TypeScript `NavItem`, `CtaConfig`, `HeaderProps` en `apps/web/src/lib/types/header.ts`
- Config hardcoded de navegación `NAVIGATION_ITEMS` + helper `isActive()` + `getCtaConfig()` en `apps/web/src/lib/config/navigation.ts`
- Integración global en `Layout.astro` debajo de `<TopHeader />`
- Refactor mínimo de `TopHeader.astro`: `<header>` → `<div role="region">` para garantizar un único landmark `<header>` por página
- Nuevo token de color `brand-orange` en `tailwind.config.mjs` (CTA y underline del item activo)
- Página placeholder `pages/cotizacion.astro` para el destino del CTA
- Tests Vitest (unit + snapshot) y E2E Playwright (desktop/mobile)

## Capabilities

### New Capabilities
- `site-header`: Header principal global con logo, navegación de 5 items, estado activo por ruta y CTA de cotización; colapsa a hamburguesa en mobile

### Modified Capabilities
<!-- (ninguna — la spec `top-header` no cambia a nivel de requisitos; el refactor de landmark es detalle de implementación cubierto por el requirement de accesibilidad de `site-header`) -->

## Impact

- `apps/web/src/components/Header.astro` — nuevo componente presentacional
- `apps/web/src/components/icons/MenuIcon.astro`, `CloseIcon.astro` — iconos nuevos
- `apps/web/src/components/TopHeader.astro` — refactor `<header>` → `<div role="region">`
- `apps/web/src/lib/types/header.ts` — interfaces TypeScript nuevas
- `apps/web/src/lib/config/navigation.ts` — items + helpers nuevos
- `apps/web/src/layouts/Layout.astro` — integra `<Header />` bajo `<TopHeader />`
- `apps/web/src/pages/cotizacion.astro` — página placeholder nueva
- `apps/web/tailwind.config.mjs` — token `brand-orange`
- `apps/web/.env.example` — variables `CTA_LABEL`, `CTA_HREF`
- Tests: `Header.test.ts`, `navigation.test.ts`, E2E en `apps/web/e2e/`
