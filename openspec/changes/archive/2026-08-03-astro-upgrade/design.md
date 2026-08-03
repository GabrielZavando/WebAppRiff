## Context

`apps/web/` (sitio público SSG) corre hoy con:

- `astro@^4.0.0` (Astro 4 lanzado Dic 2023; ya hay 3 majors de distancia a la objetivo `7.1.6`)
- `@astrojs/tailwind@^5.0.0` (integración **deprecated** desde Astro 5; sus releases se congelan)
- `tailwindcss@^3.4.0` (Tailwind v4 lanzado Ene 2025 es el target declarado en `docs/frontend-standards.md` § "Stack específico del proyecto")
- `@astrojs/check@^0.9.10`, `eslint-plugin-astro@^1.7.0`, `@typescript-eslint/*@^7.18.0`, `vitest@^1.0.0`, `playwright@^1.40.0`, `typescript@^5.3.0`
- `engines.node` del monorepo: `>=20.19.0`

Estado del sitio (lo que existe hoy y debe seguir funcionando):

- 2 componentes principales: `TopHeader.astro` (utility bar teléfono/redes), `Header.astro` (header global con `NAVIGATION_ITEMS` hardcoded + CTA + hamburguesa mobile)
- 2 páginas en `src/pages/`: `index.astro`, `cotizacion.astro` (placeholder)
- 1 layout global `Layout.astro` integrando ambos headers
- Tokens de marca en `tailwind.config.mjs`: `brand-navy: #1B2A4A`, `brand-navy-light: #2C3E6B`, `brand-orange: #F97316`
- Tests: 4 unit (`TopHeader.test.ts`, `Header.test.ts`, `navigation.test.ts`, `contact.test.ts`), 2 E2E (`site-header.spec.ts`, `top-header.spec.ts`)
- `Header.test.ts` y `TopHeader.test.ts` usan `experimental_AstroContainer as AstroContainer from 'astro/container'` + `toMatchSnapshot()`

Stakeholders:

- `docs/frontend-standards.md` (reglas de diseño Astro, stack objetivo)
- `docs/deploy-standards.md` (VPS via Coolify, Docker multi-stage, Node 20 hoy — debe coordinarse bump a 22)
- Equipo Riff: el sitio público es la cara visible del cliente; cero regresión visual aceptable

## Goals / Non-Goals

**Goals:**

- `astro` pinneado en `7.1.6` exacto en `apps/web/package.json`
- Migrar Tailwind v3 → v4 vía `@tailwindcss/vite` (plugin Vite), eliminando el deprecated `@astrojs/tailwind` y el archivo `tailwind.config.mjs`
- Tokens de marca (`brand-navy`, `brand-navy-light`, `brand-orange`) definidos en `@theme {}` dentro de `globals.css`, preservando los hex literales
- Toda la toolchain de desarrollo, lint y test compatible con Astro 7 (`@astrojs/check`, `eslint-plugin-astro`, `@typescript-eslint/*`, `vitest`, `playwright`, `typescript`) — `npm ls --workspace=apps/web` sin peer warnings críticos
- `npm run build/lint/typecheck/test/test:smoke --workspace=apps/web` todos exit 0
- Sitio públicamente idéntico pre y post upgrade: render visual y estructura semántica de `/` y `/cotizacion` sin cambios perceptibles más allá del whitespace cosmetico
- Node runtime subido a `>=22.12.0` (raíz + apps/web) para alinear con Vite 8 (require Node 20.19+ o 22.12+)

**Non-Goals:**

