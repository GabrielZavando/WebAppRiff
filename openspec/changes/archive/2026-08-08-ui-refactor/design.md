## Context

El sitio público Astro (`apps/web`) tiene 5 componentes base — `TopHeader`, `Header`, `HeroBanner`, `PanelHome`, `SearchForm` — pulidos visualmente pero con tres brechas respecto al lenguaje visual canónico (`docs/design/style-guide/index.html`):

- **Iconos**: hoy usa 3 sets de Iconify (`material-symbols:*` para UI + `logos:*` para redes sociales). El cliente rechaza el set actual. Se sustituye por **Lucide** (outline stroke 2px) como set único, uniformando también los logos de marcas sociales.
- **Tipografía**: los tokens `--font-heading` (Montserrat 600/700/800) y `--font-body` (Open Sans 400/600/700/400-italic) están declarados en `@theme` pero **no se aplican**. Los `<h1>`/`<h2>`, botones y nav renderizan con Open Sans (heredado del `<body>`); los pesos no siguen la escala de la guía (botones `font-bold` 700 vs guía 600; nav `font-medium` 500 vs guía 600).
- **Flat design + tokens**: la guía manda radio `2px`; los componentes usan `rounded` (4px). El cliente decide ahora **radio 0** (flat total con ángulos rectos). Hay residuos de la paleta por defecto de Tailwind que violan el sistema de tokens (`border-gray-200`, `text-gray-700`, `text-gray-600`) y un `shadow-sm` en el CTA del Header que contradice el principio flat (sombras solo para capas flotantes).

Stack: Astro 7 SSG + Tailwind v4 (`@theme` en CSS) + `astro-icon` (SSR, sin runtime JS de iconos). Tokens sincronizados manualmente entre `apps/web/src/styles/globals.css` y `apps/admin/src/styles/globals.css` (validado por `apps/admin/src/styles/__tests__/sync.test.ts`). Admin aún no tiene componentes — solo recibe el `@theme` idéntico.

Decisiones validadas con el cliente: **Lucide** como set único; **uniformar los logos sociales** al set (no se mantienen logos de marca); **mantener Montserrat/Open Sans** y corregir familia, peso y tamaño según la escala de la guía; **flat design + radio 0**; líneas decorativas se dejarán para un cambio futuro.

## Goals / Non-Goals

**Goals:**

- Sustituir todos los iconos de los 5 componentes por el set **Lucide** (`@iconify-json/lucide`), eliminando `@iconify-json/material-symbols` y `@iconify-json/logos` de `apps/web/package.json`.
- Aplicar `font-heading` (Montserrat) a títulos (`<h1>`, `<h2>`), eyebrow, nav, botones y stat-values; `font-body` (Open Sans) al resto, siguiendo la escala completa de la guía (familia, peso y tamaño).
- Cambiar `--radius` a `0` en ambos `globals.css` (web + admin) y eliminar TODAS las clases `rounded` de los componentes base (flat total, ángulos rectos).
- Reemplazar residuos `gray-*` por tokens (`border-gray-200` → `border-border`; `text-gray-700`/`text-gray-600` → `text-text-2`).
- Eliminar el `shadow-sm` del CTA del Header (sombras solo en capas flotantes).
- Sincronizar el `@theme` de admin con el de web (radio 0) para mantener el sync test en verde.
- Documentar el nuevo catálogo Lucide y el radio 0 en `docs/design/style-guide/README.md` y `docs/frontend-standards.md`.

**Non-Goals:**

- **No** se añaden líneas decorativas nuevas (líneas tipo guía bajo títulos, subrayados decorativos). El cliente las definirá en un cambio aparte.
- **No** se rediseña layout, composición ni UX de los 5 componentes — solo estilos visuales (iconos, tipografía, bordes/radio).
- **No** se toca `docs/design/style-guide/index.html` (guía visual heredada del cliente; se mantiene intacta).
- **No** se crean componentes en `apps/admin` (solo se sincroniza su `globals.css`).
- **No** se toca el backend, `docs/api-spec.yml`, ni `docs/data-model.md`.
- **No** se cambian los breakpoints ni el `max-w-7xl` del container (mantener Tailwind defaults).
- **No** se cambian las alturas/spacing estructural de los componentes (h-9, h-24, h-11, py-16/24/32, p-8/12/16) — el flat cleanup no toca el layout.

## Decisions

### Decision 1 — Set de iconos: Lucide único (UI + logos sociales)

- **Decisión**: Instalar `@iconify-json/lucide` como único set. Mapear 1:1:
  - `material-symbols:menu-outline` → `lucide:menu`
  - `material-symbols:close-outline` → `lucide:x`
  - `material-symbols:contact-phone-outline` → `lucide:phone`
  - `logos:facebook` → `lucide:facebook`
  - `logos:twitter` → `lucide:twitter`
  - `logos:instagram` → `lucide:instagram`
  - `logos:linkedin` → `lucide:linkedin`
