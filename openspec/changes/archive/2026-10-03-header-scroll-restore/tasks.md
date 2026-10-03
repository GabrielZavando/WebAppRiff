# Tasks — header-scroll-restore

> Change: `header-scroll-restore` — Ticket `fix/header-scroll-regressions-and-about-page` — Tag `[frontend]` — Branch `feature/fix-header-scroll-and-about-page`
> Service root (`.specboot.json`): `.` (repo root) — paths below are relative to the repo root.

## 1. Fix header scroll state to survive View Transitions (Reqs 1-2 — SC-101, SC-102, SC-103)

- [x] 1.1 RED — Extend `createHeaderScrollState.test.ts` with a "body swap" simulation: init with `targetA`, switch to `targetB` (as View Transitions replaces `<body>`), then dispatch scroll and `astro:page-load`; assert `data-scrolled` lands on the **current** target (lazy resolution), not the init-time one.
  - **Priority**: P1 | **Layer**: n/a (lib) | **Estimate**: S
  - **Suggested Path**: apps/web/src/lib/scroll/__tests__/createHeaderScrollState.test.ts
  - **Test Path**: apps/web/src/lib/scroll/__tests__/createHeaderScrollState.test.ts
  - **Subtasks**: add a swap-simulation helper (two target mocks); write the failing assertions (RED) before touching the lib.

- [x] 1.2 GREEN — `createHeaderScrollState.ts`: resolve the target element **lazily inside `update()`** (use the injected `target` seam when provided, otherwise read the current `document.body` at call time); remove the init-time capture; keep the `astro:page-load` re-apply and the cleanup contract.
  - **Priority**: P1 | **Layer**: n/a (lib) | **Estimate**: S
  - **Suggested Path**: apps/web/src/lib/scroll/createHeaderScrollState.ts
  - **Test Path**: apps/web/src/lib/scroll/__tests__/createHeaderScrollState.test.ts
  - **Subtasks**: delete init-time `target` resolution; lazy default inside `update()`; run the lib tests (RED→GREEN).

## 2. Back-to-top button survives View Transitions (Req 3 — SC-104, SC-105, SC-106)

- [x] 2.1 RED — New `createScrollTopButton.test.ts`: with fake `document`/`window` seams, assert (a) a click on a `[data-scroll-top]` element triggers `scrollTo({ top: 0, behavior: 'smooth' })`, (b) a click on a descendant of it also triggers, (c) clicks outside do not, and (d) the delegation still works after a simulated body swap (initialization is idempotent).
  - **Priority**: P1 | **Layer**: n/a (lib) | **Estimate**: S
  - **Suggested Path**: apps/web/src/lib/scroll/__tests__/createScrollTopButton.test.ts
  - **Test Path**: apps/web/src/lib/scroll/__tests__/createScrollTopButton.test.ts

- [x] 2.2 GREEN — Create `apps/web/src/lib/scroll/createScrollTopButton.ts`: pure, SSR-safe, document-level click delegation (one persistent listener on `document`, `closest('[data-scroll-top]')` → `window.scrollTo`); injectable seams (no `any`); returns a cleanup function.
  - **Priority**: P1 | **Layer**: n/a (lib) | **Estimate**: S
  - **Suggested Path**: apps/web/src/lib/scroll/createScrollTopButton.ts
  - **Test Path**: apps/web/src/lib/scroll/__tests__/createScrollTopButton.test.ts

- [x] 2.3 Wire the module in `Layout.astro`'s existing `<script>` (import + init next to `initHeaderScrollState`), SSR-safe guard included.
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: XS
  - **Suggested Path**: apps/web/src/layouts/Layout.astro
  - **Test Path**: no aplica (Layout.astro covered by the existing `layouts/__tests__/Layout.test.ts`)

- [x] 2.4 Remove the inline `<script is:inline>` `[data-scroll-top]` binding from `Footer.astro` (the delegation replaces it); update `Footer.test.ts` + `footer-test-utils.ts` + footer snapshot to assert the markup without the inline binding.
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: S
  - **Suggested Path**: apps/web/src/components/Footer.astro
  - **Test Path**: apps/web/src/components/__tests__/Footer.test.ts (helpers/footer-test-utils.ts, __snapshots__/Footer.test.ts.snap)

## 3. Header contains the full logo height (Req 4 — SC-107)