- NO adoptar `src/fetch.ts` (advanced routing) — feature estable en Astro 7 pero fuera del alcance de un change de upgrade
- NO adoptar CDN cache providers (Netlify/Vercel/Cloudflare) — el sitio es SSG puro via Docker/Nginx, sin adapter SSR
- NO adoptar `routeRules` ni `Astro.cache` — sitios estáticos no benefit
- NO adoptar `memoryCache()` — aplica a SSR, no SSG puro
- NO migrar a Sätteri explícitamente — se vuelve el default automático; sin configuración markdown actualmente, no hay acción
- NO tocar `apps/backend/**` ni `apps/admin/**`
- NO cambiar API ni modelo de datos (`docs/api-spec.yml` y `docs/data-model.md` intocados)
- NO cambiar `output: 'static'` (el sitio sigue siendo SSG)
- NO cambiar comportamiento funcional del sitio: los 5 items de navegación, el CTA, la hamburguesa mobile, los landmarks de a11y — todo idéntico
- NO adoptar `src/fetch.ts`, `routeRules`, Hono integration, JSON logging, `astro dev --background`, ni ninguna otra feature estable nueva de Astro 7 — este change es solo de **upgrade + no-regresión**

## Decisions

### 1. Pin exacto `astro: "7.1.6"` (no caret)

**Decisión:** `"astro": "7.1.6"` sin caret ni tilde.

**Por qué:** Un change de upgrade de 3 majors debe ser reproducible. Permitir `^7.1.6` deja a `npm install` subir a futuras minors/parches sinaprocesar otro change, dificultando rollback y asociar bugs a versiones específicas.

**Alternativas consideradas:**
- `^7.1.6`: descartada por la razón de arriba
- `~7.1.6`: permite 7.1.x pero bloquea 7.2+; poco útil given que parches críticos pueden venir en 7.2.x
- Mantener `^4.0.0`: fuera de discusión (es el change de upgrade)

### 2. Migrar Tailwind v3 → v4 vía `@tailwindcss/vite`, eliminar `@astrojs/tailwind` y `tailwind.config.mjs`

**Decisión:** Instalar `tailwindcss@^4` + `@tailwindcss/vite@^4`; eliminar `@astrojs/tailwind` de las dependencias y de `astro.config.mjs` (`integrations: [tailwind()]`); eliminar el archivo `tailwind.config.mjs`; mover tokens de marca a `@theme {}` en `globals.css`; reemplazar directivas `@tailwind base/components/utilities` con `@import "tailwindcss"`.

**Por qué:**
- `@astrojs/tailwind` está deprecated desde Astro 5+ y sus releases se congelan
- `docs/frontend-standards.md` declara "Tailwind CSS v4" como stack objetivo — hoy el repo usa v3 → deuda técnica
- `@tailwindcss/vite` es el plugin Vite de primera parte de Tailwind v4 (mejor performance que PostCSS), y se integra de manera idiomática con Astro via `vite.plugins` (no necesita una "integration" específica)
- CSS-first configuration (`@theme {}`) hace los tokens visibles como variables CSS nativas (`var(--color-brand-orange)` usable fuera de clases Tailwind si se requiere)
- Content discovery automático en v4 (no más `content: [...]` array), reduce maintenance

**Alternativas consideradas:**
- Mantener Tailwind v3 y actualizar `@astrojs/tailwind` a su última versión compatible con Astro 4: tech-debt que crecería; descartada
- Migrar a v4 pero mantener `tailwind.config.mjs` (v4 soporta config JS legacy): soportado pero contradice el principio CSS-first; descartada
- Usar `@tailwindcss/postcss` en vez de `@tailwindcss/vite`: vía PostCSS funciona pero pierde perf; descartada

### 3. Adoptar `compressHTML: 'jsx'` (nuevo default de Astro 7) + regenerar snapshots + auditar visualmente

**Decisión:** No setear `compressHTML` en `astro.config.mjs` (tomar el default `'jsx'` de Astro 7). Regenerar snapshots de `Header.test.ts` y `TopHeader.test.ts`. Auditar visualmente `Header.astro` y `TopHeader.astro` para detectar inline elements que pierdan separación; si se encuentra alguno, aliviarlo con `flex gap-*` (preferido) o `{' '}` explícito en el mismo change.

