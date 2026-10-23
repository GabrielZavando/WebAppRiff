## Why

La página `/nosotros` quedó con tres inconsistencias visuales frente al resto del sitio: su hero no comparte el patrón técnico del hero de `/representaciones`, la timeline alterna colores de marcador y deja una línea vertical que atraviesa los números y la estrella, y varias secciones usan blanco puro como fondo de página, lo que impide que las tarjetas blancas de contenido se separen del fondo. Este change unifica esos detalles sin alterar contenido, rutas ni estructura.

## What Changes

- **Hero de `/nosotros`**: reemplazar el degradado claro (`from-secondary via-bg to-secondary`) y la rejilla SVG ad-hoc por el mismo fondo `bg-secondary` con el patrón técnico de rejilla que usa `RepresentacionesHero.astro` (clase `rep-grid` basada en tokens, sin hex literales). Se conserva el copy, los CTAs y la imagen técnica.
- **Timeline**:
  - Unificar el fondo de los cuatro marcadores numéricos (01–04) en un solo token (`bg-primary-deep`), eliminando la alternancia que dejaba los marcadores impares con `bg-bg` y borde.
  - Eliminar la línea vertical central que atraviesa los marcadores numéricos y la estrella del último hito. La estrella conserva su color original (`bg-accent`) y su tamaño.
- **Fondo global**: pasar el fondo de página de `/nosotros` de blanco puro a un nuevo token de superficie grisácea (`--color-surface-muted`, utility `bg-surface-muted`) en las secciones de contenido claras (`NosotrosValueProp`, `NosotrosTeamGrid`) y en el `<main>`, manteniendo las tarjetas de contenido en blanco (`bg-white`) para que contrasten. `NosotrosTimeline` y `NosotrosIdentity` también pasan a `bg-surface-muted`; `NosotrosClients` sigue siendo la banda oscura de marca. El token se declara en `apps/web` y en su espejo `apps/admin`, y se documenta en la guía de diseño.
- **Tests**: actualizar los contratos de `NosotrosHero`, `NosotrosTimeline` y de la página para reflejar el patrón de rejilla compartido, los marcadores uniformes, la ausencia de línea central y el fondo `bg-surface-muted`.

No hay cambios de contenido, rutas, datos ni nuevas dependencias. No hay cambios **BREAKING**.

## Capabilities

### New Capabilities

- Ninguna.

### Modified Capabilities

- `nosotros-page`: se modifican los requirements de tokens/estilos (hero con patrón de rejilla de `/representaciones`, marcadores uniformes sin línea central, fondo de página con superficie grisácea y tarjetas blancas).
- `design-tokens`: se añade el token neutro `--color-surface-muted` a la paleta de neutros (web + admin + guía de diseño).

## Impact

- `apps/web/src/components/NosotrosHero.astro`
- `apps/web/src/components/NosotrosTimeline.astro`
- `apps/web/src/components/NosotrosValueProp.astro`
- `apps/web/src/components/NosotrosTeamGrid.astro`
- `apps/web/src/pages/nosotros.astro` (fondo del `<main>`)
- `apps/web/src/styles/globals.css` y `apps/admin/src/styles/globals.css` (nuevo token neutro)
- `docs/design/style-guide/README.md` (tabla canónica de tokens)
- Tests: `apps/web/src/components/__tests__/NosotrosHero.test.ts`, `NosotrosTimeline.test.ts`, `apps/web/src/pages/__tests__/nosotros.test.ts`, `apps/web/src/styles/__tests__/tokens.test.ts`
- Sin cambios en el resto de los tokens del sistema (`bg-secondary`, `bg-primary-deep`, `bg-accent`, `bg-white`).
