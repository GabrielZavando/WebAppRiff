# Tasks — align-versions

## Task 1: Update root package.json and create .nvmrc

**Priority**: high
**Layer**: tooling
**Estimate**: S
**Suggested Path**: `package.json, .nvmrc`
**Test Path**: no aplica (configuración de proyecto, no testeable unitariamente)

### Subtasks

1.1. Edit `package.json` raíz:
- `engines.node`: `">=22.12.0"` → `">=24.0.0"`
- `devDependencies.@types/node`: `"^22.0.0"` → `"^24.0.0"`
- `devDependencies.vitest`: `"^3.2.4"` → `"^4.1.10"`

1.2. Create `.nvmrc` with content `24`

### SC-V01, SC-V04

---

## Task 2: Migrate ESLint to v9 flat config — backend

**Priority**: high
**Layer**: tooling
**Estimate**: M
**Suggested Path**: `apps/backend/eslint.config.js, apps/backend/package.json`
**Test Path**: no aplica (linting config)

### Subtasks

2.1. Update `apps/backend/package.json` devDependencies:
- `eslint`: `"^8.56.0"` → `"^9.0.0"`
- `@typescript-eslint/eslint-plugin`: `"^7.0.0"` → `"^8.0.0"`
- `@typescript-eslint/parser`: `"^7.0.0"` → `"^8.0.0"`

2.2. Create `apps/backend/eslint.config.js` (flat config) equivalent to the current `.eslintrc.cjs` rules

2.3. Delete `apps/backend/.eslintrc.cjs`

2.4. Verify `npm run lint --workspace=apps/backend` passes

### SC-V07

---

## Task 3: Migrate ESLint to v9 flat config — web

**Priority**: high
**Layer**: tooling
**Estimate**: M
**Suggested Path**: `apps/web/eslint.config.js, apps/web/package.json`
**Test Path**: no aplica (linting config)

### Subtasks

3.1. Update `apps/web/package.json` devDependencies:
- `eslint`: `"^8.56.0"` → `"^9.0.0"`
- `@typescript-eslint/eslint-plugin`: `"^7.18.0"` → `"^8.0.0"`
- `@typescript-eslint/parser`: `"^7.18.0"` → `"^8.0.0"`
- `eslint-plugin-astro`: check latest compatible with ESLint 9
- `astro-eslint-parser`: check latest compatible with ESLint 9
- `eslint-plugin-sonarjs`: check latest compatible with ESLint 9

3.2. Create `apps/web/eslint.config.js` (flat config) equivalent to the current `.eslintrc.cjs` rules

3.3. Delete `apps/web/.eslintrc.cjs`

3.4. Verify `npm run lint --workspace=apps/web` passes

### SC-V07

---

## Task 4: Migrate ESLint to v9 flat config — admin

**Priority**: high
**Layer**: tooling
**Estimate**: M
**Suggested Path**: `apps/admin/eslint.config.js, apps/admin/package.json`
**Test Path**: no aplica (linting config)

### Subtasks

4.1. Update `apps/admin/package.json` devDependencies:
- `eslint`: `"^8.56.0"` → `"^9.0.0"`
- `@typescript-eslint/eslint-plugin`: `"^7.0.0"` → `"^8.0.0"`
- `@typescript-eslint/parser`: `"^7.0.0"` → `"^8.0.0"`

4.2. Create `apps/admin/eslint.config.js` (flat config) equivalent to the current `.eslintrc.cjs` rules

4.3. Delete `apps/admin/.eslintrc.cjs`

4.4. Verify `npm run lint --workspace=apps/admin` passes

### SC-V07

---

## Task 5: Upgrade NestJS 10 → 11 in backend

**Priority**: high
**Layer**: infrastructure
**Estimate**: M
**Suggested Path**: `apps/backend/package.json, apps/backend/src/**`
**Test Path**: `apps/backend/src/**/*.spec.ts`

### Subtasks

5.1. Update `apps/backend/package.json` dependencies:
- `@nestjs/common`: `"^10.0.0"` → `"^11.2.0"`
- `@nestjs/core`: `"^10.0.0"` → `"^11.2.0"`
- `@nestjs/platform-express`: `"^10.0.0"` → `"^11.2.0"`
- `@nestjs/throttler`: `"^6.0.0"` → check latest v11-compatible
- `@nestjs/config`: `"^3.0.0"` → check latest v11-compatible