**Por qué:** Astro 7 colapsa whitespace entre inline elements siguiendo reglas JSX (e.g., `<a>Inicio</a> <a>Nosotros</a>` queda `<a>Inicio</a><a>Nosotros</a>`). En el repo, la nav del Header usa `hidden lg:flex` (flexbox), que **ignora whitespace literal entre flex items** → el cambio de `'jsx'` no afecta la visual. Pero:
- Los snapshots HTML del test **sí cambian** (espacios removidos) y deben regenerarse
- Hay que confirmar manualmente que TopHeader (con items `inline`) no pierda separación; si la pierde, aliviar con flex o `{' '}`

**Alternativas consideradas:**
- Setear `compressHTML: true` (HTML-aware, comportamiento Astro 6): minimiza diff de snapshots pero pospone la adopción del default nuevo y crea deuda técnica (habría otro change futuro para migrar). **Descartada.**
- Setear `compressHTML: false` (preserva todo): preserva snapshots pero bloat el HTML de producción. Descartada.

**Ejemplo de la diferencia con markup del repo:**

```astro
<nav class="hidden lg:flex">
  <a href="/">Inicio</a>
  <a href="/nosotros">Nosotros</a>
</nav>
```

| Modo | HTML output | Visual (con flex) |
|---|---|---|
| `true` (Astro 6) | `... <a>Inicio</a> <a>Nosotros</a> ...` | Items separados por gap de flex (whitespace ignorado) |
| `'jsx'` (Astro 7 default) | `... <a>Inicio</a><a>Nosotros</a> ...` | Ídem — flexbox ignora text whitespace nodes |

Visual idéntico en flex; el HTML cambia (sin espacio entre `</a>` y `<a>`) → snapshot debe regenerarse.

### 4. Subir `engines.node` a `>=22.12.0`

**Decisión:** Bump `engines.node` de `>=20.19.0` → `>=22.12.0` en `package.json` raíz y `apps/web/package.json`.

**Por qué:**
- Astro 7 usa Vite 8, que require Node 20.19+ o 22.12+
- Node 22.12 es el LTS vigente; 20 entra maintenance mode en Abr 2026 (mi entorno: hoy es Ago 2026, ya está en fines de vida)
- Preparar el terreno para futuras features de Astro 7 que dependen de `node:sqlite` (removido `@astrojs/db`) — aunque fuera de scope, no estorba

**Riesgo:** El VPS via Coolify debe tener Node 22 instalado. Si no, el build falla en deploy. Mitigación: confirmar versión runtime del Dockerfile de apps/web; si está en Node 20, este change DEBE bump el `FROM node:20-alpine` → `FROM node:22-alpine` también.

**Alternativas consideradas:**
- Mantener `>=20.19.0` (vite 8 lo soporta): válido pero deja al repo en un runtime que entra maintenance; postergarnga el problema. Descartada.
- Subir a `>=22.5.0` (donde entra `node:sqlite`): demasiado específico a un feature que no usamos. `>=22.12.0` es más seguro.

### 5. Actualizar toda la toolchain de desarrollo

**Decisión:** Sin versiones pinneadas en el proposal (son demasiadas y variables), se definen en `tasks.md` Paso 1 con `npm view <pkg>@latest peerDependencies` para obtener la versión exacta compatible con Astro 7. Targets cualitativos:

- `@astrojs/check`: última compatible con Astro 7.x
- `eslint-plugin-astro`: última compatible con Astro 7.x
- `@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser`: `^8.x` (compat TS 5.5+ y ESLint 9 / flat config; verificar que no rompa `.eslintrc.cjs` legacy)
- `typescript`: `^5.5+` (mínimo para Vite 8)
- `vitest`: `^2.x` o `^3.x` (Vite 8 rompe vitest 1.x; verificar cuál soporta Vite 8 sin warnings)
- `playwright`: `^1.50+` (sin breaking changes críticos respecto de `^1.40`)

**Por qué:** La estrategia es "primero consultar el registry con `npm view peerDependencies`, luego pinear la última compatible" en lugar de hardcodear versiones que pueden no existir o ser las correctas al momento de ejecutar `/apply`.

**Matriz de versiones target (Tarea 1.4 — evidencia del spike de Aug 3 2026):**

