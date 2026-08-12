## Context

El sitio público Astro (`apps/web/`) ya tiene implementado el `Header.astro` con
un layout de contenedor flexbox: logo (165×67) a la izquierda, navegación de 5
items en un `<nav>` desktop (`hidden lg:flex`), CTA "SOLICITAR COTIZACIÓN" como
`<a>` separado fuera del nav (`hidden sm:inline-flex`, `bg-accent`), y un panel
móvil colapsable debajo del header (`#mobile-nav` con `hidden`, toggled vía
`<script is:inline>`). El spec canónico está en `openspec/specs/site-header/spec.md`.

El cliente solicita rejustar el comportamiento, diseño y contenido del Header:

1. El CTA debe pertenecer al menú (dentro del `<nav>`), como último item.
2. Los items del menú cambian a: Inicio, Productos, Servicios, Marcas, Contacto.
3. El menú se alinea a la derecha (desktop).
4. El subrayado del item activo pasa de 2px a 3px de grosor, color `#41B3C4`.
5. El menú móvil es un overlay a pantalla completa (100vw×100vh, fondo blanco)
   que se desliza de derecha a izquierda con animación suave; el botón
   hamburguesa/X siempre visible (z-index por encima del overlay).
6. El logo se muestra al 2× su tamaño (330px) usando overflow, sin crecer el
   contenedor del header.

## Goals / Non-Goals

**Goals:**
- El CTA "SOLICITAR COTIZACIÓN" es el último item del `<nav>` (desktop y mobile),
  preservando su estilado `bg-accent`.
- Los items de navegación cambian a Inicio, Productos, Servicios, Marcas, Contacto
  con hrefs `/`, `/productos`, `/servicios`, `/marcas`, `/contacto`.
- El menú desktop está right-aligned (`ml-auto`).
- El subrayado activo es 3px (`after:h-[3px]`) con color `#41B3C4` (`after:bg-primary`),
  aplicado tanto en desktop como mobile.
- El menú móvil es un overlay fullscreen con `bg-white`, animación CSS
  `translate-x-full` → `translate-x-0` (300ms ease-in-out), controlled by a
  `data-menu-open` attribute on `<header>`.
- El botón hamburguesa/X es `position: fixed` con `z-50`, siempre visible; su color
  cambia de `text-white` a `text-secondary` (sobre fondo blanco) via CSS.
- El logo se renderiza a 330×134 con `overflow-visible` y `h-24` en el contenedor `<a>`,
  manteniendo la altura del header.
- Body scroll lock (`overflow:hidden`) cuando el overlay está abierto.
- Tests Vitest + E2E Playwright cubren todos los nuevos requisitos.

**Non-Goals:**
- NO shrink-on-scroll del logo (remain TODO `[site-header-scroll-animations]`).
- NO cierre al hacer click fuera del overlay (fuera de scope; documentado como
  mejora futura — solo el botón X cierra).
- NO subnavegación, breadcrumbs ni search en el header.
- NO variaciones por página del menú (siempre los mismos 5 items + CTA).
- NO creación de página `/marcas` (se mantiene el patrón actual: nav items pueden
  apuntar a rutas sin página aún, como `/servicios` y `/contacto`).
- NO cambios en el CTA destination page (`/cotizacion` sigue funcionando).

## Decisions

### Decision 1: CTA moves inside `<nav>`
El CTA SHALL render inside the `<nav aria-label="Navegación principal">` as the
last `<a>` child. Se elimina el utility `hidden sm:inline-flex` porque la
visibilidad ya la controla el propio `<nav>` (`hidden lg:flex` para desktop,
`lg:hidden` para el overlay mobile). El estilado `bg-accent hover:bg-accent-dark
font-heading font-semibold uppercase text-xs tracking-wide px-6 py-3` se mantiene
inalterado ("no debe cambiar de estilos").

**Rationale**: El cliente quiere que el CTA "pertenezca al menu". En desktop
está dentro del nav right-aligned (después de Contacto). En mobile está dentro
del overlay nav (último item). Same markup, different container context.

### Decision 2: Right-aligned nav via `ml-auto`
El `<nav>` desktop SHALL use `ml-auto` to push it to the right edge of the
flexbox container. Con `justify-between` en el `<div class="container">`, el logo
queda a la izquierda y el nav (con items + CTA) a la derecha.

### Decision 3: 3px active underline
El pseudo-elemento `::after` del item activo SHALL cambiar de `h-0.5` (2px) a
`h-[3px]` (3px). El color permanece `after:bg-primary` (`#41B3C4`). Se aplica en
desktop (`after:-bottom-1`) y mobile (`after:-bottom-1`).

### Decision 4: Fullscreen overlay via CSS `data-menu-open`
El overlay mobile (`#mobile-nav`) SHALL ser `fixed inset-0 bg-white z-40 lg:hidden`
con `transition-transform duration-300 ease-in-out`. El atributo
`data-menu-open` en el `<header>` controla el transform:

- `data-menu-open="false"`: `transform: translateX(100%)` (off-screen derecha),
  `pointer-events: none`.
- `data-menu-open="true"`: `transform: translateX(0)` (visible),
  `pointer-events: auto`.

El CSS está en un `<style is:inline>` dentro del componente (scope local, no
afecta otras páginas). Usa `header[data-menu-open="true"] #mobile-nav { ... }`.

**Rationale**: CSS transitions are smoother than JS class toggling and don't
require hydration. The `data-menu-open` on `<header>` also drives the button
color change (Decision 5), keeping a single source of truth for the menu state.

### Decision 5: Fixed toggle button with color adaptation
El botón toggle SHALL ser `position: fixed top-6 right-6 z-50 lg:hidden` —
fuera del flow normal, siempre visible por encima del overlay (z-50 > z-40).

Su color se adapta via CSS:
- `header[data-menu-open="false"] [data-menu-toggle]` → `color: var(--color-white)`
  (visible sobre el header navy)
- `header[data-menu-open="true"] [data-menu-toggle]` → `color: var(--color-secondary)`,
  `background-color: var(--color-white)` (visible sobre el overlay blanco)

La transición de iconos (hamburguesa ↔ X) se mantiene vía el `<script is:inline>`
existente (`button.querySelectorAll('svg').forEach(...classList.toggle('hidden'))`).

### Decision 6: Logo 2× with overflow constraint
El `<Image>` SHALL render a `width={330}` y `height={134}` (doble de 165×67). El
`<a>` wrapper SHALL tener `class="shrink-0 h-24 overflow-visible"` — la altura
del header (`h-24` = 96px) se mantiene; la imagen (134px de alto) visualmente
desborda sin crecer el contenedor. `overflow-visible` (default) permite el
desbordamiento sin recortar.

**Rationale**: El `<a>` con `h-24` tiene altura explícita; el `<img>` (134px)
overflowea visualmente pero el header no crece. Los sibling elements (nav, button)
mantienen su posición.

### Decision 7: Body scroll lock via inline script
Cuando `data-menu-open` pasa a `"true"`, el `<script is:inline>` SHALL set
`document.body.style.overflow = 'hidden'`. Al cerrar, lo restaura a `''`.
Esto evita scroll-through del contenido detrás del overlay fullscreen.

### Decision 8: Inline `<style is:inline>` for CSS state rules
El CSS para `[data-menu-open]` selectors SHALL vivir en un `<style is:inline>`
dentro de `Header.astro`, scoped to `header[data-menu-open]` selectors. No se
agrega a `globals.css` para mantener el change localizado al componente.

## Risks / Trade-offs

- **Risk**: CSS `overflow: visible` + explicit `h-24` en el `<a>` podría no
  constrar el header en todos los navegadores → **Mitigation**: el `<a>` es
  `shrink-0` dentro de un flex `h-24`; con altura explícita el flex item no
  crece. Test E2E verifica el header height en mobile y desktop.
- **Risk**: El botón `fixed` podría no estar visible si otro elemento tiene
  z-index > 50 → **Mitigation**: el overlay usa `z-40`, el button `z-50`; el
  header está en `z-0` por defecto. Test verifica `z-50` en el button.
- **Risk**: `pointer-events: none` en el overlay cuando está cerrado podría
  interferir con clicks en el header → **Mitigation**: el overlay está off-screen
  (translateX) y `lg:hidden`; en desktop no existe. Solo afecta mobile.
- **Risk**: `<style is:inline>` puede ser eliminado por minificación en build →
  **Mitigation**: Astro preserva `<style is:inline>` en el HTML de salida; test
  de build verifica que el CSS está presente.
- **Trade-off**: No hay cierre al hacer click fuera (click-away) → el usuario debe
  usar el botón X. Esto simplifica el JS (no se necesita event listener en el
  overlay). Se documenta como mejora futura.

## Migration Plan

- **No data migration**: navigation items son hardcoded en un SSG; cualquier
  cambio requiere rebuild.
- **No API changes**: el Header es 100% presentacional (dumb component); no
  consumes backend APIs.
- **Deploy**: build SSG estándar (`npm run build --workspace=apps/web`). El change
  entra junto con los tests actualizados.
- **Rollback**: revertir el commit del change. El Header vuelve al estado anterior
  (panel móvil colapsable, CTA fuera del nav).

## Open Questions

- **(Resuelta)** Hex del naranja CTA: ya es `--color-accent` (#F26A21) confirmado
  en `docs/design/style-guide/README.md`. No cambia.
- **(Resuelta)** Color del subrayado activo: `#41B3C4` = `--color-primary`, ya usado
  actualmente. No cambia, solo el grosor (2px→3px).
- **(Pendiente)** Si se quiere click-away para cerrar el overlay: fuera de scope para
  este change. Se documenta como futura mejora.
