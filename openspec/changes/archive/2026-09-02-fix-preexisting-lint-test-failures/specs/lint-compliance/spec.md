# lint-compliance Specification

## Purpose

Garantizar que `make lint` pase en **todos** los workspaces del monorepo (backend, web, admin, html-sanitize), sin relajar los umbrales SOLID del proyecto (`complexity <= 10`, `max-lines <= 400`). Cada workspace SHALL declara y ejecuta su script `lint` con ESLint crudo.

## ADDED Requirements

### Requirement: Backend cumple `complexity <= 10`

El método `runMigration` de `apps/backend/src/cli/migrate/migrate-firestore.use-case.ts` SHALL mantener una complejidad ciclomática ≤ 10, sin modificar el umbral `complexity: ['error', 10]` del `.eslintrc.cjs` de `apps/backend`. (`apps/backend/src/cli/migrate-firestore.ts` solo importa `runMigration`; la definición vive en el use-case.)

#### Scenario: Lint de backend pasa
- **WHEN** se ejecuta `npm run lint --workspace=@riff/backend`
- **THEN** ESLint termina con exit code 0
- **AND** sin errores reportados
- **AND** el método `runMigration` ya no excede el umbral de complejidad 10

#### Scenario: Comportamiento del CLI de migración intacto
- **WHEN** se ejecuta la suite de tests de backend (`npm run test --workspace=@riff/backend`)
- **THEN** todos los tests, incluidos `migrate-firestore.use-case.spec.ts`, pasan

### Requirement: Web sin variables sin usar

Los archivos de test de `apps/web` SHALL pasar ESLint sin errores de `no-unused-vars`. En concreto `industrialApplications` en `apps/web/src/components/__tests__/IndustrialApplications.test.ts` y `fetchMock` en `apps/web/src/lib/api/__tests__/products.test.ts` SHALL no estar declaradas sin uso.

#### Scenario: Lint de web pasa con 0 errores
- **WHEN** se ejecuta `npm run lint --workspace=@riff/web`
- **THEN** ESLint termina con exit code 0
- **AND** no reporta errores de `no-unused-vars` en ningún `.test.ts`

### Requirement: Admin usa ESLint crudo

`apps/admin` SHALL ejecutar su lint mediante un script `eslint "src/**/*.ts" --fix` con un `.eslintrc.cjs` propio (estilo `@typescript-eslint`, `complexity` y `max-lines` como warn alineados con web), en lugar de `ng lint --fix` (no configurado).

#### Scenario: Lint de admin pasa
- **WHEN** se ejecuta `npm run lint --workspace=@riff/admin`
- **THEN** el script lanza ESLint crudo (no `ng lint`)
- **AND** termina con exit code 0 (sin errores)

### Requirement: html-sanitize declara script lint

`packages/html-sanitize/package.json` SHALL declarar un script `lint` que ejecute ESLint crudo sobre `src/**/*.ts`, de modo que el Makefile parametrizado no falle por script ausente.

#### Scenario: Lint de html-sanitize disponible y pasa
- **WHEN** se ejecuta `npm run lint --workspace=@riff/html-sanitize`
- **THEN** el script existe y ESLint termina con exit code 0

### Requirement: `make lint` global verde

El target `make lint` del Makefile del framework SHALL completar sin errores recorriendo los workspaces declarados en `services`.

#### Scenario: make lint exit code 0
- **WHEN** se ejecuta `make lint`
- **THEN** recorre los workspaces backend, web, admin y html-sanitize
- **AND** termina con exit code 0, sin errores de ESLint
