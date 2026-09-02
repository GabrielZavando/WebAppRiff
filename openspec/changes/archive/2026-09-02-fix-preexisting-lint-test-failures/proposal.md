# Proposal: fix-preexisting-lint-test-failures

## Why

Tras actualizar el framework Specboot (`update-specboot-framework`), el nuevo `Makefile` parametrizado por workspace hace explícitos fallos **preexistentes** de `make lint` y `make test` que antes quedaban ocultos: varios workspaces no pasan ESLint y el runner de test de `apps/admin` apunta a un Karma no configurado. Mientras existan, el pipeline CI del framework (`make lint` / `make test`) no puede quedar verde, bloqueando criterios de aceptación del cambio anterior.

## What Changes

- **Backend lint**: reducir la complejidad ciclomática de `runMigration` (13 → ≤10) en `apps/backend/src/cli/migrate-firestore.ts` para que `make lint` pase sin tocar el umbral configurado.
- **Web lint**: eliminar 2 variables sin uso (`industrialApplications`, `fetchMock`) en `apps/web/src/components/__tests__/IndustrialApplications.test.ts` y `apps/web/src/lib/api/__tests__/products.test.ts`.
- **Admin lint**: sustituir `ng lint --fix` (no configurado — falla "Unknown argument: fix") por ESLint crudo, añadiendo `.eslintrc.cjs` a `apps/admin` siguiendo la convención de backend/web.
- **html-sanitize lint**: añadir el script `lint` a `packages/html-sanitize/package.json` (usa ESLint crudo como el resto).
- **Admin test**: reconducir `ng test --no-watch --code-coverage` (Karma sin configurar — falla "Unknown arguments") a `vitest run`, que es el runner real de los tests `.test.ts` existentes en `apps/admin`; eliminar el `test:watch` muerto de Karma.
- **Design tokens (sync)**: añadir el token `--shadow-scroll-shell` a `apps/admin/src/styles/globals.css` para restaurar la paridad web↔admin que valida `apps/admin/src/styles/__tests__/sync.test.ts`.

## Capabilities

### New Capabilities
- `lint-compliance` — todos los workspaces (backend, web, admin, html-sanitize) pasan `eslint` bajo `make lint`.
- `test-runner-consistency` — `apps/admin` ejecuta sus tests con Vitest (eliminando el Karma muerto) de modo que `make test` quede verde.

### Modified Capabilities
- `design-tokens` — `apps/admin/src/styles/globals.css` declara el token de sombra `--shadow-scroll-shell` para mantener la paridad de tokens con `apps/web` (validada por `sync.test.ts`).

## Impact

- **Afecta**: `apps/backend/src/cli/migrate-firestore.ts`, `apps/web/src/components/__tests__/IndustrialApplications.test.ts`, `apps/web/src/lib/api/__tests__/products.test.ts`, `apps/admin/package.json`, `apps/admin/angular.json` (si requiere), `packages/html-sanitize/package.json`, `apps/admin/src/styles/globals.css`.
- **Nuevos archivos**: `apps/admin/.eslintrc.cjs` (y su `tsconfig` de lint si necesario).
- **Sin cambios de API** ni de modelo de datos. Sin cambios en el contrato público.
- **Dependencia**: este cambio desbloquea el criterio 6.3 del cambio `update-specboot-framework` (deja `make lint`/`make test` verdes).
