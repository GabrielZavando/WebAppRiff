## Why

La entrada de menú "Marcas" apunta hoy a `/marcas`, una página placeholder "en construcción" (`apps/web/src/pages/marcas.astro`). El cliente entregó el diseño definitivo de esa página y pidió renombrarla a "Representaciones", con contenido real de las marcas que Riff representa y distribuye. Se necesita reemplazar el placeholder por la página final usando el chrome existente del sitio.

## What Changes

- Se crea la ruta `/representaciones` con la página de contenido definitiva, compuesta dentro del `Layout.astro` existente (Header, Footer, WhatsApp flotante, SiteCredits y View Transitions/`ClientRouter`).
- La página replica las cuatro secciones del diseño de referencia (`docs/design/components/representaciones/reference.html` y `reference.png`), remapeando la paleta y tipografía Material (Stitch) a los design tokens de Riff.
- Se renombra el ítem del menú de navegación de `Marcas` a `Representaciones`, apuntando a `/representaciones` (en ambos navs: desktop y mobile, que se renderizan desde la misma lista).
- Los logos de las empresas se representan como **wordmarks tipográficos** (placeholders) preparados para sustituirse por `<Image>`/`astro:assets` cuando el cliente entregue los logos reales.
- Se actualizan los tests y snapshots afectados por el renombre (`Marcas` → `Representaciones`).

**BREAKING**: la ruta `/marcas` deja de existir (sin redirect, decisión de desarrollo). Cualquier enlace a `/marcas` quedará roto.

## Capabilities

### New Capabilities
- `representaciones-page`: página pública `/representaciones` con hero editorial, sección de marcas de representación exclusiva (5 wordmarks), sección de distribuidores autorizados (PIUSI, SENSUS) y sección de propuesta de valor, todo con los design tokens de Riff, iconos Lucide y componentes presentacionales alimentados por config tipado.

### Modified Capabilities
- `navigation-menu`: el ítem del menú principal pasa de `Marcas` (`/marcas`) a `Representaciones` (`/representaciones`); se actualiza el orden de referencia del menú en la spec existente.

## Impact

- **Rutas**: nueva `apps/web/src/pages/representaciones.astro`; se elimina `apps/web/src/pages/marcas.astro`.
- **Config/tipos**: nuevos `apps/web/src/lib/config/representaciones-page.ts` y `apps/web/src/lib/types/representaciones-page.ts`.
- **Componentes**: nuevos `RepresentacionesHero.astro`, `RepresentacionBrandCard.astro`, `DistribuidorCard.astro`, `ValuePropCard.astro` (nombres tentativos, ver design.md).
- **Navegación**: `apps/web/src/lib/config/navigation.ts` (`NAVIGATION_ITEMS`).
- **Tests**: unidad (`navigation.test.ts`, `Header.test.ts` + snapshot, nuevo test de página y de config) y e2e (`e2e/site-header.spec.ts`, `e2e/search-form.spec.ts`).
- **Assets**: sin binarios nuevos; los logos quedan como placeholders tipográficos.
- **Sitemap**: incluirá automáticamente `/representaciones` al descubrir rutas del build.

## Fuera de alcance

- No se agregan los logos reales de las empresas (no fueron entregados).
- No se implementan redirects ni redirecciones SEO desde `/marcas`.
- No se crea un layout standalone: se reutiliza `Layout.astro`.
- No se modifica el comportamiento del chrome global (header, footer, WhatsApp, view transitions).