| Paquete | Actual repo | Latest registry | peerDependencies (latest) | Target决策 | Notas |
|---|---|---|---|---|---|
| `astro` | `^4.0.0` | `7.1.6` ✅ existe | `node: '>=22.12.0'` | **`7.1.6` (pin exacto)** | Valida Decision 4 (Node ≥22.12) |
| `@astrojs/check` | `^0.9.10` | `0.9.10` | `typescript: ^5 || ^6` | **mantener `0.9.10`** | Ya es la última; no requiere bump |
| `typescript` | `^5.3.0` | `7.0.2` (latest major) | — | **`^5.9.3`** (no subir a 7) | TS 7 sería salto major fuera de scope; 5.9.3 es la última 5.x |
| `vitest` | `^1.0.0` | `4.1.10` | `vite: ^6 \|\| ^7 \|\| ^8` ✅ Vite 8 | **`^4.1.10`** (bump majeor 1→4) | Vite 8 compatible. API de `.toMatchSnapshot()` estable. |
| `playwright` | `^1.40.0` | `1.62.1` | (sin peers restrictivos) | **`^1.62.1`** | Salto compatible 1.40→1.62 sin breaking |
| `eslint-plugin-astro` | `^1.7.0` (ESLint 8 compat) | `3.1.0` | `eslint: >=10.0.0` ❌ ESLint 8 | **mantener `^1.7.0`** | Subir a v2+ exige migrar todo a ESLint 10/flat config — fuera de scope de este change |
| `@typescript-eslint/eslint-plugin` | `^7.18.0` | `8.65.0` | `eslint: ^8.57 \|\| ^9 \|\| ^10` ✅ ESLint 8 | **`^8.65.0`** | Compatible con ESLint 8 legacy + v9/10 |
| `@typescript-eslint/parser` | `^7.18.0` | `8.65.0` | `eslint: ^8.57 \|\| ^9 \|\| ^10` ✅ ESLint 8 | **`^8.65.0`** | Idem |
| `eslint` | `^8.56.0` | `10.x` latest | — | **mantener `^8.56.0`** | Migra a ESLint 10/flat config en change futuro (`eslint-flat-config`) |
| `tailwindcss` | `^3.4.0` | `4.3.3` | — | **`^4.3.3`** (major bump) | Migra via `npx @tailwindcss/upgrade` |
| `@tailwindcss/vite` | (no existe) | `4.3.3` | `vite: ^5 \|\| ^6 \|\| ^7 \|\| ^8` ✅ Vite 8 | **`^4.3.3`** (nueva dep) | Reemplaza a `@astrojs/tailwind` |
| `@astrojs/tailwind` | `^5.0.0` | (frozen/deprecated) | — | **ELIMINAR** | Deprecado desde Astro 5+ |
| `node` (engines) | `>=20.19.0` | (n/a) | Astro 7.1.6 exige `>=22.12.0` | **`>=22.12.0`** | Forzado por astro@7.1.6@peer `node` |

**Notas de la matriz:**

1. **ESLint:** se mantiene en `^8.56.0` con `.eslintrc.cjs` legacy (config actual). Las `@typescript-eslint/*` v8 soportan ESLint 8, 9 y 10 según su peer range. `eslint-plugin-astro` se mantiene en `1.7.0` (última compatible con ESLint 8 — desde `2.0.0` exige ESLint 10). Migrar a ESLint 10 + flat config queda para un change futuro `eslint-flat-config` por riesgo de scoping.
2. **TypeScript:** se mantiene en `^5.9.3` (no salto a v7). TS 7 es un major breaking (requeriría revisar todos los strict flags,decorators, etc.); fuera de scope de un change de upgrade de frontend.
3. **vitest:** salto 1→4 es major pero la API de assertions/snapshots es estable. Si hay API breaks, se detecta al regenerar snapshots (Tarea 6.5).

**Alternativas consideradas:**
- Hardcodear versiones específicas en el design (ej. `@astrojs/check@0.9.13`): frágil, las versiones cambian durante el ciclo de vida del change; descartada
- Dejar todo en `^latest` sin más: descartado, no es reproducible

