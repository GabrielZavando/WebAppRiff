# Proposal — Carrusel infinito de logos de clientes en /nosotros

## Why

La sección "Quienes Han Confiado en Nosotros" del `/nosotros` muestra hoy una grilla estática de ocho nombres de empresa en texto. El cliente ya entregó **41 logos reales** (`apps/web/src/assets/img/slider/`, actualmente huérfanos) y quiere exhibirlos con un carrusel automático e infinito que transmita dinamismo y aproveche la prueba social real. La grilla actual no usa imágenes, no es escalable y desperdicia los assets disponibles.

## What Changes

- Se reemplaza por completo la grilla estática de 8 nombres por un **carrusel infinito de 41 logos** (sin bajadas de sector; solo logotipos).
- El carrusel se desplaza automáticamente de derecha a izquierda, lento y continuo (120 s por ciclo completo, constante en configuración).
- Cada logo se muestra **completo** (sin recorte, con su margen interno eliminado) con una altura uniforme y un ancho proporcional a su relación de aspecto, sobre una tarjeta blanca con padding.
- Al hacer hover sobre el carrusel, la animación **se pausa**; al quitar el cursor, se reanuda.
- Al hacer hover sobre un logo, el logo completo **aumenta ligeramente** de tamaño sin recortarse, mientras la tarjeta blanca conserva su tamaño. El efecto se implementa con `scale3d` (`translateZ(0)` / `will-change: transform`) para delegar el trabajo a la GPU y minimizar consumo de CPU.
- Los logos se sirven optimizados en **WebP generado en build time** vía `astro:assets` (`<Image>` + sharp), con `loading="lazy"` y `alt` descriptivo por empresa.
- Los 41 logos se ordenan **alfabéticamente por nombre de empresa**, definido en el archivo de configuración (el orden del array es la fuente de verdad).
- Con `prefers-reduced-motion: reduce` la animación queda **detenida estáticamente**, mostrando los logos sin desplazamiento.
- Se mantiene el encabezado de la sección y el banner de cierre con sus CTAs; solo cambia el bloque de clientes.
- **BREAKING (spec-level)**: SC-207 deja de exigir "un grid con exactamente 8 clientes con su bajada de sector verbatim" y pasa a exigir el carrusel de 41 logos; el colapso responsive 2→4→8 de SC-211 deja de aplicar a esta sección.

## Capabilities

### New Capabilities

Ninguna. El comportamiento se modela como modificación de la capability existente `nosotros-page`, y el pipeline de imágenes ya está cubierto por `image-assets`.

### Modified Capabilities

- `nosotros-page`: se modifica el requirement "Clients grid and closing CTA banner" (SC-207) y se ajusta el requirement responsive (SC-211) para reflejar el carrusel de logos en lugar de la grilla de 8 nombres.
- `image-assets`: se añade un requirement que fija que el conjunto de logos de clientes (`src/assets/img/slider/`) se consume vía `astro:assets` y se sirve como WebP generado en build time, con `alt` proveniente de un mapa explícito en configuración.

## Impact

- **Código afectado**:
  - `apps/web/src/components/NosotrosClients.astro` (reemplaza el grid por el carrusel).
  - Nuevo `apps/web/src/components/NosotrosClientsCarousel.astro`.
  - `apps/web/src/lib/types/nosotros-page.ts` (`ClientCard` → `ClientLogo`).
  - `apps/web/src/lib/config/nosotros-page.ts` (se retira el array de 8 clientes).
  - Nuevo `apps/web/src/lib/config/nosotros-clients.ts` (41 imports + mapa de alt + orden alfabético + constante de duración).
  - Tests: `apps/web/src/components/__tests__/NosotrosClients.test.ts` (actualización) y nuevo `NosotrosClientsCarousel.test.ts`.
- **Assets**: se incorporan al build los 41 archivos de `apps/web/src/assets/img/slider/` (39 `.png` + 2 `.jpeg`), convertidos a WebP por sharp.
- **Specs**: `openspec/specs/nosotros-page/spec.md` e `openspec/specs/image-assets/spec.md` reciben deltas.
- **Sin cambios** en API, backend, base de datos ni dependencias nuevas (astro:assets y sharp ya están en uso).
- **SEO/Performance**: imágenes lazy bajo el fold; la animación no bloquea el main thread (CSS puro, sin JavaScript).
