## Why

La página `/representaciones` todavía muestra wordmarks tipográficos de reemplazo aunque los logos reales ya fueron entregados, y su contenido no queda alineado con el `Header` porque usa un `max-width`/padding distinto al `.container` global. Además, el sitio conserva fondos casi blancos (`bg-bg`/blanco puro) que impiden que las tarjetas blancas resalten con el contraste buscado.

## What Changes

- **Logos reales en `/representaciones`**: importar los siete binarios de `apps/web/src/assets/img/representaciones/` con `astro:assets` y sustituir los wordmarks de texto en las tarjetas de marcas exclusivas y en las tarjetas de distribuidores autorizados. Las imágenes se optimizan a WebP en build, con `alt` descriptivo, dimensiones y carga diferida.
- **Alineación con el `Header`**: reemplazar los contenedores `mx-auto max-w-[1280px] px-6` de la página (hero y secciones) por el utility `.container` del sitio (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`), de modo que los bordes izquierdo y derecho coincidan exactamente con el `Header`.
- **Fondo base global**: usar `bg-surface-muted` (`#E9EEF3`) como fondo base de página en `Layout.astro` y en las superficies de sección que hoy usan `bg-bg` como fondo de página (home, `/representaciones`, `/servicios`, `/productos/[slug]`, `/cotizacion`, aplicaciones industriales). Las tarjetas, formularios y paneles de contenido conservan `bg-white`; `bg-bg` queda reservado a mats/controles anidados.
- Sin cambios en APIs, datos, rutas ni contratos de backend.

## Capabilities

### New Capabilities

Ninguna. El change ajusta el comportamiento de capacidades existentes.

### Modified Capabilities

- `design-tokens`: se agrega la regla de uso del fondo base del sitio (`bg-surface-muted`) frente a las tarjetas de contenido (`bg-white`) y se explicita el rol residual de `bg-bg`.
- `representaciones-page`: los logos de empresa pasan de wordmarks tipográficos a imágenes reales vía `astro:assets`; el contenido se alinea al `.container` del `Header`; las superficies de sección dejan de usar `bg-bg` como fondo de página.
- `services-page`: la Sección 1 de `/servicios` pasa de `bg-bg` a `bg-surface-muted`.
- `services-section`: la transición de la sección de servicios se documenta contra la nueva superficie `bg-surface-muted` de `SolutionSection`.
- `team-section`: el fondo de la sección de equipo del home pasa de `bg-bg` a `bg-surface-muted`.

## Impact

- **Páginas**: `apps/web/src/pages/representaciones.astro`, `cotizacion.astro`, `productos/[slug].astro`.
- **Layout**: `apps/web/src/layouts/Layout.astro` (fondo base del `body`).
- **Componentes**: `RepresentacionBrandCard.astro`, `DistribuidorCard.astro`, `RepresentacionesHero.astro`, `SolutionSection.astro`, `ServicesSection.astro` (comentario de transición), `NosotrosTeamSection.astro`, `ServiciosPortafolioSection.astro`, `IndustrialApplications.astro`.
- **Config y tipos**: `lib/config/representaciones-page.ts`, `lib/types/representaciones-page.ts` (contrato `logo: ImageMetadata`).
- **Assets**: `apps/web/src/assets/img/representaciones/*` (ya presentes; no se agregan binarios nuevos).
- **Tests**: tests de `representaciones`, `RepresentacionBrandCard`, `DistribuidorCard`, `NosotrosTeamSection`, `IndustrialApplications`, `ServiciosPortafolioSection` y config de la página.
- **Docs**: `docs/design/style-guide/README.md` si la tabla de tokens describe el rol semántico de `bg-surface-muted`/`bg-bg` (ajuste documental menor).