### 6. Uso de upgrade tools oficiales: `npx @astrojs/upgrade` y `npx @tailwindcss/upgrade`

**Decisión:** Ejecutar `npx @astrojs/upgrade` (CLI oficial de Astro que bumpa astro + integraciones oficiales compatibles) y `npx @tailwindcss/upgrade` (CLI oficial de Tailwind que migra config JS → CSS-first y renombrado de utilidades como `bg-gradient-*` → `bg-linear-*`).

**Por qué:** Estas tools automáticas cubren la mayoría de los cambios cosmeticos (renames, config migration, class renames). Hacen el 80% del trabajo; el 20% restante (snapshots, auditoría whitespace, tooling no-oficial-Astro como vitest/playwright/eslint) es manual.

**Alternativas consideradas:**
- Hacer todo el bump manual con `npm install astro@7.1.6 @tailwindcss/vite@^4 ...`: pierde el conocimiento de renames de utilidades; descartada
- Solo `npx @astrojs/upgrade` y luego migrar Tailwind a mano: Tailwind v3→v4 Without la tool oficial es propenso a errores (renames + config); descartada

## Risks / Trade-offs

- **[Riesgo] Snapshots de `Header.test.ts` y `TopHeader.test.ts` fallan** → **Mitigación:** Regenerar `__snapshots__/*.snap` tras el upgrade. Verificar que el import de la Container API (`experimental_AstroContainer as AstroContainer`) siga existiendo en `astro/container`; si Astro 7 lo renombró a `AstroContainer` estable, actualizar el import en ambos tests.

- **[Riesgo] Inline elements visuales pierden separación por `'jsx'`** → **Mitigación:** Auditar manualmente `Header.astro` y `TopHeader.astro`. Si hay items en línea sin `flex gap-*`, aliviar con flex o `{' '}` explícito en el mismo change. Inspección visual de `/` y `/cotizacion` (dev server) pre/post upgrade comparando screenshots.

- **[Riesgo] HTML inválido silencioso antes, ahora build falla con Rust compiler estricto** → **Mitigación:** El Rust compiler de Astro 7 NO autocorrige HTML (no más tag reordering, no más auto-close). Si algún `.astro` tiene tags sin cerrar o anidación inválida (`<div>` dentro de `<p>`, etc.), el build falla. Inspección individual de los 9 archivos `.astro` existentes (TopHeader, Header, Layout, 6 icons, 2 pages). Build incremental para detectar errores.

- **[Riesgo] Clases Tailwind renombradas en v4 (`bg-gradient-*` → `bg-linear-*`, `shadow-sm` → `shadow-xs`, etc.)** → **Mitigación:** `npx @tailwindcss/upgrade` migra la mayoría automáticamente. Grep pre-upgrade: `rg "bg-gradient-|shadow-sm|shadow-lg" apps/web/src/` para inventariar usos. Pos-upgrade: build + lint capturan fallas.

- **[Riesgo] `'jsx'` whitespace cambia el render visual de páginas estáticas** → **Mitigación:** Auditoría visual obligatoria de `/`, `/cotizacion` en dev + production preview. Documentar el diff visual esperado (should be nulo) en `tasks.md` Paso 7.

- **[Riesgo] `engines.node >= 22.12.0` rompe el Dockerfile actual de apps/web (si usa `node:20-alpine`)** → **Mitigación:** Verificar `apps/web/Dockerfile` (si existe) y bump a `node:22-alpine` o `node:22-slim` en el mismo change. Si el VPS via Coolify no tiene Node 22, documentar como Open Question y coordinar con deploy.

- **[Riesgo] `@typescript-eslint/*` v8 exige ESLint 9 flat config; `.eslintrc.cjs` legacy rompe** → **Mitigación:** Verificar compat con `eslint@8` (que ya está en el repo) o bump ESLint a v9 y migrar a `eslint.config.js` (flat). Si el segundo es viable, moverlo dentro del scope; si es muy invasivo, mantener ESLint 8 y usar `@typescript-eslint/*` v7 (si es compatible con Astro 7 — verificar).

