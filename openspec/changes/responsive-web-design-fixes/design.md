## Context

El sitio público de Riff (`apps/web`, Astro 7 + Tailwind CSS v4) fue auditado en su fase de exploración y se detectaron desbordes horizontales y recortes de contenido en cinco familias de viewports. El Tailwind v4 del proyecto no declara breakpoints propios, por lo que los valores vigentes son `sm=640`, `md=768`, `lg=1024`, `xl=1280`, `2xl=1536`.

Situación actual medida sobre el código:

| Síntoma | Causa medida |
| --- | --- |
| Menú de escritorio desborda en 1024–1204px | `Header.astro:69` usa `hidden lg:flex`; el nav (6 ítems `text-xs px-3` + CTA `px-6`) más el logo (`sm:max-w-[240px]`) exigen ≈1041px de ancho mínimo |
| `<h1>` del home desborda a 320px | `HeroBanner.astro:44` usa `text-5xl` (48px) fijo hasta 768px, sin `break-words` |
| `30.000+` se sale de su tarjeta | `PanelHome.astro:95,97`: celda `p-8 md:p-12` (64–96px) dentro de columnas de 144px a 320px, con valor en `text-3xl` (30px) |
| "Representación Exclusiva" desborda | `RepresentacionesHero.astro:51`: `<h1>` `text-4xl md:text-5xl lg:text-6xl` con `leading-none`, sin quiebre de palabra |
| Título de producto desborda | `productos/[slug].astro:65`: `text-5xl` fijo (48px) sin escala responsive |
| Vista lista del catálogo desborda (407px) | `productos/index.astro:87-105` fija la imagen en `width:12rem` (192px) y `ProductCard.astro:62` usa `flex gap-2` con botones `flex-1` sin tope ni wrap |
| Sticky shell ocupa 96% del alto a 568×320 | `Layout.astro:126` agrupa header (`h-20` + `pb-10` = 120px) y buscador (`py-4` + 3×`h-11` + 2×`gap-3` = 188px) = ≈308px de 320px |

Restricciones y stakeholders:

- El proyecto sigue TDD estricto: cada corrección debe nace de un test fallido (unitario de componente o E2E de Playwright) antes del código de producción.
- Los valores tipográficos y de padding actuales están fijados por requisitos OpenSpec (`hero-banner`, `site-header`, `panel-home`, `products-catalog-page`, `representaciones-page`, `search-form`) y por asserts existentes en `apps/web/e2e/` y `apps/web/src/components/__tests__/`; por eso este change modifica esas specs **antes** de tocar el código.
- No hay cambios de API, de datos ni de dependencias: el alcance es puramente de presentation en el frontend Astro.
- El panel admin (Angular) no participa de ninguno de los síntomas.

## Goals / Non-Goals

**Goals:**

- Eliminar el scroll horizontal en la matriz de viewports `320×568`, `375×667`, `568×320`, `768×1024`, `1024×768`, `1204×800`, `1280×800` en `/`, `/productos`, `/productos?view=list`, `/productos/{slug}` y `/representaciones`.
- Hacer que el menú de escritorio sea visible desde `xl` (1280px) y que, en el rango `lg`→`xl`, el conjunto logo + nav + CTA quepa en el ancho disponible.
- Convertir los títulos y cifras_fixed (hero home, stats de panel, hero de representaciones, título de producto) en escalas responsivas con quiebre de palabra.
- Respetar un presupuesto de alto del grupo sticky (≤50% del viewport) en viewports de altura ≤400px.
- Cubrir todo lo anterior con una suite E2E Playwright parametrizada por viewports.

**Non-Goals:**

- Rediseñar la estética del sitio: se conservan colores, tokens, jerarquías, tipografías base (Montserrat/Open Sans) y la regla de flat design (radio 0).
- Cambiar el orden de los ítems de navegación, los textos de marketing o el contenido de las páginas.
- Rediseñar la barra de búsqueda en desktop (el layout inline ≥768px se mantiene) o modificar su lógica de filtrado.
- Tocar el panel admin Angular, el backend, los contratos de API o los seeds.
- Introducir una librería de breakpoints o de utilities; se usan únicamente variantes de Tailwind v4 (`sm:`, `md:`, `lg:`, `xl:` y la variante arbitraria de media query `[@media(max-height:400px)]:`).

