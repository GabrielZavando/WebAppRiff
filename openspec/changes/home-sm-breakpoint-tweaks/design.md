## Context

La home (`/`) se renderiza con Astro + Tailwind v4 sobre `apps/web`. Los tres componentes afectados son presentacionales (dumb) y reciben su contenido por props, por lo que el cambio es puramente de clases/markup, sin tocar contratos de datos ni APIs.

Estado actual observado en el código:

- `SearchForm.astro` (líneas 71–115): el `<form>` usa `sm:flex sm:flex-row`; el contenedor del `<select>` declara `sm:w-64 sm:shrink-0`; el del `<input>` declara `sm:flex-1 min-w-0`; el botón declara `px-4 sm:px-8` y muestra el ícono más un `<span class="hidden sm:inline">BUSCAR</span>` que reaparece desde `sm`.
- `ServicesSection.astro` (líneas 69–99): grilla `grid-cols-1 sm:grid-cols-2`; cada `<article>` declara `flex flex-col sm:flex-row` y la imagen `w-full sm:w-2/5 aspect-[5/4]`.
- `NosotrosTeamSection.astro` (líneas 97–107): el overlay declara el nombre como `font-heading text-xl font-bold text-white` y el cargo como `mt-1 font-heading text-xs font-semibold uppercase tracking-wider text-primary`, sin variantes responsive.

Restricciones del proyecto: diseño plano (sin `rounded*`/`shadow*`), tokens de diseño del proyecto (sin hex literales), TypeScript estricto, TDD (test fallido primero), artefactos OpenSpec en español y código en inglés.

Cambios previos relacionados ya archivados: `2026-11-01-home-sm-breakpoint-fixes` (reparto de ancho del buscador, grillas desde `sm`) y `2026-11-02-home-base-breakpoint-tweaks` (breakpoint base, ratio 5:4, overlay del equipo con solo nombre y cargo). Este change los continúa, no los contradice: la base (`< 640px`) queda intacta.

## Goals / Non-Goals

**Goals:**

- Botón submit del buscador solo-ícono en todos los breakpoints, acotado a 60px desde `sm`, con nombre accesible "BUSCAR" preservado.
- Reparto equitativo del espacio horizontal entre `<select>` e `<input>` desde `sm`.
- Layout vertical estricto de las tarjetas de "Servicios especializados" (imagen → título → descripción → CTA) conservando grilla de 2 columnas y ratio 5:4.
- Reducción del tamaño de fuente del texto superpuesto de las tarjetas de equipo desde `sm`.
- Actualización de unit tests, snapshots y e2e afectados, y validación estricta de OpenSpec.

**Non-Goals:**

- No se cambia el breakpoint base (`< 640px`) de ningún componente.
- No se cambia el grido de columnas de servicios (2 desde `sm`) ni de equipo (3 desde `sm`).
- No se toca el contrato de props, la configuración de contenido ni la lógica de submit del buscador.
- No se modifican la API, el backend, Firestore, las dependencias ni la infraestructura.
- No se rediseña la sección de servicios completa (colores, tipografía de títulos, CTA inferior).

## Decisions

### D1 — El texto del botón se oculta por CSS, no se elimina del DOM

Se conserva el `<span>` con `config.submitLabel` pero con la utility `hidden` y sin variante `sm:` que lo vuelva a mostrar. El nombre accesible lo aporta `aria-label="BUSCAR"` en todos los breakpoints.

- **Alternativa A (elegida)**: mantener el `<span>` oculto en el DOM. Preserva el orden DOM ícono → texto (contrato ya verificado por unit test y e2e), y el e2e móvil que localiza `button.locator('span')` y espera que esté oculto sigue siendo válido.
- **Alternativa B**: eliminar el `<span>` del DOM. Simplifica el markup, pero obliga a reescribir el test de orden ícono/texto y el e2e móvil, y deja el botón sin texto en el DOM (solo `aria-label`).

### D2 — El botón usa padding compacto y `max-w` en lugar de `px-8`

Desde `sm` el botón pasa de `px-8` a `px-4` y se acota con `sm:max-w-[60px]`. Con `px-8` (32px por lado) el contenido útil del botón quedaría por debajo de 60px y el ícono de 16px quedaría tight contra el borde; con `px-4` (16px por lado) el ícono queda centrado con ~22px libres.

