## Context

El sitio público Astro (apps/web/) está en fase de construcción de UI. Existe `TopHeader.astro` (barra de contacto: teléfono y redes), `Header.astro` (logo + nav de 5 items + CTA) y `SearchForm.astro` (buscador global), todos renderizados dentro de `Layout.astro`. En home, `Layout` envuelve el contenido en un shell hero (`relative z-10 flex flex-col min-h-screen`) sobre una imagen full-bleed; en el resto de páginas el header usa un degradado navy (`from-secondary to-secondary-light`) y el buscador un fondo blanco.

El cambio de "shrink-on-scroll" ya estaba planeado: `Header.astro` línea 36 tiene `TODO[site-header-scroll-animations]` y el `design.md` del change archivado `site-header` lo confirma explícitamente ("el logo se achicará al hacer scroll, pero ese efecto se implementa en un change futuro `site-header-scroll-animations`"). El color de destino #1F2D40 es exactamente el token `--color-secondary` declarado en `apps/web/src/styles/globals.css`, por lo que se usará `bg-secondary` (sin literales hex, según `frontend-standards.md`).

Restricciones del proyecto: SSG (sin hydration de framework), componentes `.astro` presentacionales (SRP: la lógica no trivial vive en `lib/`), tokens de Tailwind v4, sin literales hex en componentes, un único landmark `<header>` por página, y tests Vitest (unit + AstroContainer) + Playwright (E2E).

## Goals / Non-Goals