## Decisions

### D1 — El menú de escritorio pasa de `lg` a `xl` y se compacta en el rango `lg`→`xl`

**Qué:** `Header.astro` aplica `hidden xl:flex` al `<nav>` de escritorio y `xl:hidden` al botón hamburguesa y al overlay. En el rango 1024–1279px se muestra la navegación mobile. Además, el nav compacta su densidad en `lg:` (gap y padding horizontal menores, CTA con menos padding) y el logo reduce su `max-width` en ese rango.

**Por qué:** el ancho mínimo medido del conjunto logo + nav + CTA es ≈1041px; con `lg` el desborde es estructural, no marginal. Subir el breakpoint a `xl` elimina la causa raíz de forma determinista; compactar en `lg`→`xl` conserva la navegación visible en 1024–1279px en lugar de esconderla tras la hamburguesa.

**Alternativas descartadas:**
- *Solo compactar el menú*: el margen disponible es de ~17px a 1024px, insuficiente ante cualquier cambio de copy futuro; frágil.
- *Solo subir el breakpoint*: resolvía el desborde pero cerraba la navegación horizontal en todo el rango 1024–1279px (tablets horizontales y laptops 1204px), degradando la experiencia.
- *Reducir el logo globalmente*: afecta la percepción de marca que el cliente ya aprobó en `ui-chrome-polish`; se aplica solo en el rango problemático.

**Consecuencia a documentar:** entre 1024px y 1279px el menú pasa a hamburguesa. Se acepta y se registra en `site-header` (MODIFIED) y `responsive-layout` (ADDED).

### D2 — La compactación se resuelve con una variante de media query por altura del viewport

**Qué:** el header y el buscador declaran la variante arbitraria `[@media(max-height:400px)]:`, que reduce el padding vertical (`pb-10` → menor, `py-4` → menor), la altura de la barra interna del header y compacta el buscador (los tres controles en una sola fila con ancho acotado en el selector de categoría).

**Por qué:** el síntoma es altitudinal, no horizontal: a 568×320 el buscador apila sus tres controles porque `md:flex-row` no aplica (568 < 768). La variante por altura expresa directamente el criterio del requerimiento ("altura <= 400px") sin introducir reglas fuera del sistema de utilidades, ni JS que detecte orientación, ni breakpoints propios.

**Corrección durante la implementación:** la primera versión de este diseño usaba la variante `landscape:` de Tailwind. Se descartó durante la implementación porque `landscape:` también activa en los viewports de escritorio con orientación landscape y altura mayor (por ejemplo `1440×900`), lo que habría alterado la composición de escritorio ya aprobada por el cliente. El criterio por altura (`max-height: 400px`) corrige ese defecto y es el que queda reflejado en los deltas de `site-header`, `search-form` y `site-header-scroll`.

**Alternativas descartadas:**
- *Variante `landscape:`*: afecta a todo viewport landscape, incluido el escritorio aprobado (`1440×900`).
- *Media query CSS manual por altura en una hoja global*: funciona, pero introduce reglas fuera del sistema de utilidades y duplica el criterio en varios archivos.
- *Detección por JS con `matchMedia` y clases toggled*: agrega estado runtime y complejidad de View Transitions (`view-transitions` exige re-aplicar estado en `astro:page-load`); innecesario para un problema puramente CSS.

**Presupuesto de alto:** header compacto (~60px) + buscador compacto (~56px) ≈ 116px ≤ 160px (50% de 320px), cumpliendo el requisito.

### D3 — Los títulos y cifras pasan a escala responsiva con `break-words`