5.2. Update `apps/backend/package.json` devDependencies:
- `@nestjs/cli`: `"^10.0.0"` → `"^11.2.0"`
- `@nestjs/schematics`: `"^10.0.0"` → `"^11.2.0"`
- `@nestjs/testing`: `"^10.0.0"` → `"^11.2.0"`

5.3. Add `engines.node >= 24.0.0` to `apps/backend/package.json`

5.4. Update `typescript` to `~5.9.0`

5.5. Update `@types/node` to `^24.0.0`

5.6. Fix any breaking changes from NestJS 11 migration (check migration guide)

5.7. Verify `npm run build --workspace=apps/backend` passes

5.8. Verify `npm run test --workspace=apps/backend` passes

### SC-V08

---

## Task 6: Upgrade Angular 18 → 22 in admin

**Priority**: high
**Layer**: infrastructure
**Estimate**: L
**Suggested Path**: `apps/admin/package.json, apps/admin/src/**, apps/admin/angular.json`
**Test Path**: `apps/admin/src/**/*.spec.ts`

### Subtasks

6.1. Update `apps/admin/package.json` dependencies:
- All `@angular/*`: `"^18.0.0"` → `"^22.0.0"`
- `@angular/fire`: `"^18.0.0"` → `"^22.0.0"`
- `@ngrx/signals`: `"^18.0.0"` → `"^22.0.0"`
- **Remove `@ngrx/store`** entirely

6.2. Update `apps/admin/package.json` devDependencies:
- `@angular-devkit/build-angular`: `"^18.0.0"` → `"^22.0.0"`
- `@angular/cli`: `"^18.0.0"` → `"^22.0.0"`
- `@angular/compiler-cli`: `"^18.0.0"` → `"^22.0.0"`

6.3. Add `engines.node >= 24.0.0` to `apps/admin/package.json`

6.4. Update `typescript` to `~5.9.0`

6.5. Update `@types/node` to `^24.0.0`

6.6. Search for any `@ngrx/store` imports in `apps/admin/src` and migrate to `@ngrx/signals`

6.7. Fix any Angular 19/20/21/22 breaking changes (check migration guides, run `ng update` if possible)

6.8. Verify `npm run build --workspace=apps/admin` passes

6.9. Verify `npm run test --workspace=apps/admin` passes

### SC-V09

---

## Task 7: Create missing admin test configs

**Priority**: medium
**Layer**: tooling
**Estimate**: S
**Suggested Path**: `apps/admin/vitest.config.ts, apps/admin/playwright.config.ts`
**Test Path**: no aplica (config creation)

### Subtasks

7.1. Create `apps/admin/vitest.config.ts` with minimal config

7.2. Create `apps/admin/playwright.config.ts` with basic config

7.3. Update `apps/admin/package.json` devDependencies:
- `vitest`: `"^1.0.0"` → `"^4.1.10"`
- `playwright`: `"^1.40.0"` → `"^1.52.0"`

7.4. Verify `npm run test --workspace=apps/admin` passes

7.5. Verify `npm run test:smoke --workspace=apps/admin` starts (or passes if backend is available)

### SC-V05, SC-V06

---

## Task 8: Align web workspace versions

**Priority**: medium
**Layer**: tooling
**Estimate**: S
**Suggested Path**: `apps/web/package.json`
**Test Path**: `apps/web/src/**/*.test.ts`

### Subtasks

8.1. Update `apps/web/package.json` devDependencies:
- `@types/node`: `"^22.0.0"` → `"^24.0.0"`
- `vitest`: already `"^4.1.10"` — verify no change needed
- `playwright`: `"^1.62.1"` → `"^1.52.0"` (or keep if already >= 1.52)

8.2. Verify `npm run test --workspace=apps/web` passes

### SC-V04, SC-V05, SC-V06

---

## Task 9: Align html-sanitize workspace versions

**Priority**: medium
**Layer**: tooling
**Estimate**: S
**Suggested Path**: `packages/html-sanitize/package.json`
**Test Path**: `packages/html-sanitize/src/**/*.test.ts`

### Subtasks