- [x] 3.1 RED — Update `Header.test.ts` to assert the responsive `padding-bottom` utility classes (`pb-10` and `lg:pb-12`, or equivalent) on the `<header class="site-header">` element.
  - **Priority**: P2 | **Layer**: dumb | **Estimate**: XS
  - **Test Path**: apps/web/src/components/__tests__/Header.test.ts

- [x] 3.2 GREEN — Add the responsive `padding-bottom` to the `.site-header` container in `Header.astro` (utilities on the `<header>`) or as a rule in `styles/header-scroll.css`; if the visual check shows residual overflow, adjust the values (the mechanism is fixed; the numbers are tunable within this change).
  - **Priority**: P2 | **Layer**: dumb | **Estimate**: XS
  - **Suggested Path**: apps/web/src/components/Header.astro (+ apps/web/src/styles/header-scroll.css)
  - **Test Path**: apps/web/src/components/__tests__/Header.test.ts

- [x] 3.3 Layout sanity: confirm the compact state still contains the shrunk logo without overflow and the sticky shell behavior is unchanged; run the affected component tests.
  - **Priority**: P2 | **Layer**: dumb | **Estimate**: XS
  - **Suggested Path**: no aplica (verification only)
  - **Test Path**: apps/web/src/components/__tests__/Header.test.ts

## 4. /nosotros static page (Req 5 — SC-108, SC-109)

- [x] 4.1 RED — New `pages/__tests__/nosotros.test.ts` (AstroContainer, pattern of `servicios.test.ts`): renders the Layout chrome (exactly one `<header>`, the `<footer>`), an empty `<main>`, no hero image and no search form.
  - **Priority**: P2 | **Layer**: dumb | **Estimate**: S
  - **Test Path**: apps/web/src/pages/__tests__/nosotros.test.ts

- [x] 4.2 GREEN — Create `apps/web/src/pages/nosotros.astro` using the standard `Layout` with `title="Nosotros — Riff"`, `hero={false}`, `showSearch={false}` and an empty `<main>` slot (no intermediate content).
  - **Priority**: P2 | **Layer**: dumb | **Estimate**: XS
  - **Suggested Path**: apps/web/src/pages/nosotros.astro
  - **Test Path**: apps/web/src/pages/__tests__/nosotros.test.ts

## 5. Suite + gates (post-implementation)

- [x] 5.1 Run the full `apps/web` Vitest suite (including snapshot updates for Footer) and fix any regression.
  - **Priority**: P1 | **Layer**: n/a | **Estimate**: M
  - **Suggested Path**: no aplica
  - **Test Path**: apps/web (whole suite)

- [x] 5.2 Run `verify` (persist evidence to `openspec/state/verify-results.json`) and `adversarial-review` (persist verdict to `openspec/state/adversarial-result.json`) for the active change.
  - **Priority**: P1 | **Layer**: n/a | **Estimate**: M
  - **Suggested Path**: no aplica
  - **Test Path**: no aplica
  - **Nota**: gates ejecutados y con evidencia persistida — verify `PASS` (2026-10-03T02:57:20Z), adversarial `SHIP` (2026-10-03T03:06:13Z).

## Mandatory Steps

> Checklist obligatoria del ciclo SDD (fuente única de verdad:
> `docs/openspec-tasks-mandatory-steps.md`, inyectada por `plan-change` al
> generar este `tasks.md`). Obligatoria, no sugerida.

### Pre-implementación

Antes de escribir la primera línea de la tarea actual:

- [x] La **rama activa** sigue la convención vigente del proyecto (ej.
  `feature/*`, `fix/*`); trabajar sobre ella, nunca directamente sobre la rama
  principal.
- [x] Estado **git limpio**: sin cambios sin commitear (ni staged) antes de
  empezar; si hay trabajo en curso, resolverlo primero.

### Durante la implementación

- [x] **Test nuevo que falla antes de implementar (RED)**: escribir el test del
  escenario (`SC-NNN`) y verificar que falla antes de escribir código de
  producción.
- [x] Ejecutar los **tests unitarios del módulo** tocado mientras se itera
  (ciclo RED-GREEN-REFACTOR), no solo al final.

### Post-implementación

Antes de dar la tarea por cerrada:

- [x] **Ejecutar `verify`**: la verificación del change corre y produce
  evidencia persistente (`openspec/state/verify-results.json`).
- [x] **Ejecutar `adversarial-review`**: la auditoría adversarial corre y
  produce veredicto persistente (`openspec/state/adversarial-result.json`).

> Ambos pasos post alimentan los gates duros de `/commit` (M-901): sin
> `PASS` + `SHIP` vigentes para el change activo, el commit bloquea.