**Qué:** el `<h1>` del hero home pasa de `text-5xl md:text-7xl` a una escala con base móvil reducida (`text-3xl` en `sm`–`md`, escalando hasta `md:text-7xl`); el `<h1>` de representaciones escala por breakpoint y añade quiebre; el `<h1>` del detalle de producto pasa de `text-5xl` fijo a `text-3xl md:text-5xl`; los valores de las estadísticas de `PanelHome` reducen su base en móvil.

**Por qué:** `break-words` (`overflow-wrap: break-word`) es la solución canónica de Tailwind para palabras indivisibles más largas que su contenedor; combinado con una escala tipográfica responsiva evita que el texto se salga de su caja. La especificación exige, además, que el tamaño computado escale de forma monótona con el viewport (escenario de `hero-banner`).

**Alternativas descartadas:**
- *Solo `break-words`*: evita el desborde de palabras largas, pero no el de frases largas a 48px; el texto seguiría ocupando más de una línea y reduciendo la legibilidad.
- *Unidades fluidas (`clamp()`)*: daría un control más fino, pero el proyecto no usa `clamp()` en su escala tipográfica y Tailwind v4 no expone un token para él; introduciría una convención nueva.
- *Reducir el texto de marketing*: no es una decisión de diseño de este change; el contenido está aprobado por el cliente.

### D4 — La vista lista se corrige sobre `ProductCard` y se actualiza la spec (no se migra a `ProductListItem`)

**Qué:** la spec `products-catalog-page` deja de exigir `ProductListItem` y documenta que la vista lista es una variante de `ProductCard` activada por la clase `catalog-list-mode` (lo que el runtime ya hace en `catalogClient.ts:168`). El CSS de `productos/index.astro` deja de fijar la imagen en `12rem` y pasa a un ancho relativo/adaptativo con apilado en anchos estrechos; la fila de CTAs de `ProductCard` recibe `flex-wrap` y un ancho máximo por botón.

**Por qué:** `ProductListItem.astro` existe pero no se usa en ninguna página (solo aparece en su test unitario). La spec actual está desalineada con la implementación: corregir el código para cumplir la spec exigiría rehacer la vista lista con un componente muerto y cambiar el modelo de datos de la tarjeta. Alinear la spec con la implementación real (decisión tomada por el usuario en la fase de exploración) elimina la contradicción y reduce el alcance.

**Alternativas descartadas:**
- *Migrar a `ProductListItem`*: cumple la spec letra por letra, pero revive un componente no usado, duplica la lógica de tarjeta y obliga a revisar `web-product-card-adaptation` y los tests unitarios de ambos componentes.
- *Mantener la spec como está y solo corregir el CSS*: dejaría el requisito incumplido y el archive inconsistente.

**Consecuencia:** el requisito de "vista lista usa `ProductListItem`" se reescribe en la delta de `products-catalog-page` (MODIFIED) para reflejar el comportamiento real.

### D5 — La suite E2E de viewports vive en un spec nuevo y parametrizado

**Qué:** se crea `apps/web/e2e/responsive-layout.spec.ts` con una tabla de viewports (`320×568`, `375×667`, `568×320`, `768×1024`, `1024×768`, `1204×800`, `1280×800`) y páginas representativas; la invariante se evalúa como `document.documentElement.scrollWidth <= clientWidth + 1`.

**Por qué:** una única fuente de verdad para la invariante "sin scroll horizontal" evita duplicar la aserción en 5 specs existentes. La tolerancia de 1px absorbe redondeos sub-píxel del navegador y no oculta desbordes reales (que son de decenas de píxeles). El patrón de iteración de viewports ya existe en `panel-home.spec.ts:239-252`, y el patrón de aserción por `boundingBox` con tolerancia en `panel-home.spec.ts:189-206` y `solution-section.spec.ts:96`.

**Alternativas descartadas:**
- *Playwright Projects por viewport*: obliga a duplicar la suite completa por cada viewport (×7) y a reconfigurar el `webServer`; coste desproporcionado.
- *Reglas CSS (`@media` + `overflow-x: hidden` global)*: escondería el síntoma sin corregir la causa; además `Layout.astro` ya aplica `overflow-x-hidden` solo en páginas hero, lo que confirma que el overflow es real y no un artefacto de layout.

