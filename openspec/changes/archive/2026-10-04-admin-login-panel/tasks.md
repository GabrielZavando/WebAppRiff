# Tasks — admin-login-panel

> Change: `admin-login-panel` — Ticket `LOGIN-1` — Tag `[frontend]` — Branch `feature/admin-login-panel`
> Service root (`.specboot.json`): `.` (repo root) — paths below are relative to the repo root.
> Worktree: `../WebApp-login` (desarrollo paralelo con `ui-chrome-polish` en el checkout principal).

## 1. RED — Unit tests de LoginPageComponent (Req 2-9, 11 — SC-001..SC-005, SC-007, SC-008)

- [x] 1.1 RED — Nuevo `login-page.component.test.ts` (Vitest + TestBed, standalone): renderiza logo con `alt="Riff"`, inputs Correo/Contraseña con labels, botón `INICIAR SESIÓN` y link `¿Olvidaste tu contraseña?`; email inválido muestra error al tocar; contraseña <6 o vacía muestra error al tocar; botón `disabled` con form inválido / `enabled` con form válido; submit invoca el handler y previene recarga. (El componente no existe → RED propio.)
  - **Priority**: P1 | **Layer**: smart | **Estimate**: M
  - **Suggested Path**: apps/admin/src/features/auth/login/login-page.component.test.ts
  - **Test Path**: apps/admin/src/features/auth/login/login-page.component.test.ts

## 2. GREEN — LoginPageComponent (Req 2-9, 11 — SC-001..SC-005, SC-007, SC-008)

- [x] 2.1 GREEN — Crear `login-page.component.ts` (standalone, `changeDetection: OnPush`): `ReactiveFormsModule`, `FormGroup` con `email` (`required`, `Validators.email`) y `password` (`required`, `minLength(6)`); getters de control; `onSubmit()` stub que previene el submit nativo (no-op documentado). Card: `min-h-screen bg-bg flex items-center justify-center px-4 py-8` → `w-full max-w-md bg-white border border-border shadow-2 p-8 sm:p-10`; sin `rounded*`; solo utilities de `@theme`.
  - **Priority**: P1 | **Layer**: smart | **Estimate**: M
  - **Suggested Path**: apps/admin/src/features/auth/login/login-page.component.ts
  - **Test Path**: apps/admin/src/features/auth/login/login-page.component.test.ts

- [x] 2.2 GREEN — Template separado `login-page.component.html` (umbral 60-80 líneas): logo `src="assets/img/logo-web.webp"` `alt="Riff"` `max-w-[220px] mx-auto`; inputs con `<label for>`/`id`, `autocomplete`, `aria-describedby` y estados de error (`border-error` + mensaje `text-error`); botón `INICIAR SESIÓN` (`w-full h-11 mt-6 bg-primary hover:bg-primary-dark text-white font-heading font-semibold uppercase text-xs tracking-wide disabled:opacity-50 disabled:cursor-not-allowed`); link `¿Olvidaste tu contraseña?` (`text-primary hover:text-primary-dark`, `aria-label`).
  - **Priority**: P1 | **Layer**: smart | **Estimate**: S
  - **Suggested Path**: apps/admin/src/features/auth/login/login-page.component.html
  - **Test Path**: apps/admin/src/features/auth/login/login-page.component.test.ts

## 3. Routing + bootstrap (Req 1 — SC-006)

- [x] 3.1 GREEN — `app.routes.ts`: `'' → redirectTo: 'login'` (pathMatch full) y `{ path: 'login', loadComponent: () => import('.../login-page.component').then(m => m.LoginPageComponent) }`.
  - **Priority**: P1 | **Layer**: n/a (routing) | **Estimate**: XS
  - **Suggested Path**: apps/admin/src/app/app.routes.ts
  - **Test Path**: no aplica (validado por E2E y typecheck)

- [x] 3.2 GREEN — `app.component.ts` raíz (standalone, template ` <router-outlet/> `) y `main.ts` con `provideRouter(routes)`; el placeholder inline actual desaparece.
  - **Priority**: P1 | **Layer**: n/a (bootstrap) | **Estimate**: XS
  - **Suggested Path**: apps/admin/src/app/app.component.ts (+ apps/admin/src/main.ts)
  - **Test Path**: apps/admin/src/config/__tests__/main.test.ts (regresión: sigue pasando)

## 4. Asset del logo (Req 3 — SC-001)

- [x] 4.1 GREEN — Copiar `apps/web/src/assets/img/logo-web.webp` → `apps/admin/src/assets/img/logo-web.webp` y registrar `"assets": ["src/assets"]` en build options de `angular.json`.
  - **Priority**: P1 | **Layer**: n/a (assets) | **Estimate**: XS
  - **Suggested Path**: apps/admin/angular.json (+ apps/admin/src/assets/img/logo-web.webp)
  - **Test Path**: apps/admin/src/config/__tests__/angular-config.test.ts (regresión)

## 5. Smoke E2E (Req 12 — SC-001, SC-009)

- [x] 5.1 GREEN — Nuevo `apps/admin/e2e/login.spec.ts` (Playwright): `GET /login` renderiza card, logo, ambos campos, botón y link; viewports 375px y 1440px sin overflow horizontal.
  - **Priority**: P2 | **Layer**: n/a (e2e) | **Estimate**: S
  - **Suggested Path**: apps/admin/e2e/login.spec.ts
  - **Test Path**: apps/admin/e2e/login.spec.ts

## 6. Suite + gates (post-implementación)

- [x] 6.1 Suite completa `apps/admin` (Vitest) + `npm run lint` + `npm run typecheck` (ng build); fix cualquier regresión.
  - **Priority**: P1 | **Layer**: n/a | **Estimate**: M
  - **Suggested Path**: no aplica
  - **Test Path**: apps/admin (suite completa)

- [x] 6.2 Ejecutar `verify` (evidencia en `openspec/state/verify-results.json`) y `adversarial-review` (veredicto en `openspec/state/adversarial-result.json`) para el change activo.
  - **Priority**: P1 | **Layer**: n/a | **Estimate**: M
  - **Suggested Path**: no aplica
  - **Test Path**: no aplica

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