- **[Riesgo] `vitest` v2/v3 cambia API de snapshot o matchers** → **Mitigación:** Tests de lib (`navigation.test.ts`, `contact.test.ts`) son puros `expect().toEqual(...)`, sin snapshots → no se rompen. Tests de `Header`/`TopHeader` regeneran snapshots de cualquier forma.

- **[Trade-off] **El change es grande** (Astro 7 + Tailwind 4 + tooling + snapshots en un solo PR)**: justificado porque separarlos deja el repo en estados intermedios rotos (Tailwind v3 no funciona con Astro 7 puro sin `@astrojs/tailwind` deprecated; abrir un segundo change para Tailwind v4 duplicaría el overhead de artefactos). Compensado con tasks.md granular y TDD incremental.

- **[Trade-off] Pin exacto `7.1.6` sin caret**: maximiza reproducibilidad pero requiere abrir otro change para bump futuro. Aceptable para updates de infraestructura crítica.

## Migration Plan

Pasos ordenados (detallados en `tasks.md`, este es el resumen ejecutivo):

1. **Spike de versiones target** (tasks 1.1–1.4): `npm view <pkg>@latest peerDependencies` para cada dep; documentar matriz final en una tabla a"; sujetar versiones exactas antes de cualquier cambio.

2. **Backup de snapshots actuales** (task 2.1): commit pre-upgrade con los `.snap` actuales como baseline (aunque se vayan a regenerar, tenerlos para diff/audit post-upgrade).

3. **Astro upgrade** (tasks 3.1–3.5):
   - `npx @astrojs/upgrade` (deja astro en latest 7.x; luego override a `7.1.6` exacto)
   - Ajustar `apps/web/package.json` con `"astro": "7.1.6"`
   - Bump `@astrojs/check` a la versión compatible identificada en Paso 1
   - Ejecutar `npm run typecheck --workspace=apps/web` (`astro check`); corregir errores que surjan por Rust compiler estricto
   - Build incremental para detectar HTML inválido

4. **Tailwind v4 migration** (tasks 4.1–4.8):
   - `npx @tailwindcss/upgrade` (migra config y classes)
   - Eliminar `apps/web/tailwind.config.mjs`
   - Eliminar `@astrojs/tailwind` de `astro.config.mjs` y `package.json`
   - `npm install tailwindcss@^4 @tailwindcss/vite@^4`
   - Reescribir `apps/web/src/styles/globals.css`: `@import "tailwindcss"` + `@theme { --color-brand-navy: #1B2A4A; --color-brand-navy-light: #2C3E6B; --color-brand-orange: #F97316; }`
   - Añadir `@tailwindcss/vite()` en `astro.config.mjs` → `vite.plugins`
   - Grep de renames residuales (`bg-gradient-*` → `bg-linear-*`)

5. **Tooling update** (tasks 5.1–5.4): `vitest`, `playwright`, `typescript`, `eslint-plugin-astro`, `@typescript-eslint/*` — bump según matriz de Paso 1; ajustar `.eslintrc.cjs` si ESLint 9 flat config es necesario; ajustar `vitest.config` si Vite 8 exige cambios.

6. **Auditoría whitespace + regen snapshots** (tasks 6.1–6.5):
   - Auditar `Header.astro` y `TopHeader.astro` para confirmar `flex gap-*` en contenedores de items inline
   - Ajustar import de Container API en tests si el nombre cambió en Astro 7 (`experimental_AstroContainer` vs `AstroContainer`)
   - `npm run test --workspace=apps/web` con `--updateSnapshot` para regenerar `.snap`
   - Verificar que `navigation.test.ts` y `contact.test.ts` siguen pasando sin cambios

7. **E2E Playwright** (tasks 7.1–7.3):
   - Re-ejecutar `site-header.spec.ts` y `top-header.spec.ts`
   - Ajustar selectores si HTML cambió por whitespace `'jsx'`
   - Inspección visual de `/` y `/cotizacion` (dev + preview build) — comparar screenshots pre/post

