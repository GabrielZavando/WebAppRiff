# harden-ci-gate Specification

## Purpose
TBD - created by archiving change harden-ci-gate. Update Purpose after archive.
## Requirements
### Requirement: The CI project-ci job SHALL enforce a hard, blocking gate

The `.github/workflows/ci.yml` `project-ci` job SHALL replace its single `make ci` step with an explicit hard sequence covering: `bash check-refs.sh`, `make solid-lint`, `npm run lint --workspaces`, `npm run typecheck --workspaces --if-present`, `npm run build --workspaces`, `npm run test:cov --workspace=apps/backend`, `npm run test --workspace=apps/web`, `npm run test --workspace=apps/admin`, `npm run test --workspace=packages/html-sanitize`, and `npm audit --audit-level=high`. The `Makefile` SHALL NOT be modified.

#### Scenario: SC-101 — A type error fails the pipeline

- **WHEN** the `project-ci` job runs `npm run typecheck --workspaces --if-present`
- **THEN** a type error in any workspace fails the pipeline and blocks the pull request

#### Scenario: SC-102 — A build failure fails the pipeline

- **WHEN** the `project-ci` job runs `npm run build --workspaces`
- **THEN** a workspace that does not compile (nest build / astro build / ng build) fails the pipeline

#### Scenario: SC-103 — Backend coverage below 90% fails the pipeline

- **WHEN** the `project-ci` job runs `npm run test:cov --workspace=apps/backend`
- **THEN** global statements/branches/functions/lines below 90% fail the pipeline (the `apps/backend/jest.config.js` thresholds are now actually evaluated)

#### Scenario: SC-104 — npm audit runs in CI and reports without blocking

- **WHEN** the `project-ci` job runs `npm audit --audit-level=high`
- **THEN** it is executed in the pipeline and its findings are reported in the run log, but it does NOT fail the pipeline, because the repository currently carries pre-existing high/critical vulnerabilities (e.g. `astro <=7.2.7`, `vitest <=4.1.10`) whose remediation is tracked by separate upgrade tickets (V1/Q2) — making the audit blocking here would leave `main` permanently red with no migration plan in this change

#### Scenario: SC-106 — The gate is hardened without editing the Makefile

- **WHEN** the `project-ci` job is hardened with the explicit sequence
- **THEN** `refs` and `solid-lint` still run (via `bash check-refs.sh` / `make solid-lint`) and the local `make ci` target remains intact and functional

### Requirement: The root package.json SHALL expose a workspace-wide typecheck script

The repository root `package.json` SHALL declare a `typecheck` script that runs every workspace's typecheck and tolerates workspaces without one, so the CI gate has a single entry point.

#### Scenario: SC-101a — The root typecheck script orchestrates all workspaces

- **WHEN** `npm run typecheck` is executed from the repository root
- **THEN** it runs `npm run typecheck --workspaces --if-present`, invoking each workspace's typecheck without failing on workspaces that do not declare one

### Requirement: The lint scripts SHALL not mutate code in CI

The `lint` scripts in `apps/backend/package.json`, `apps/web/package.json`, `apps/admin/package.json` and `packages/html-sanitize/package.json` SHALL remove the `--fix` flag; auto-fixing SHALL be available only through a separate `lint:fix` script, so CI reports errors without rewriting source files.

#### Scenario: SC-105 — lint reports without auto-fixing

- **WHEN** the `project-ci` job runs `npm run lint --workspaces`
- **THEN** ESLint reports lint errors and DOES NOT modify the source files (the `--fix` flag is only in the local `lint:fix` scripts)

### Requirement: The CI gate SHALL not run backend tests twice

The hardened `project-ci` job SHALL run backend tests once, via `npm run test:cov --workspace=apps/backend` (which both runs the suite and evaluates the 90% thresholds), and SHALL run web and admin tests separately with their own `test` scripts, so the sequence does not exercise Jest twice.

#### Scenario: SC-107 — No duplicate backend test execution

- **WHEN** the `project-ci` job executes the hardened sequence
- **THEN** the backend suite runs exactly once (through `test:cov`), and web/admin run independently via `npm run test --workspace=apps/{web,admin}`

#### Scenario: SC-108 — The shared html-sanitize package tests keep running in the gate

- **WHEN** the `project-ci` job executes the hardened sequence
- **THEN** `npm run test --workspace=packages/html-sanitize` runs, so the shared XSS-sanitization boundary (the security-sensitive package consumed by backend and frontend) does not lose test coverage that the previous `npm test --workspaces` gate exercised

