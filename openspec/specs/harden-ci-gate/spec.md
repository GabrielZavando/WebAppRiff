# harden-ci-gate Specification

## Purpose
Endurecimiento del gate de CI: secuencia explícita y bloqueante (validación de OpenSpec, lint, typecheck, build, tests con cobertura 90% del backend y audit bloqueante), lint sin --fix y sin ejecutar la suite del backend dos veces.
## Requirements
### Requirement: The CI gate SHALL enforce a hard, blocking sequence

The project gate (`make ci`, invoked by `.github/workflows/ci.yml`) SHALL run an explicit hard sequence covering: `npx openspec validate --all --strict` (validación de specs/changes — reemplaza la validación estructural de Specboot y `check-refs.sh`), `npm run lint --workspaces`, `npm run typecheck --workspaces --if-present`, `npm run build --workspaces`, `npm run test:cov --workspace=apps/backend`, `npm run test --workspace=apps/web`, `npm run test --workspace=apps/admin`, `npm run test --workspace=packages/html-sanitize`, y `npm run audit`. El `Makefile` es del proyecto (no del framework).

#### Scenario: SC-101 — A type error fails the pipeline

- **WHEN** el gate CI corre `npm run typecheck --workspaces --if-present`
- **THEN** un type error en cualquier workspace falla el pipeline y bloquea el pull request

#### Scenario: SC-102 — A build failure fails the pipeline

- **WHEN** el gate CI corre `npm run build --workspaces`
- **THEN** un workspace que no compila (nest build / astro build / ng build) falla el pipeline

#### Scenario: SC-103 — Backend coverage below 90% fails the pipeline

- **WHEN** el gate CI corre `npm run test:cov --workspace=apps/backend`
- **THEN** global statements/branches/functions/lines below 90% fail the pipeline (the `apps/backend/jest.config.js` thresholds are now actually evaluated)

#### Scenario: SC-104 — npm audit runs blocking in CI

- **WHEN** el gate CI corre `npm run audit`
- **THEN** se ejecuta el script bloqueante `scripts/audit.mjs` (con suppressions vía `npm-audit-suppressions.json`), que falla el pipeline ante high/critical no suprimidas (ver capability `audit-blocking`)

#### Scenario: SC-106 — The gate no longer depends on Specboot integrity scripts

- **WHEN** el gate CI se ejecuta tras la migración Specboot → OpenSpec
- **THEN** `bash check-refs.sh` y `make solid-lint` ya NO forman parte del gate (scripts y target eliminados), y la validación de integridad de specs corre vía `npx openspec validate --all --strict`

### Requirement: The root package.json SHALL expose a workspace-wide typecheck script

The repository root `package.json` SHALL declare a `typecheck` script that runs every workspace's typecheck and tolerates workspaces without one, so the CI gate has a single entry point.

#### Scenario: SC-101a — The root typecheck script orchestrates all workspaces

- **WHEN** `npm run typecheck` is executed from the repository root
- **THEN** it runs `npm run typecheck --workspaces --if-present`, invoking each workspace's typecheck without failing on workspaces that do not declare one

### Requirement: The lint scripts SHALL not mutate code in CI

The `lint` scripts in `apps/backend/package.json`, `apps/web/package.json`, `apps/admin/package.json` and `packages/html-sanitize/package.json` SHALL remove the `--fix` flag; auto-fixing SHALL be available only through a separate `lint:fix` script, so CI reports errors without rewriting source files.

#### Scenario: SC-105 — lint reports without auto-fixing

- **WHEN** el gate CI corre `npm run lint --workspaces`
- **THEN** ESLint reporta errores y NO modifica los archivos fuente (el flag `--fix` solo existe en los scripts locales `lint:fix`)

### Requirement: The CI gate SHALL not run backend tests twice

El gate CI SHALL correr los tests del backend una sola vez, vía `npm run test:cov --workspace=apps/backend` (que ejecuta la suite y evalúa los umbrales 90%), y SHALL correr web y admin por separado con sus propios scripts `test`, para no ejercitar Jest dos veces.

#### Scenario: SC-107 — No duplicate backend test execution

- **WHEN** el gate CI ejecuta la secuencia endurecida
- **THEN** la suite del backend corre exactamente una vez (vía `test:cov`), y web/admin corren independientemente vía `npm run test --workspace=apps/{web,admin}`

#### Scenario: SC-108 — The shared html-sanitize package tests keep running in the gate

- **WHEN** el gate CI ejecuta la secuencia endurecida
- **THEN** `npm run test --workspace=packages/html-sanitize` corre, de modo que la frontera compartida de sanitización XSS (paquete consumido por backend y frontend) no pierde cobertura de tests que el gate previo ejercitaba

