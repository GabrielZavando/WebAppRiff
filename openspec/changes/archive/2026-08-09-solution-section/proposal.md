## Why

El sitio público Astro (apps/web/) ya cuenta con `TopHeader`, `Header`, `SearchForm`, `HeroBanner` y `PanelHome` integrados en `Layout.astro` + `index.astro` (en este orden DOM). La home actual comunica la propuesta de valor (hero) y el bloque de credibilidad/trust (panel con stats), pero falta la tercera pieza visual de la imagen de referencia `docs/design/components/SolutionSection.png`: la vitrina del portafolio de soluciones industriales de Riff.

Este change entrega el componente presentacional `SolutionSection.astro` que renderiza esa vitrina: un header con eyebrow `PORTAFOLIO` + headline `Nuestras Soluciones` + barra teal + párrafo descriptivo, seguido de un grid responsivo de 4 cards (Medición de Fluidos, Tratamiento de Agua, Productos Químicos, Control y Accesorios) — cada una con badge de icono Lucide, imagen, título, descripción truncada y link `SABER MÁS →`. Es la sexta pieza de UI real del sitio y materializa el bloque de descubrimiento de soluciones que la imagen de referencia coloca inmediatamente debajo del panel de credibilidad.

## What Changes

- Nuevo componente presentacional `SolutionSection.astro` en `apps/web/src/components/` (dumb: recibe todas las props desde la página, sin fetching ni lectura de `import.meta.env`)
- Tipos TypeScript `SolutionSectionProps`, `Solution`, `SolutionIconName` en `apps/web/src/lib/types/solution-section.ts`
- Config hardcoded del contenido de la sección `SOLUTION_SECTION_CONTENT` + `SOLUTIONS_DATA` en `apps/web/src/lib/config/solution-section.ts` (mismo patrón que `HERO_BANNER_CONTENT`, `PANEL_HOME_CONTENT`, `NAVIGATION_ITEMS` y `CATEGORY_OPTIONS`)
- 4 fotos reales del cliente en `apps/web/src/assets/img/` (`medicion-fluidos.webp`, `tratamiento-agua.webp`, `productos-quimicos.webp`, `control-accesorios.webp`, 1920x1080 WebP) — POST-APPLY UPDATE: originalmente 4 placeholders WebP `solucion-*.webp`; el cliente entregó las fotos reales el 2026-08-09 y se actualizaron los imports (cero cambios de componente)
- Página `apps/web/src/pages/index.astro` actualizada: añade `<SolutionSection {...SOLUTION_SECTION_CONTENT} />` DESPUÉS del `<PanelHome {...PANEL_HOME_CONTENT} />` existente, dentro del `<slot />` del `<Layout>`
- Tests Vitest (unit de config + AstroContainer + snapshot) y E2E Playwright (desktop/tablet/mobile/accesibilidad/contraste)
- No se modifica `HeroBanner.astro`, `PanelHome.astro` ni sus specs archivadas — el nuevo componente se renderiza vía el `<slot />` de `index.astro`, sin solapamiento visual sobre los anteriores
- No requiere cambios en `docs/api-spec.yml` (la sección no consume API)
- No requiere cambios en `docs/data-model.md` (no hay entidades nuevas)
- No requiere cambios en `Layout.astro` (`SolutionSection` se renderiza vía el `<slot />` de `index.astro`, al igual que `HeroBanner` y `PanelHome`)

## Capabilities

### New Capabilities
- `solution-section`: Vitrina del portafolio de soluciones industriales del home del sitio público, presentacional (dumb), con un header (eyebrow naranja + headline `<h3>` + barra teal + descripción) y un grid responsivo de 4 cards (1 col en mobile → 2 cols en tablet ≥ 640px → 4 cols en desktop ≥ 1024px). Cada card lleva un badge de icono Lucide sobre fondo teal en la esquina superior izquierda, una imagen full-width, un título `<h4>` navy, una descripción truncada y un link `SABER MÁS →` teal. El headline de la sección es `<h3>` (subordinado al `<h2>` del PanelHome; la home mantiene un único `<h1>` aportado por el HeroBanner). Accesible: los 4 links son focusable, las imágenes tienen ALT descriptivo, los iconos decorativos llevan `aria-hidden`. Responsive mobile-first.

### Modified Capabilities
<!-- (ninguna — las specs `hero-banner`, `panel-home`, `search-form`, `site-header` y `top-header` no cambian: el SolutionSection se renderiza vía el <slot> de index.astro sin tocar sus contratos) -->

## Impact

- `apps/web/src/components/SolutionSection.astro` — nuevo componente presentacional (dumb)
- `apps/web/src/lib/types/solution-section.ts` — interfaces TypeScript nuevas (`SolutionSectionProps`, `Solution`, `SolutionIconName`)
- `apps/web/src/lib/config/solution-section.ts` — constantes `SOLUTIONS_DATA` y `SOLUTION_SECTION_CONTENT`
- `apps/web/src/lib/config/__tests__/solution-section.test.ts` — tests unitarios de shape
- `apps/web/src/components/__tests__/SolutionSection.test.ts` — tests AstroContainer + snapshot
- `apps/web/src/components/__tests__/__snapshots__/SolutionSection.test.ts.snap` — snapshot del HTML renderizado
- `apps/web/src/assets/img/medicion-fluidos.webp` — foto real del catálogo Riff (subida por el cliente 2026-08-09)
- `apps/web/src/assets/img/tratamiento-agua.webp` — foto real del catálogo Riff (subida por el cliente 2026-08-09)
- `apps/web/src/assets/img/productos-quimicos.webp` — foto real del catálogo Riff (subida por el cliente 2026-08-09)
- `apps/web/src/assets/img/control-accesorios.webp` — foto real del catálogo Riff (subida por el cliente 2026-08-09)
- `apps/web/src/pages/index.astro` — añade `<SolutionSection {...SOLUTION_SECTION_CONTENT} />` después del `<PanelHome {...PANEL_HOME_CONTENT} />`
- `apps/web/e2e/solution-section.spec.ts` — E2E Playwright nuevos
- No requiere cambios en `apps/web/src/components/HeroBanner.astro` ni en `PanelHome.astro` ni sus snapshots existentes
- No requiere cambios en `apps/web/src/layouts/Layout.astro` (el SolutionSection se renderiza vía el `<slot />` de `index.astro`)
- No requiere cambios en `docs/api-spec.yml` (la sección no consume API)
- No requiere cambios en `docs/data-model.md` (no hay entidades nuevas)
