## Why

La página `/servicios` actual reutiliza el patrón de cuatro tarjetas alternadas con un `intro` y una lista de bullets, pero el cliente entregó un diseño nuevo (`docs/design/components/soluciones/modelo.html` y `modelo.png`) con una estructura editorial más rica: un portafolio técnico de soluciones con especificaciones y un bloque de servicios en terreno con tres variantes de contenido. La página debe alinearse a ese diseño sin romper la identidad visual del sitio ni los deep links que llegan desde el home.

## What Changes

- Se reemplaza la sección actual de cuatro `ServiceCard` por dos secciones nuevas:
  1. **Nuestras Soluciones — Portafolio Técnico**: cuatro filas con icono, categoría, título, descripción, panel de especificaciones, chips y CTA.
  2. **Servicios Especializados en Terreno**: cuatro filas alternadas con imagen, caption sobre la imagen, índice/sector, título, descripción y cuerpo variable (features, bullets o tags).
- Se conservan intactos el Header, el Footer, el banner principal (Hero de `Layout`) y `ServicesHero`.
- Se conservan los cuatro slugs de servicio del home (`medicion-en-edificios`, `medicion-industrial`, `obras-y-proyectos`, `tratamiento-de-agua`) como anclas de la Sección 2, con el mismo `scroll-mt-*` para no romper los deep links.
- Se añaden anclas nuevas para la Sección 1 (`solucion-medicion-fluidos`, `solucion-tratamiento-agua`, `solucion-productos-quimicos`, `solucion-control-accesorios`).
- Todos los CTAs de ambas secciones apuntan a `/contacto`.
- Se extrae el contenido a `services-page.ts` con tipos nuevos, incluyendo una unión discriminada para el cuerpo variable de la Sección 2.
- **BREAKING** (interno): se retira `ServiceCard.astro`, su test y su snapshot al quedar sin uso. La exportación `SERVICIOS_PAGE_SERVICES` se sustituye por las nuevas secciones tipadas.
- Se actualiza el catálogo de iconos de `docs/design/style-guide/README.md` con los tres iconos Lucide nuevos usados por el rediseño (`flask-conical`, `settings-2`, `square-check`).

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `services-page`: cambia la composición de la página (dos secciones y tarjetas nuevas), se retiran los requisitos de `ServiceCard` y se agregan requisitos de `SolucionPortafolioCard`, `ServicioTerrenoCard`, `ServiciosSectionHeading` y de la composición de la página, manteniendo el hero, el banner y las anclas existentes.
- `design-tokens`: se amplía el catálogo documentado de iconos Lucide con `flask-conical`, `settings-2` y `square-check`.

## Impact

- `apps/web/src/pages/servicios.astro` (composición de la página).
- `apps/web/src/lib/config/services-page.ts` (contenido nuevo y reestructuración).
- `apps/web/src/lib/types/services-page.ts` (tipos nuevos y unión discriminada).
- `apps/web/src/components/`: nuevos `ServiciosSectionHeading.astro`, `SolucionPortafolioCard.astro`, `ServicioTerrenoCard.astro`, `ServiciosPortafolioSection.astro` y `ServiciosTerrenoSection.astro`; eliminación de `ServiceCard.astro`.
- `apps/web/src/components/__tests__/ServiceCard.test.ts` y `__snapshots__/ServiceCard.test.ts.snap` (eliminación).
- `apps/web/src/lib/config/__tests__/services-page.test.ts` y `apps/web/src/pages/__tests__/servicios.test.ts` (actualización).
- `docs/design/style-guide/README.md` (catálogo de iconos).
- Referencias documentales a `ServiceCard` en `apps/web/src/lib/types/services-page.ts`, `apps/web/src/lib/config/services-page.ts` y `ServicesHero.astro`.
- Sin cambios en backend, API, dependencias ni assets: las cuatro imágenes de la Sección 2 ya existen en `apps/web/src/assets/img/`.