9.1. Update `packages/html-sanitize/package.json` devDependencies:
- `typescript`: `"^5.3.0"` → `"~5.9.0"`
- Add `@types/node`: `"^24.0.0"` if not present

9.2. Verify `npm run test --workspace=packages/html-sanitize` passes

### SC-V03, SC-V04

---

## Task 10: Update Dockerfiles to Node 24

**Priority**: medium
**Layer**: infrastructure
**Estimate**: S
**Suggested Path**: `apps/backend/Dockerfile, apps/web/Dockerfile, apps/admin/Dockerfile`
**Test Path**: no aplica (Docker config)

### Subtasks

10.1. `apps/backend/Dockerfile`: change `FROM node:22` → `FROM node:24` and `FROM node:22-slim` → `FROM node:24-slim`

10.2. `apps/web/Dockerfile`: change `FROM node:22` → `FROM node:24`

10.3. `apps/admin/Dockerfile`: change `FROM node:22` → `FROM node:24`

### SC-V02

---

## Task 11: Update documentation

**Priority**: medium
**Layer**: docs
**Estimate**: S
**Suggested Path**: `docs/project/stack.md, docs/deploy-standards.md`
**Test Path**: no aplica (documentation)

### Subtasks

11.1. Update `docs/project/stack.md`:
- "Node.js 22" → "Node.js 24"
- "NestJS 10+" → "NestJS 11+"
- "Angular 18+" → "Angular 22+"
- "TypeScript 5+ strict" — keep as-is (still accurate)
- "ESLint 8" → "ESLint 9" if referenced

11.2. Update `docs/deploy-standards.md`:
- "Node.js 22" → "Node.js 24"
- "corregir CI que usa node 24" → remove this note (CI now matches)

11.3. Update `apps/backend-standards.md`:
- "Runtime: Node.js 20" → "Runtime: Node.js 24"
- "Framework: NestJS 10+" → "Framework: NestJS 11+"

11.4. Update `apps/frontend-standards.md`:
- "Angular 18+" → "Angular 22+"

### SC-V11

---

## Task 12: Regenerate lockfile and full verification

**Priority**: high
**Layer**: tooling
**Estimate**: M
**Suggested Path**: `package-lock.json`
**Test Path**: no aplica (verification)

### Subtasks

12.1. Delete `node_modules` and `package-lock.json`

12.2. Run `npm install` to regenerate clean lockfile

12.3. Verify `npm run lint --workspaces` passes

12.4. Verify `npm run typecheck --workspaces --if-present` passes

12.5. Verify `npm run build --workspaces` passes

12.6. Verify `npm run test --workspace=apps/backend` passes

12.7. Verify `npm run test --workspace=apps/web` passes

12.8. Verify `npm run test --workspace=apps/admin` passes

12.9. Verify `npm run test --workspace=packages/html-sanitize` passes

12.10. Run `bash check-refs.sh` — expect 0 errors

12.11. Run `bash specboot.sh --ci` — expect 0 errors

### SC-V10, SC-V03, SC-V07, SC-V08, SC-V09

---

## Mandatory Steps

### Pre-implementación

- [ ] La **rama activa** sigue la convención vigente del proyecto (ej. `feature/*`, `fix/*`); trabajar sobre ella, nunca directamente sobre la rama principal.
- [ ] Estado **git limpio**: sin cambios sin commitear (ni staged) antes de empezar; si hay trabajo en curso, resolverlo primero.

### Durante la implementación

- [ ] **Test nuevo que falla antes de implementar (RED)**: escribir el test del escenario (`SC-NNN`) y verificar que falla antes de escribir código de producción.
- [ ] Ejecutar los **tests unitarios del módulo** tocado mientras se itera (ciclo RED-GREEN-REFACTOR), no solo al final.

### Post-implementación

- [ ] **Ejecutar `verify`**: la verificación del change corre y produce evidencia persistente (`openspec/state/verify-results.json`).
- [ ] **Ejecutar `adversarial-review`**: la auditoría adversarial corre y produce veredicto persistente (`openspec/state/adversarial-result.json`).

> Ambos pasos post alimentan los gates duros de `/commit` (M-901): sin `PASS` + `SHIP` vigentes para el change activo, el commit bloquea.
