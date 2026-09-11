# Spec — align-versions

## ADDED Requirements

### Requirement: The monorepo SHALL unify Node.js 24 as its runtime

All references to Node.js across the monorepo SHALL converge to Node.js 24 LTS (Krypton).

#### Scenario: SC-V01 — Node 24 as unified runtime

- **WHEN** a developer runs `node --version` after following `.nvmrc`
- **THEN** Node 24.x is active
- **AND** `package.json` root declares `engines.node >= 24.0.0`
- **AND** `.nvmrc` exists with content `24`

#### Scenario: SC-V02 — Dockerfiles use Node 24

- **WHEN** `docker build` is executed for any of the 3 services
- **THEN** the image is built with `node:24` or `node:24-slim` as the base

### Requirement: The monorepo SHALL use TypeScript 5.9 uniformly

All workspaces SHALL declare the same TypeScript version floor.

#### Scenario: SC-V03 — TypeScript unified

- **WHEN** `npm run typecheck --workspaces` is executed
- **THEN** all workspaces compile without errors with TypeScript ~5.9.0

### Requirement: @types/node SHALL match Node 24

All workspaces SHALL declare `@types/node ^24.0.0`.

#### Scenario: SC-V04 — @types/node consistent

- **WHEN** typecheck is executed
- **THEN** runtime types match Node 24

### Requirement: vitest SHALL be uniform at v4

All workspaces using vitest SHALL declare `^4.1.10`.

#### Scenario: SC-V05 — vitest unified

- **WHEN** `npm run test --workspaces` is executed
- **THEN** all tests run with vitest 4.x
- **AND** `apps/admin/vitest.config.ts` exists

### Requirement: Playwright SHALL be uniform

Web and admin SHALL declare the same Playwright version.

#### Scenario: SC-V06 — Playwright unified

- **WHEN** e2e tests are executed
- **THEN** both workspaces use the same runner version
- **AND** `apps/admin/playwright.config.ts` exists

### Requirement: ESLint 9 with flat config

All 3 workspaces SHALL use ESLint 9 with flat config.

#### Scenario: SC-V07 — ESLint 9 flat config

- **WHEN** `npm run lint --workspaces` is executed
- **THEN** linting passes with flat config
- **AND** no `.eslintrc.cjs` files remain

### Requirement: NestJS 11 in backend

The backend SHALL use NestJS 11.

#### Scenario: SC-V08 — NestJS 11 compiles

- **WHEN** `npm run build --workspace=apps/backend` is executed
- **THEN** the backend compiles and tests pass

### Requirement: Angular 22 in admin

The admin SHALL use Angular 22 with @ngrx/signals 22.

#### Scenario: SC-V09 — Angular 22 compiles

- **WHEN** `npm run build --workspace=apps/admin` is executed
- **THEN** the admin compiles
- **AND** `@ngrx/store` is not in dependencies

### Requirement: Clean reproducible lockfile

After all version bumps, the lockfile SHALL be regenerated cleanly.

#### Scenario: SC-V10 — Fresh install resolves cleanly

- **WHEN** a fresh `npm install` is executed without node_modules or package-lock.json
- **THEN** all dependencies resolve without conflicts

### Requirement: Documentation synchronized

All documentation files SHALL reflect the updated version targets.

#### Scenario: SC-V11 — Docs match code

- **WHEN** a developer reads `stack.md` or `deploy-standards.md`
- **THEN** documented versions match the actual codebase