- **Alternativa A (elegida)**: `px-4` + `sm:max-w-[60px]`.
- **Alternativa B**: mantener `sm:px-8` y dejar que `max-w-[60px]` recorte el contenido. Produce un botón visualmente descuadrado y dependiente del `overflow`.

### D3 — Reparto equitativo con `flex-1` en ambos contenedores

El contenedor del `<select>` deja de declarar `sm:w-64 sm:shrink-0` y pasa a `sm:flex-1 sm:min-w-0`; el contenedor del `<input>` mantiene `sm:flex-1 min-w-0`. Con `flex: 1 1 0%` ambos parten de la misma base y crecen por igual, de modo que el reparto es exactamente 50/50 del espacio libre, sin depender del ancho del texto.

- **Alternativa A (elegida)**: `flex-1` en ambos.
- **Alternativa B**: grid `sm:grid-cols-2` sobre el `<form>`. Exige reordenar el markup (el botón pasaría a ocupar una celda o a salir del grid) y rompe el modelo actual de una sola fila con `gap-px`.
- **Verificación**: a 640px el contenedor interior mide ~608px; con el botón acotado a 60px y `gap-px` quedan ~546px, es decir ~273px por control, por encima del mínimo de 256px que exige el requisito vigente de "Todas las categorías" completo.

### D4 — Las tarjetas de servicios pasan a `flex-col` en todos los breakpoints

Se elimina `sm:flex-row` del `<article>` y `sm:w-2/5` de la imagen; la imagen queda `w-full aspect-[5/4]`. El orden vertical (imagen → título → descripción → CTA) ya es el orden del DOM actual, por lo que no se reordena markup: solo se retira la variante horizontal.

- **Alternativa A (elegida)**: retirar las clases horizontales y conservar el markup.
- **Alternativa B**: reordenar el DOM explícitamente. Exige mover nodos sin ganancia funcional, porque el DOM ya está en el orden pedido.

### D5 — El equipo reduce tamaño solo desde `sm`

El nombre pasa a `text-xl sm:text-lg` y el cargo a `text-xs sm:text-[0.625rem]`. Se mantiene la tipografía mobile-first: el valor base (`text-xl` / `text-xs`) sigue mandando en `< 640px` y la variante `sm:` aplica el tamaño reducido desde 640px.

- **Alternativa A (elegida)**: `text-xl sm:text-lg` y `text-xs sm:text-[0.625rem]`.
- **Alternativa B**: `text-lg` en todos los breakpoints. Cambiaría el diseño móvil base ya validado, que queda fuera de alcance.
- **Nota**: el rol se reduce a un valor arbitrario de 10px porque no existe una escala Tailwind entre `text-xs` (12px) y `text-[0.625rem]` (10px); el valor sigue siendo legible sobre el degradado y no introduce colores, radios ni sombras.

### D6 — Se modifican los requisitos en lugar de crear una capacidad nueva

El comportamiento nuevo contradice requisitos vigentes (`search-form`: texto visible y `px-8` desde `sm`, ancho fijo `sm:w-64` del select; `services-section`: tarjeta horizontal desde `sm`), por lo que el delta se expresa con operaciones `REMOVED` + `ADDED` para los requisitos cuyo nombre describe el comportamiento eliminado (los dos del botón del buscador y el de la tarjeta horizontal de servicios) y `MODIFIED` para "SearchForm layout is responsive", cuyo nombre sigue siendo válido. El validador de OpenSpec exige que un bloque `MODIFIED` conserve los nombres de todos los escenarios del requisito vigente, por lo que los escenarios renombrados se resuelven reescribiendo el requisito completo como `REMOVED` + `ADDED` (con `Reason` y `Migration`). En equipo, el texto superpuesto no está parametrizado en ningún requisito vigente, por lo que basta un `ADDED Requirements`.

- **Alternativa A (elegida)**: modificar las capacidades existentes (`search-form`, `services-section`, `team-section`).
- **Alternativa B**: crear una capacidad nueva `home-sm-breakpoint-tweaks` (como en `home-page-mobile-tweaks`). Se descartó porque dejaría sin modificar los requisitos que el cambio contradice, y estos se archivarían vigentes junto a la nueva capacidad.

