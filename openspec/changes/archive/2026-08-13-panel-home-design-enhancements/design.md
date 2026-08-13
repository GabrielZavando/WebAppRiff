## Context

El sitio público Astro (apps/web/) integra `PanelHome.astro` en el home vía `index.astro`, inmediatamente después del `HeroBanner`, como una franja de "about / trust signals" (mitad teal con copy+CTA a la izquierda, mitad blanca con grid 2×2 de estadísticas a la derecha). Hoy es un componente **puramente estático y plano**: los valores (`40+`, `30.000+`, `5+`, `9+`) se renderizan como texto directo desde `PANEL_HOME_CONTENT`, sin JavaScript de lado cliente ni sombras.

El change archivado `ui-refactor` estableció una regla flat-design estricta (radio 0, sin `rounded*`, sombras reservadas solo para capas flotantes) y declaró explícitamente que los componentes base —incluido `PanelHome`— NO aplican `shadow*` en estado estático. La variable `--scroll-shell-shadow: 0 10px 30px rgba(22, 32, 46, 0.3)` existe hoy solo de forma local dentro de `.header-scroll-shell` en `header-scroll.css`, aplicándose condicionalmente cuando `body[data-scrolled='true']`.

El cliente solicitó tres mejoras para este componente, confirmadas vía preguntas previas:
1. **Sombra siempre visible** (override intencional de la regla flat-design).
2. **Contadores animados** 0→target disparados por scroll + visibilidad (IntersectionObserver), **una sola vez**.
3. **Divisor en cruz "+"** de 1px en color primario que cruza la caja completa de stats en ambos ejes.

Decisiones adicionales confirmadas con el cliente:
- Para la animación se agrega `numericValue: number` a `PanelStat` (no se parsea el string `value` en runtime).
- El color del divisor usa el token `--color-primary` (`border-primary`), no literales hex.
- El sufijo `+` permanece **siempre visible** durante la animación (ej. `0+`, `1+`, … `40+`).

## Goals / Non-Goals

**Goals:**
- Aplicar `box-shadow: 0 10px 30px rgba(22, 32, 46, 0.3)` estática al `<section>` del PanelHome, promoviendo el valor a un token global reutilizable.
- Agregar `numericValue: number` a `PanelStat` y poblarlo en `PANEL_HOME_CONTENT` (40, 30000, 5, 9).
- Crear `lib/anim/createCounterAnimation.ts`: utilidad pura, SSR-safe, con superficies inyectables para tests (host/target/observer/rAF), que anima contadores 0→target con `requestAnimationFrame`, disparada por `IntersectionObserver`, una sola vez, respetando `prefers-reduced-motion`.
- Renderizar en `PanelHome.astro` los valores con `data-stat-value` + `data-target`, con `<script client:load>` que inicializa la animación; el `value` estático queda como fallback SSR/no-JS.
- Dibujar el divisor en cruz "+" (pseudo-elementos `::before`/`::after`, `1px`, `border-primary`) sobre el grid de stats, con `aria-hidden="true"`.
- Actualizar `docs/design/style-guide/README.md` documentando la excepción de sombra para PanelHome.
- Tests completos: Vitest unit del counter + AstroContainer + snapshot + E2E Playwright (sombra, animación, divider) + E2E con reduced-motion.

**Non-Goals:**
- NO se modifica `HeroBanner.astro`, `Layout.astro`, `Header.astro`, `SearchForm.astro` ni `TopHeader.astro` (la sombra vive 100% en PanelHome; el header sigue usando su propia variable).
- NO se cambia el layout responsivo (stack en mobile, 2 columnas en desktop), ni el overlap con el hero, ni la contraste WCAG, ni la estructura de headings (`<h2>` único, stats como `<div>`/`<p>`).
- NO se repite la animación (no re-dispara al volver a entrar en viewport).
- NO se agregan nuevas estadísticas ni un segundo CTA.
- NO se carga contenido desde CMS/Firestore (copy y stats siguen hardcoded en `lib/config/panel-home.ts`).
- NO se introducen dependencias externas (IntersectionObserver y requestAnimationFrame son APIs nativas).

## Decisions

