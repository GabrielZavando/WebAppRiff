# Admin login panel UI

**Ticket**: LOGIN-1
**Tag**: [frontend] (explícito — todo el trabajo vive en apps/admin)
**Branch**: feature/admin-login-panel

## Why

El panel admin de Angular (`apps/admin`) es hoy un placeholder de arranque
(`main.ts` con un div `bg-primary`); no tiene routing ni ninguna página real.
Para comenzar a construir la interfaz de administración se necesita el primer
hito: un panel de inicio de sesión con la identidad visual de la marca Riff.
El cliente pide solo la interfaz responsive (UI-only): logo de la empresa,
campos de Correo y Contraseña, botón de inicio de sesión y el texto clickeable
"¿Olvidaste tu contraseña?". La autenticación real (Firebase Auth) queda fuera
de alcance en este hito y se conectará en un change posterior.

## What Changes

- Nuevo `LoginPageComponent` (standalone, OnPush, smart) en
  `apps/admin/src/features/auth/login/`: card blanca centrada sobre fondo neutro
  (`bg-bg`), flat estricto (sin `rounded*`, solo utilities de `@theme`, sin hex).
- Logo de la marca (`logo-web.webp`) copiado a `apps/admin/src/assets/img/` y
  registrado en `angular.json` (build options `assets`).
- Formulario reactivo (ReactiveFormsModule): correo `required + email`,
  contraseña `required + minLength(6)`; errores visibles con `border-error` +
  `text-error`; botón `INICIAR SESIÓN` deshabilitado con form inválido;
  submit stub (no-op, UI-only).
- Link "¿Olvidaste tu contraseña?" clickeable (`<a href="#">` decorativo).
- Routing: `@angular/router` con `'' → redirectTo /login` y ruta `/login`
  lazy (`loadComponent`), raíz `AppComponent` con `<router-outlet/>`.
- Tests: unit (Vitest/TestBed) del componente + smoke E2E (Playwright) de la
  ruta `/login` en viewports móvil y desktop.

Fuera de alcance: autenticación real (Firebase Auth / backend), recuperación de
contraseña, guard de rutas, dashboard y demás páginas del panel.

## Capabilities

### New Capabilities

- `admin-login`: página `/login` del panel admin con card de acceso (logo,
  correo, contraseña, botón y link de recuperación), responsive y accesible.

### Modified Capabilities

- Ninguna (el panel admin no tiene capabilities previas; el placeholder de
  `main.ts` se reemplaza por el bootstrap con router).

## Impact

- `apps/admin/src/app/app.routes.ts` (nuevo)
- `apps/admin/src/app/app.component.ts` (nuevo)
- `apps/admin/src/features/auth/login/login-page.component.ts` (nuevo) (+ `.html`)
- `apps/admin/src/features/auth/login/login-page.component.test.ts` (nuevo)
- `apps/admin/src/assets/img/logo-web.webp` (nuevo, copiado de `apps/web`)
- `apps/admin/e2e/login.spec.ts` (nuevo)
- `apps/admin/src/main.ts` (bootstrap con `provideRouter`)
- `apps/admin/angular.json` (assets)