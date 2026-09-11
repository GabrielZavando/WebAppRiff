# Requirements — align-versions

### Req-V01: Node 24 as unified runtime

The monorepo SHALL declare Node.js 24 as its runtime across all touchpoints:
- `package.json` root `engines.node >= 24.0.0`
- `.nvmrc` containing `24`
- All 3 Dockerfiles using `FROM node:24` / `FROM node:24-slim`
- `docs/project/stack.md` and `docs/deploy-standards.md` referencing Node 24

Traceability: SC-V01, SC-V02

### Req-V02: TypeScript 5.9 uniform across workspaces

All workspaces SHALL declare `typescript ~5.9.0` as a devDependency:
- `apps/backend/package.json`
- `apps/web/package.json`
- `apps/admin/package.json`
- `packages/html-sanitize/package.json`

Traceability: SC-V03

### Req-V03: @types/node matching Node 24

All workspaces SHALL declare `@types/node ^24.0.0` as a devDependency.

Traceability: SC-V04

### Req-V04: vitest 4.x uniform across workspaces

Root, web, admin, and html-sanitize SHALL declare `vitest ^4.1.10`.
`apps/admin` SHALL have a `vitest.config.ts` file.

Traceability: SC-V05

### Req-V05: Playwright uniform across workspaces

Web and admin SHALL declare `playwright ^1.52.0`.
`apps/admin` SHALL have a `playwright.config.ts` file.

Traceability: SC-V06

### Req-V06: ESLint 9 with flat config

All 3 workspaces SHALL use `eslint ^9.0.0` with `@typescript-eslint ^8.0.0`.
Each workspace SHALL have an `eslint.config.js` (flat config) replacing the former `.eslintrc.cjs`.
The `lint` scripts SHALL NOT include `--fix` (only `lint:fix` scripts may).

Traceability: SC-V07, SC-V12

### Req-V07: NestJS 11 in backend

`apps/backend/package.json` SHALL declare `@nestjs/* ^11.2.0` for all NestJS packages.
The backend SHALL compile and all tests SHALL pass after the upgrade.

Traceability: SC-V08

### Req-V08: Angular 22 in admin

`apps/admin/package.json` SHALL declare `@angular/* ^22.0.0` for all Angular packages.
`@ngrx/signals` SHALL be `^22.0.0` and `@ngrx/store` SHALL be removed.
The admin SHALL compile and all tests SHALL pass after the upgrade.

Traceability: SC-V09

### Req-V09: Clean reproducible lockfile

After all version bumps, a fresh `npm install` (without `node_modules` or `package-lock.json`) SHALL resolve without conflicts.

Traceability: SC-V10

### Req-V10: Documentation synchronized

`docs/project/stack.md` and `docs/deploy-standards.md` SHALL reflect the new version targets.

Traceability: SC-V11