**Goals:**
- Mantener Header + Buscador fijos y visibles al hacer scroll (`position: sticky; top: 0`), sin saltos de layout ni solapamiento del contenido.
- Reducir el logo a 1/3 de su tamaño actual (100px desktop / 66px mobile) al activarse el estado compacto.
- Cambiar el fondo de Header + SearchForm a sólido `--color-secondary` (#1F2D40) al activarse el estado compacto, con reverso completo al volver al tope.
- Animación suave (300ms `ease-in-out`) para fondo y tamaño; respeto de `prefers-reduced-motion`.
- TopHeader (barra de contacto) se desplaza y desaparece fuera del conjunto fijo (decisión confirmada con el cliente).
- Efecto global en todas las páginas vía `Layout.astro`.
- Preservar exactamente un `<header>` por página y la funcionalidad del menú mobile (toggle `z-50`, overlay `z-40`).

**Non-Goals:**
- NO modificar la navegación, el CTA ni los items del menú.
- NO usar `position: fixed` para el conjunto (se eligió `sticky` para evitar saltos de layout y necesidad de espaciadores).
- NO involucrar a TopHeader en el estado fijo/compacto.
- NO cambiar el comportamiento del buscador (solo su apariencia en estado compacto; los `<select>`/`<input>` permanecen blancos para legibilidad).
- NO introducir dependencias nuevas.

## Decisions

1. **Sticky sobre fixed (confirmado con cliente)**: El wrapper que agrupa Header+Search usa `position: sticky; top: 0`. `sticky` mantiene el elemento en el flujo hasta que alcanza el tope, evitando el salto de layout y el solapamiento que produciría `fixed` (que requeriría un espaciador). Como TopHeader queda fuera del wrapper, se desplaza naturalmente y desaparece, cumpliendo "solo Header+Buscador fijos".

2. **Estado disparado por atributo `data-scrolled` en `document.body`**: Un módulo puro `lib/scroll/createHeaderScrollState.ts` escucha `scroll` (pasivo, con `requestAnimationFrame` para throttle) y togglea `data-scrolled="true|false"` en `body`. El CSS aplica los estilos compactos basándose en `body[data-scrolled="true"]`. Esto desacopla la lógica (testeable en Vitest) de la presentación y permite revertir solo removiendo el atributo.

3. **Lógica en `lib/`, no en frontmatter (SRP Astro)**: `shouldBeCompact(scrollY, threshold)` es una función pura testeable; `initHeaderScrollState()` cablea el listener. `Layout.astro` usa un `<script>` (bundled, no `is:inline`) que importa el módulo, manteniendo el frontmatter del layout libre de lógica no trivial.

4. **Animación vía pseudo-elemento `::after` en el Header (crossfade elegante)**: El Header arranca transparente (hero) o con degradado navy (resto). Para un cambio "suave y elegante" de cualquiera de esos estados a navy sólido, se usa un overlay `::after` con `background-color: var(--color-secondary); opacity: 0 → 1` (transición de opacidad 300ms). Esto da un fundido cruzado limpio, sin el "pop" abrupto que tendría quitar el degradado de golpe. El contenido del header sube con `z-index` para quedar por encima del overlay.

5. **SearchForm: transición de `background-color` simple**: El buscador arranca blanco, así que `transition: background-color 300ms` de blanco→`var(--color-secondary)` es suave por sí sola (no necesita overlay).

6. **Logo: `max-width` con transición**: La imagen conserva sus clases actuales (`w-full max-w-[200px] sm:max-w-[300px]`); se le añade `site-logo` y `transition: max-width 300ms`. En estado compacto, `max-width` pasa a 150px (<640px) / 200px (≥640px), manteniendo relación de aspecto (height auto). Es decir, el logo baja de 300px→200px en desktop y de 200px→150px en mobile (no a un tercio, sino a ~2/3), según ajuste de negocio posterior a la implementación inicial.

7. **Capas z-index**: El wrapper sticky usa `z-30`. El overlay mobile (`#mobile-nav`, `z-40`) y el toggle (`z-50`) definidos en `Header.astro` quedan por encima. El Header usa `isolation: isolate` para crear contexto de apilamiento del overlay `::after` (z-0) vs el contenido (z-1) **sin** convertirse en containing block de los hijos `fixed` (no hay `transform`/`filter`), por lo que el menú mobile sigue fijado al viewport.

8. **Color vía token, sin hex**: Se usa `--color-secondary` (= #1F2D40) en todo el CSS. Ningún literal hex en componentes (cumple `frontend-standards.md`).

9. **Drop-shadow en el bloque sticky al hacer scroll**: El wrapper sticky (`.header-scroll-shell`, `z-30`) recibe `box-shadow` solo en estado compacto (`body[data-scrolled="true"]`), aportando elevación y separación del contenido de página. Al volver a `scrollTop === 0` desaparece (`box-shadow: none`). El token del design system `--shadow-4` (`0 8px 20px rgba(22,32,46,.12)`) resultó imperceptible —sobre todo contra la imagen oscura del hero que queda bajo el header fijado—, por lo que se usa una elevación más pronunciada: `0 10px 30px rgba(22,32,46,.3)` (rgba de la paleta marca, sin hex suelto). `z-30` garantiza que la sombra se pinte sobre el contenido posterior (hermano posterior en el DOM). Se aplica al wrapper para que sea una sombra única de todo el conjunto, no una por elemento.

## Risks / Trade-offs

- **[Risk] Snapshot de `Header.test.ts` cambia** (se añaden clases `site-header`/`site-header__inner`/`site-logo`) → **Mitigation**: regenerar con `vitest -u`; el resto de asserts existentes siguen pasando porque no se remueven clases requeridas (gradiente/transparent, nav, CTA, a11y).
- **[Risk] Solapamiento del menú mobile con el estado compacto** → **Mitigation**: `isolation: isolate` + capas `z-0` (overlay `::after`) / `z-1` (contenido) en el header; `#mobile-nav` conserva `fixed inset-0 z-40` y el toggle `z-50`, ambos por encima del wrapper `z-30`.
- **[Risk] El buscador pasa de blanco→navy en páginas no-hero** (comportamiento global esperado) → **Mitigation**: los `<select>`/`<input>` permanecen blancos (ya validado por `SearchForm.test.ts`), manteniendo legibilidad sobre navy.
- **[Risk] Flicker por "bounce" de scroll en iOS** al rozar el tope → **Mitigation**: `threshold` configurable (default 0, congruente con "scrollTop vuelva a 0"); se puede subir a 2px si fuera necesario sin tocar la lógica de UI.
- **[Trade-off] `sticky` requiere que el wrapper sea el ancestro scrollable correcto**: funciona dentro del shell hero (`relative z-10`) y en páginas normales; el sticky se resuelve contra el viewport. Aceptado.
- **[Risk] El Astro Dev Toolbar inyecta `<header>` propios en `astro preview`** → **Mitigation**: los E2E cuentan `header:visible` y el estado se aplica por clases/atributos, no por conteo de headers; no se añaden nuevos `<header>`.

## Migration Plan

- No requiere migración de datos ni cambios de API (es puramente frontend estático).
- Deploy: build SSG estándar (misma pipeline). El change entra en un solo commit.
- Rollback: revertir el commit del change `site-header-scroll-animations`.
- Validación: `openspec validate site-header-scroll-animations` al archivar.

## Open Questions

- (Resuelto) Tamaño del logo: 200px desktop / 150px mobile (desde 300px / 200px; ajustado de la propuesta original de 1/3 tras feedback de negocio).
- (Resuelto) TopHeader fuera del conjunto fijo.
- (Resuelto) Sticky sobre fixed; alcance global.
- Umbral de activación: ¿0px (revertir exactamente en tope) o un pequeño margen (2px) para evitar flicker en iOS? Default propuesto 0px; ajustable vía `threshold` sin cambios de UI.