1. **Variable de sombra global en `@theme`**: Promover `--scroll-shell-shadow` de su scope local en `.header-scroll-shell` a un token canónico `--shadow-scroll-shell` dentro del bloque `@theme {}` de `globals.css`. Alternativa considerada: definir un nuevo `--shadow-6` en la escala existente — descartada porque la sombra del header ya usa un valor específico (`rgba(22,32,46,0.3)`) distinto a la escala `--shadow-1..5`, y reutilizar el mismo valor evita duplicación. `.header-scroll-shell` pasará a consumir `var(--shadow-scroll-shell)`.

2. **Sombra aplicada al `<section>` del PanelHome (no al `.container` interno)**: la `box-shadow` se pone en el `<section class="... z-10">` (full-width), de modo que la elevación rodea todo el panel y se separa visualmente del hero superpuesto. Alternativa considerada: aplicarla solo al `.container` interno (teal+white) — descartada porque la sombra quedaría recortada dentro del ancho máximo y no daría sensación de "panel flotante" sobre el banner.

3. **Override documentado de la regla flat-design**: la style guide dice "componentes base NO aplican shadow* en estado estático". Se documenta explícitamente en `docs/design/style-guide/README.md` que `PanelHome` es la excepción (elevación sobre el hero superpuesto). Alternativa considerada: mantener PanelHome sin sombra y solo animar números — descartada porque el cliente lo pidió explícitamente.

4. **`numericValue: number` en `PanelStat`**: se agrega el campo al interface y a `PANEL_HOME_CONTENT`. Alternativa considerada: parsear `value` (`"30.000+"` → 30000) en runtime con regex — descartada por frágil (manejo de separador de miles `.` en locale es-ES y sufijo `+`); el campo explícito es determinista y tipado.

5. **Utilidad pura `createCounterAnimation.ts` con inyección de dependencias**: sigue el patrón de `lib/scroll/createHeaderScrollState.ts` — `initCounterAnimation(options)` acepta `{ observer, raf, formatNumber, elements, prefersReducedMotion }` inyectables para tests en entorno Node (sin jsdom). Responsabilidades:
   - `formatStatNumber(n: number): string` → formatea con separador de miles `.` (es-ES) y sufijo `+` (ej. `30000 → "30.000+"`).
   - `animateCounter(el, from, to, durationMs, format)` → `requestAnimationFrame` con easing `ease-out`, escribe `el.textContent` en cada frame.
   - `createVisibilityObserver(callback)` → `IntersectionObserver` que dispara `callback` una sola vez al intersectar.
   - `prefersReducedMotion()` → lee `matchMedia('(prefers-reduced-motion: reduce)')`; si es true, NO anima (deja el `value` estático).
   Alternativa considerada: librería externa (`countup.js`) — descartada por añadir dependencia y no aportar control de IntersectionObserver/reduced-motion a medida.

6. **Hook de animación vía atributos `data-*` + `<script client:load>`**: `PanelHome.astro` renderiza cada valor como `<p data-stat-value data-target="40">40+</p>` (el `40+` es el fallback SSR). El script cliente busca `[data-stat-value]` dentro del `<section>`, crea un `IntersectionObserver` y al intersectar anima cada uno desde 0 hasta `data-target`. Alternativa considerada: framework de hidratación (Astro islands con framework) — descartada porque el proyecto es Astro puro SSG sin framework de组件 en el home; un `<script>` vanilla es suficiente y cero-dependencia.

7. **Divisor en cruz "+" con pseudo-elementos**: el grid de stats (`grid grid-cols-2 gap-x-8 gap-y-12`) se envuelve en `<div class="relative">`; dos pseudo-elementos posicionados absolutamente dibujan la cruz:
   - `::before` → línea vertical 1px (`border-l border-primary`) centrada horizontalmente, desde el top hasta el bottom del wrapper.
   - `::after` → línea horizontal 1px (`border-t border-primary`) centrada verticalmente, desde el left hasta el right del wrapper.
   Ambos `aria-hidden="true"` (decorativos). Alternativa considerada: `border-*` utilities en las celdas individuales — descartada porque el `gap` del grid impide alinear limpiamente la línea en el centro exacto de la caja; los pseudo-elementos sobre el wrapper dan control pixel-perfect del cruce.