### D6 — Se corrigen también los tests existentes que fijan los valores antiguos

**Qué:** los asserts que hoy fijan `text-5xl` en móvil (`hero-banner.spec.ts:124-144`), `hidden lg:flex` (`Header.test.ts:209`), `lg:hidden` (`Header.test.ts:214`) y los tamaños del `<h1>` se actualizan a los nuevos valores.

**Por qué:** son tests que codifican el comportamiento defectuoso. Actualizarlos es parte del cambio y no una regresión: la delta de specs correspondiente es la autoridad (OpenSpec), y los tests se alinean a ella.

## Risks / Trade-offs

- **Pérdida de navegación horizontal entre 1024px y 1279px** → mitigado con compactación en `lg`→`xl` (D1) y verificado por E2E en `1024×768` y `1204×800`; el menú hamburguesa es el mecanismo ya usado y probado en mobile.
- **Regresión en la navegación desktop ya aprobada por el cliente** → el breakpoint `xl` cambia dónde aparece el menú; se mitiga con un test unitario del `Header` que fija el nuevo contrato (`hidden xl:flex` / `xl:hidden`).
- **Reducción del tamaño del `<h1>` del home en móvil puede ser vista como un cambio de diseño** → la escala propuesta conserva `md:text-7xl` en desktop (sin cambios visuales a partir de 768px) y solo actúa por debajo de ese ancho, que es donde el texto se salía de la pantalla.
- **El CSS de `catalog-list-mode` es global (`<style is:global>`) y puede afectar a otras páginas** → se limita el selector a `#catalog-grid.catalog-list-mode` y se cubre con E2E de la vista lista en tres anchos.
- **La compactación depende de que el viewport se reporte con una altura <= 400px** → el criterio se aplica por altura (no por orientación), de modo que `568×320` la activa y `1440×900` no; el test E2E verifica el comportamiento efectivo y no sólo la clase.
- **El presupuesto de ≤50% de alto puede ser difícil de cumplir si el cliente rechaza el copy del buscador** → el copy del buscador no cambia en este change; si en el futuro se alarga, el presupuesto debe revisarse en un change aparte.
- **Flakiness de las aserciones de `boundingBox` por animaciones** → las aserciones de containment se ejecutan con el estado estable de scroll (`scrollY=0`, sin `data-scrolled`) y las animaciones de count-up de `PanelHome` no alteran el ancho de la celda.
- **La especificación de `products-catalog-page` y la de `web-product-card-adaptation` pueden quedar solapadas** → `web-product-card-adaptation` trata del modelo de datos de la tarjeta (`ProductoCardApi`, `toProductCardModel`) y no del layout; no se modifica y no se solapa con este change.

## Migration Plan

1. Aplicar los deltas de specs (ya materializados en este change) antes de tocar el código.
2. Implementar por bloques independientes, cada uno con su test fallido previo: (a) `Header` + `SearchForm`/viewports de baja altura, (b) hero home + `PanelHome`, (c) representaciones + detalle de producto, (d) vista lista del catálogo, (e) suite E2E de viewports.
3. Ejecutar `make lint`, `make test` y `npm run test:smoke --workspace=apps/web` (Playwright) para validar.
4. Validar `npx openspec validate --all --strict` antes del archive.
5. Rollback: al ser un change puramente de presentation en `apps/web` sin cambios de contrato ni de datos, el rollback es el revert del commit; no requiere migración de datos ni coordinación de despliegue.

## Open Questions

- El tamaño exacto de la escala tipográfica del `<h1>` del home en el rango `sm`–`md` (`text-3xl` vs `text-4xl`) queda como decisión de implementación, condicionada a que el texto configurado quepa con holgura en 320px y a que el E2E de monotonía del `font-size` se cumpla.
- El ancho máximo concreto por botón en la vista lista del catálogo (por ejemplo 200px) se fija en la implementación, siempre que el CTA "Cotizar" siga siendo visible y accionable con una sola línea en móvil.