- **Rationale**: Lucide es outline stroke 2px, minimalista y moderno; encaja con el lenguaje flat de la marca. El cliente lo prefiere sobre Material Symbols. Uniformar los logos sociales al mismo set es decisión explícita del cliente (priorizar coherencia visual sobre reconocimiento literal de marca).
- **Alternativa descartada**: mantener `logos:*` para redes sociales — el cliente decide uniformar.
- **Remover** `@iconify-json/material-symbols` y `@iconify-json/logos` del `package.json` (quedan sin uso; limpiar para no inflar `node_modules`). El test `apps/web/src/config/__tests__/package.test.ts` se actualiza para requerir `@iconify-json/lucide` en lugar de `@iconify-json/material-symbols`.

### Decision 2 — Tipografía: aplicar escala completa de la guía (familia + peso + tamaño)

- **Decisión**: aplicar `font-heading` (Montserrat) y pesos/tamaños de la guía a todos los elementos tipográficos de los 5 componentes, manteniendo los breakpoints responsive actuales.
- **Escala aplicada** (traducción de la guía a Tailwind v4):
  - `HeroBanner`: h1 `font-heading font-bold` (mantiene `text-4xl md:text-6xl` responsive); h2 subtitle `font-heading font-semibold`; descripción `font-body` (implícito); CTAs `font-heading font-semibold text-xs tracking-wide uppercase` (antes `font-bold text-sm`).
  - `PanelHome`: eyebrow `font-heading font-semibold text-xs tracking-wider uppercase`; h2 headline `font-heading font-bold`; descripción `font-body`; CTA `font-heading font-semibold text-xs tracking-wide uppercase`; stat-values `font-heading font-bold`; stat-labels `font-body text-xs uppercase tracking-wide` (texto de color `text-text-2`).
  - `Header`: nav items `font-heading font-semibold text-xs tracking-wide uppercase` (antes `font-medium text-sm`); CTA `font-heading font-semibold text-xs tracking-wide uppercase` (antes `font-bold text-sm`); mobile nav links `font-heading font-semibold`.
  - `SearchForm`: select/input `font-body text-sm` (mantengo `text-sm`; el `text-[13.5px]` literal de la guía es marginal y Tailwind lo maneja peor); submit `font-heading font-semibold text-xs tracking-wide uppercase`.
  - `TopHeader`: mantiene `text-sm` + `font-body` implícito (texto de contacto y social).
- **Rationale**: el cliente pidió "corregir familia, peso y tamaño". La escala completa de la guía (12px botones, 11.5px nav) se traduce a `text-xs` (12px) para botones y nav; los headings conservan sus tamaños responsive porque la guía define tamaños desktop (44px h1) que ya están cubiertos por `text-4xl md:text-6xl`.
- **Alternativa considerada**: solo corregir familia/peso manteniendo `text-sm` en botones/nav — descartada por el cliente (pide aplicar la escala completa).

### Decision 3 — Flat design estricto + radio 0

- **Decisión**: `--radius: 2px` → `--radius: 0` en ambos `globals.css`. Eliminar TODAS las clases `rounded` (y variantes) de los 5 componentes: CTA del Header, mobile nav links, CTAs del HeroBanner, CTA del PanelHome, select/input/button del SearchForm.
- **Rationale**: el cliente decide flat total (ángulos rectos). El radio 0 es coherente con el lenguaje industrial/flat de la guía. Cambiar solo el token `--radius` no basta porque los componentes usan la utility `rounded` de Tailwind (0.25rem = 4px), no la custom var — por eso se eliminan las clases explícitamente.
- **Sombra del Header CTA**: se elimina `shadow-sm` del CTA por el principio flat (sombras solo para dropdowns, menús, modales y overlays según `docs/design/style-guide/README.md`).

### Decision 4 — Limpieza de tokens residuales `gray-*`

- **Decisión**:
  - `SearchForm.astro` wrapper: `border-b border-gray-200` → `border-b border-border`.
  - `SearchForm.astro` select e input: `text-gray-700` → `text-text-2`.
  - `PanelHome.astro` stat labels: `text-gray-600` → `text-text-2`.