## Risks / Trade-offs

- **Risk**: La sombra estática del PanelHome puede solaparse visualmente con la sombra del header compacto al hacer scroll. → **Mitigation**: son capas distintas (header sticky vs panel en flujo); la sombra del panel es sutil y se mantiene bajo el header por el `z-30` del sticky shell vs `z-10` del panel.

- **Risk**: La animación con `requestAnimationFrame` puede verse entrecortada en dispositivos bajos de gama. → **Mitigation**: usar easing `ease-out` y duración ~1000ms; `prefers-reduced-motion` la desactiva por completo.

- **Risk**: `IntersectionObserver` no está disponible en el entorno de test de AstroContainer (SSR). → **Mitigation**: la animación vive en `<script client:load>` (solo navegador); los tests unitarios del counter usan fakes inyectados; el fallback SSR renderiza el `value` final estático.

- **Risk**: El divisor en cruz puede verse raro en mobile (grid 2×2 estrecho a < 640px). → **Mitigation**: validar con E2E a 320px; el `gap-x-8 gap-y-12` da espacio suficiente para la línea de 1px en el centro; ajustar grosor/posición si es necesario.

- **Risk**: Cambiar el tipo `PanelStat` rompe los tests existentes de tipo/config que asumen solo `value`+`label`. → **Mitigation**: actualizar `lib/types/__tests__/panel-home.test.ts` y `lib/config/__tests__/panel-home.test.ts` para incluir `numericValue`.

- **Trade-off**: `numericValue` duplica información semántica con `value` (DRY parcial) → aceptado por determinismo y tipado fuerte; el `value` sigue siendo la fuente de display para SSR/no-JS.

- **Trade-off**: Sombra en componente base vs regla flat-design → se acepta el override documentado por requerimiento explícito del cliente (elevación sobre hero superpuesto).

## Migration Plan

- No requiere migración de datos ni cambios de API (`docs/api-spec.yml` y `docs/data-model.md` invariantes).
- Deploy: build SSG estándar (`npm run build`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:smoke`). La pipeline existente valida todo.
- Rollback: revertir el commit del change — `PanelHome.astro` vuelve a su forma estática; los archivos nuevos (`lib/anim/createCounterAnimation.ts` + tests) se eliminan; `globals.css`/`header-scroll.css` revierten la promoción de variable; `lib/types/panel-home.ts` y `lib/config/panel-home.ts` revierten el campo `numericValue`.

## Open Questions

_Ninguna pendiente — las cinco ambigüedades fueron resueltas con el cliente antes de planificar._

## Post-Apply Implementation Decisions (deviation log)

During the `/apply` phase the user made two structural corrections to the implementation that deviate from the original design notes above. Both were reflected in the code and the OpenSpec `spec.md` was updated to match. They are documented here for traceability:

1. **Shadow location (Decision 2):** The original design called for the shadow on the outermost `<section>`, but the user clarified during apply that a full-width `<section>` would cast a shadow across the entire viewport (visually wrong) and that the shadow must hug the visible teal+white card. The shadow was ultimately placed on the **main grid element** (`<div class="grid grid-cols-1 lg:grid-cols-2 panel-home-elevated" data-panel-card>`), which exactly bounds the visible panel. The container wrapper (`.container mx-auto ...`) does NOT carry the shadow.

2. **Divider technique (Decision 7):** The original design described pseudo-elements `::before`/`::after` drawn over the grid wrapper. The user instead requested a native CSS Grid technique: the wrapper carries `background-color: var(--color-primary)` (via a scoped class, NOT the `bg-primary` utility to avoid polluting pre-existing E2E locators) and the grid uses `grid-cols-2 grid-rows-2 gap-px h-full w-full` with `bg-white` cells. The 1px gap exposes the primary colour as the divider lines. To ensure the lines reach the actual top, bottom, left and right edges of the white half, padding was moved from the wrapper to the cells, and `flex flex-col` + `flex-1` chain guarantees the wrapper stretches to the full height of the white half. The result is visually identical (a `+` sign in 1px primary colour spanning edge-to-edge) but the implementation uses native CSS Grid gaps instead of pseudo-elements. No `aria-hidden` is required because grid gaps are not exposed to the accessibility tree.