### D7 — El placeholder por defecto del buscador pasa a "¿Qué estás buscando?"

El texto por defecto del `<input>` de búsqueda (`SEARCH_FORM_DEFAULTS.inputPlaceholder` en `apps/web/src/lib/config/search-form.ts`) cambia de "¿Qué productos estás buscando?" a "¿Qué estás buscando?". El texto es más corto y funciona igual en todas las páginas que renderizan el buscador global, con o sin el select de categorías.

- **Alternativa A (elegida)**: cambiar el default en `SEARCH_FORM_DEFAULTS`, de modo que el cambio aplica a Inicio, Productos, Servicios, Cotización y detalle de producto, y se mantiene el override por variable de entorno `SEARCH_PLACEHOLDER`.
- **Alternativa B**: pasar el placeholder por prop desde cada página. Se descartó porque el buscador global es un componente dumb con configuración centralizada; el placeholder no debería duplicarse por página.
- **Efecto colateral**: se actualizan el doc-comment del tipo `SearchFormConfig.inputPlaceholder` y el valor de ejemplo de `SEARCH_PLACEHOLDER` en `apps/web/.env.example` (que aún mostraba "¿Qué solución está buscando?"). La spec principal `search-form` se actualiza vía delta (`MODIFIED` de "SearchForm renders a labelled search input" y de "SearchForm categories are configured via a hardcoded constant") al archivar el change.

## Risks / Trade-offs

- **[Riesgo] Los requisitos modificados de `search-form` chocan con aserciones vigentes de unit/e2e** (`<span class="hidden sm:inline">`, `sm:px-8`, `sm:w-64`, `sm:shrink-0`) → actualizar los tests y snapshots en la misma tanda, antes de tocar el componente (TDD).
- **[Riesgo] Un `<select>` con ancho equitativo podría truncar "Todas las categorías"** → se verifica el ancho renderizado ≥ 256px en el viewport `640×800` y `640×375`, y se añade la aserción e2e correspondiente.
- **[Riesgo] El reparto equitativo reduce el input en desktop, acortando el placeholder** → el placeholder ya se recorta por el ancho del campo en la implementación actual; se acepta, ya que el botón recupera ~140px frente a la versión con texto.
- **[Riesgo] Tarjetas verticales con imagen a ancho completo aumenta la altura de la sección** en `sm` → el contenido de la tarjeta sigue `justify-between`, por lo que la altura la fija la imagen (5:4) y el texto fluye debajo sin recorte.
- **[Riesgo] El rol del equipo a 10px puede resultar pequeño en pantallas de alta densidad** → se mantiene el contraste sobre el degradado (token `text-primary` sobre `bg-secondary/95`) y el e2e de contraste del equipo no se modifica.
- **[Trade-off] El botón solo-ícono pierde la etiqueta visible en escritorio** → se compensa con `aria-label="BUSCAR"` y el ícono `lucide:search`, y el tooltip/title se deja fuera de alcance.

## Migration Plan

1. Implementar los tests fallidos (unit + e2e) que describen el comportamiento nuevo.
2. Aplicar los cambios de markup/clases en los tres componentes.
3. Actualizar los snapshots afectados (`SearchForm.test.ts.snap`, `ServicesSection.test.ts.snap`).
4. Ejecutar `make test` y `make test:smoke` (o `npm run test --workspace=apps/web` y `npm run test:smoke --workspace=apps/web`).
5. Rollback: revertir el commit del change; al ser un cambio de estilos/clases sin migraciones de datos ni de esquema, no hay estado que restaurar.

## Open Questions

- ¿El cliente quiere conservar el texto "BUSCAR" visible en `md`/`lg` (es decir, solo-ícono exclusivamente en `sm`) o la regla es solo-ícono en todos los breakpoints? Este change asume solo-ícono en todos los breakpoints, ya que el enunciado pide "ÚNICAMENTE el ícono" en `sm:` y superiores y el móvil ya mostraba solo el ícono.
- ¿Debe agregarse un `title="Buscar"` al botón para pista visual en escritorio? No está en los requisitos; queda fuera de alcance salvo indicación expresa.
