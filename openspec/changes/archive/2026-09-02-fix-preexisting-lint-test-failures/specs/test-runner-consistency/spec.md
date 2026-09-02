# test-runner-consistency Specification

## Purpose

Corregir el runner de tests de `apps/admin`: los tests reales son Vitest (`src/**/*.test.ts`), pero el script declarado apuntaba a `ng test` (Karma no configurado) y rompía `make test`. Este cambio alinea el script con el runner real para que `make test` quede verde en todos los workspaces.

## ADDED Requirements

### Requirement: Admin ejecuta sus tests con Vitest

El script `test` de `apps/admin/package.json` SHALL ejecutar `vitest run` (no `ng test`), y el script `test:watch` SHALL ejecutar `vitest`. No se mantiene la vía Karma (no hay `karma.conf.js` ni architect target `test`).

#### Scenario: Script test de admin usa Vitest
- **WHEN** se inspecciona `apps/admin/package.json`
- **THEN** `scripts.test` es `vitest run`
- **AND** `scripts["test:watch"]` es `vitest`
- **AND** no contiene `ng test`

#### Scenario: Tests de admin pasan con Vitest
- **WHEN** se ejecuta `npm run test --workspace=@riff/admin`
- **THEN** Vitest ejecuta los `.test.ts` de `apps/admin/src/**`
- **AND** todos los test files pasan (incluido `src/styles/__tests__/sync.test.ts`)

### Requirement: `make test` global verde

El target `make test` del Makefile del framework SHALL completar sin errores recorriendo los workspaces.

#### Scenario: make test exit code 0
- **WHEN** se ejecuta `make test`
- **THEN** recorre backend (jest), web (vitest), admin (vitest) y html-sanitize (vitest)
- **AND** termina con exit code 0

### Requirement: Sin arquitectura Karma residual en admin

`apps/admin` SHALL no depender de Karma para su runner de tests. Si existen referencias muertas a `ng test` o config de Karma no utilizada, SHALL eliminarse.

#### Scenario: No se usa ng test ni Karma config
- **WHEN** se inspecciona `apps/admin/package.json`
- **THEN** ningún script de test invoca `ng test`
- **AND** `apps/admin` no requiere `karma.conf.js` para correr sus tests (no existe o no se usa)