8. **Verificación final** (tasks 8.1–8.7):
   - `npm run build/lint/typecheck/test/test:smoke --workspace=apps/web` todos exit 0
   - `npm ls --workspace=apps/web` sin peer warnings críticos
   - `openspec validate astro-upgrade` y `openspec status --change astro-upgrade --json` con artefactos completos
   - Confirmar bump de `engines.node` y `FROM node:22-alpine` en Dockerfile si aplica

**Rollback strategy:**

- El change entra como un único PR contra `main` (o feature branch + PR) — `git revert <commit>` restaura todo el conjunto
- Los snapshots regenerados viven en el mismo commit → revertirlos es parte del revert
- No hay migraciones de datos ni cambios en Firebase / Firestore
- El Dockerfile, una vez buildeado con Node 22, queda en ese runtime; revertir el PR re-deploy con la imagen anterior (Coolify redeploy del tag previo)

## Open Questions

1. **Dockerfile de `apps/web`** — **RESPONDIDA (Tarea 1.1):** No existe ningún `Dockerfile` en el repo (verificado con `ls`, `git ls-files | grep -i dockerfile` y glob `apps/web/Dockerfile*` + `**/Dockerfile*`, todos con 0 matches). Tampoco existe `docker-compose.yml` en raíz, ni `nixpacks.toml`, ni `.dockerignore` en `apps/web/`.
   
   El workflow `.github/workflows/deploy.yml` referencia `hashFiles('Dockerfile')` (líneas 27, 108, 190) y `docker-compose up -d` (líneas 79, 154, 211), pero como los archivos no existen el `if: ... && hashFiles('Dockerfile') != ''` short-circuit a `false` → el job queda skipeado. El workflow es scaffolding de `specboot` pendiente de conectar a la infraestructura real de deploy (Coolify en VPS Oracle).
   
   **Implicación para la Tarea 5.5**: No aplica el bump `FROM node:20-alpine → node:22-alpine` (no hay Dockerfile que bump). La Tarea 5.5 queda **no-op** y se documenta este hallazgo como evidencia. Cuando se integre el deploy real (futuro change, probablemente `deploy-setup` o similar), ese change deberá crear el Dockerfile con `FROM node:22-alpine` ya alineado con el `engines.node` que este change establece, evitando regresar a Node 20.

2. **Nombre de la Container API en Astro 7**: ¿`experimental_AstroContainer` sigue exportándose desde `astro/container`, o se renombró a `AstroContainer` estable? **Se responde en tasks.md Paso 6.2 (inspeccionar `astro/container` exports tras el bump).**

3. **ESLint strategy** — **RESPONDIDA (Tarea 1.4):** Se mantiene ESLint `^8.56.0` + `.eslintrc.cjs` legacy por este change. `@typescript-eslint/*` v8.65.0 soporta ESLint 8/9/10 según su peer range → bump a `^8.65.0` sin migrar a flat config. `eslint-plugin-astro` se mantiene en `1.7.0` (última compatible con ESLint 8 — desde v2.0.0 exige ESLint 10). Migra a ESLint 10 + flat config + `eslint-plugin-astro@^3` en un change futuro `eslint-flat-config`, fuera de scope por riesgo de scoping alto.

4. **vitest v2 vs v3** — **RESPONDIDA (Tarea 1.4):** vitest@4.1.10 (latest major) soporta `vite: '^6 || ^7 || ^8'` y `@types/node: '^20 || ^22 || >=24'` → compatible con Vite 8 + Node 22. Se sube de `^1.0.0` directamente a `^4.1.10` (salto 3 majors, pero la API de `.toMatchSnapshot()` y `.toEqual()` es estable). Si hay breaks de API, se detecta al regenerar snapshots (Tarea 6.5).

Estas Open Questions son operacionales (se resuelven durante /apply consultando el registry / introspection); NO son ambigüedades de especificación. Las specs son estables respecto de estas decisiones.