- **Rationale**: los `gray-*` son de la paleta por defecto de Tailwind y violan el principio "sin literales" del proyecto (frontend-standards). `text-text-2` (#5C6675) tiene contraste ~5.9:1 sobre blanco, cumple AA Normal/AA Large — prefiere sobre `text-muted` (#98A1AC, ~2.8:1, fallaría AA).
- **Test**: `SearchForm.test.ts` (asserts `border-gray-200`) y `PanelHome.test.ts` (regex `text-gray-` en stat labels) se actualizan para verificar los tokens.

### Decision 5 — Sync admin mantiene el test en verde

- **Decisión**: cambiar `--radius: 0` en `apps/admin/src/styles/globals.css` igual que en web. Admin no consume el radio (no tiene componentes), pero el `sync.test.ts` compara ambos `@theme` token a token.
- **Alternativa descartada**: excluir admin del cambio — rompería el sync test y dejaría divergencia.

### Decision 6 — Política de regeneración de snapshots

- **Decisión**: tras migrar cada componente, se **regenera** su snapshot `.snap`. Es la práctica TDD estándar cuando el contrato visual cambia por un refactor de estilos (mismos tests, nueva salida HTML).
- **Tests de aserción actualizados** (no solo snapshot):
  - `tokens.test.ts`: `--radius: 2px` → `--radius: 0`.
  - `package.test.ts`: `@iconify-json/material-symbols` → `@iconify-json/lucide`.
  - `Header.test.ts`: CTA `font-bold` → `font-semibold` (assert literal de la clase).
  - `SearchForm.test.ts`: asserts `border-gray-200` → `border-border`.
  - `PanelHome.test.ts`: regex `text-gray-` → `text-text-2`.
- **Rationale**: las specs archivadas previas (design-system-revision, hero-fullbleed-overlay) ya sentaron el precedente de regenerar snapshots en migraciones visuales (D5).

## Risks / Trade-offs

- **[Risk] WCAG AA: cambio `text-gray-600` → `text-text-2` en stat labels del PanelHome** → Mitigación: `text-text-2` (#5C6675) mejora el contraste sobre blanco (~5.9:1 vs ~7.5:1 del gray-600); ambos cumplen AA Normal. Se re-valida con el e2e `panel-home.spec.ts` (checks de contraste con `getComputedStyle`).
- **[Risk] Cambiar `text-sm` a `text-xs` en botones y nav puede alterar la proporción visual** → Mitigación: la guía define 12px (text-xs) explícitamente; el cambio es intencional. Se verifica visualmente en la home (`/`) y en `/productos` (donde el SearchForm es visible). Si rompe un layout, se ajusta en el mismo commit lógico.
- **[Risk] Cambio de radio a 0 puede hacer que componentes con bordes visc MagicMock vean "duros"** → aceptado por el cliente (decisión explícita de flat estricto). Los paneles flotantes futuros (dropdowns, modales) sí pueden usar sombras según la guía; pero los componentes base son square.
- **[Risk] `lucide:twitter` no es el logo "X" actual** → aceptado: el cliente prefiere coherencia del set sobre fidelidad de marca. Si en el futuro se requiere el logo de X, se añade `simple-icons:x` o similar en un cambio aparte.
- **[Risk] Snapshots rompen en CI** → Mitigación: cada componente migra con su snapshot nuevo en el mismo commit lógico (tarea por componente).
- **[Trade-off] `text-sm` (14px) en inputs en vez de `text-[13.5px]` literal de la guía** → aceptado: Tailwind expone `text-sm` (14px) y `text-xs` (12px); 13.5px requiere arbitrary value. La diferencia es marginal y `text-sm` ya cumple legibilidad. Se prioriza consistencia con el ecosistema Tailwind.
- **[Trade-off] Sin líneas decorativas en este cambio** → el cliente las definirá aparte. La línea existente del nav activo (`after:h-0.5 after:bg-primary` en Header) se mantiene como indicador de estado funcional, no decorativo.

## Migration Plan

TDD ordenado, baby steps, un eje por grupo de tareas:

1. **Setup** — instalar `@iconify-json/lucide`; remover `material-symbols` + `logos`; actualizar `package.test.ts` (RED→GREEN).
2. **Radio 0 + sync** — `--radius: 0` en ambos `globals.css`; actualizar `tokens.test.ts` (el sync test pasa por construcción al ser ambos iguales).
3. **Iconos Lucide** — migrar `TopHeader.astro` y `Header.astro`; regenerar snapshots; tests de aria-labels siguen verdes.
4. **Tipografía escala completa** — aplicar `font-heading`/`font-body` + pesos/tamaños en los 5 componentes; actualizar `Header.test.ts` (`font-bold` → `font-semibold`); regenerar snapshots.
5. **Flat cleanup** — eliminar `rounded` y `shadow-sm`; reemplazar `gray-*` por tokens; actualizar `SearchForm.test.ts` y `PanelHome.test.ts`; regenerar snapshots.
6. **Docs** — `docs/design/style-guide/README.md` (catálogo Lucide + radio 0) y `docs/frontend-standards.md`.
7. **Verificación** — `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:smoke` en `apps/web`; `openspec validate ui-refactor`; smoke de la home y `/productos`.

**Rollback**: el change se entrega en rama feature + PR único. Si algo rompe, revert del commit (sin migración de datos implicada). Los snapshots antiguos se restauran del git history.

## Open Questions

- **OQ-1**: ¿`lucide:phone` es suficiente para el teléfono del TopHeader, o se prefiere `lucide:phone-call` (auricular con onda, más "llamar")? Se decide en la task de migración del TopHeader con validación visual. Por defecto: `lucide:phone`.
- **OQ-2**: ¿El eyebrow del PanelHome usa `text-xs` (12px) o se mantiene `text-sm` (14px)? La guía dice 11px (h9). Decisión tentativa: `text-xs`. Se valida visualmente.
