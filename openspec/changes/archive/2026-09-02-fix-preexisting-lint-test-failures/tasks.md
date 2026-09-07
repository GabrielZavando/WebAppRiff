# Tasks: fix-preexisting-lint-test-failures

## 1. Design tokens sync (test-runner-consistency + design-tokens)

- [x] 1.1 Add `--shadow-scroll-shell: 0 10px 30px rgba(22, 32, 46, 0.3);` to the `@theme {}` block of `apps/admin/src/styles/globals.css` (matching the web value)
- [x] 1.2 Verify with a token-parity check that `apps/admin/src/styles/globals.css` and `apps/web/src/styles/globals.css` declare the same token set (no diffs)
- [x] 1.3 Run `npx vitest run` in `apps/admin` and confirm `src/styles/__tests__/sync.test.ts` passes (test-driven: failing before 1.1, green after)

## 2. Admin test runner → Vitest (test-runner-consistency)

- [x] 2.1 Change `apps/admin/package.json` `test` script from `ng test --no-watch --code-coverage` to `vitest run`
- [x] 2.2 Change `apps/admin/package.json` `test:watch` script from `ng test` to `vitest` (and keep/remove `test:watch` consistency with web)
- [x] 2.3 Confirm no remaining script references `ng test` in `apps/admin/package.json` (also removed dead karma/jasmine devDeps)
- [x] 2.4 Run `make test` and confirm all workspaces pass (backend jest, web vitest, admin vitest, html-sanitize vitest)

## 3. Backend lint — reduce `runMigration` complexity (lint-compliance)

- [x] 3.1 Keep the existing focused tests in `apps/backend/src/cli/migrate/migrate-firestore.use-case.spec.ts` as the behavior contract for `runMigration` (4 tests green baseline)
- [x] 3.2 Refactor `runMigration` in `apps/backend/src/cli/migrate/migrate-firestore.use-case.ts` to cyclomatic complexity ≤ 10 by extracting `writeCollectionDocuments`, without changing CLI behavior or lowering the `complexity` threshold
- [x] 3.3 Run `npm run lint --workspace=@riff/backend` and confirm exit 0
- [x] 3.4 Run `npm run test --workspace=@riff/backend` and confirm all suites/tests pass (incl. migrate-firestore specs)

## 4. Web lint — remove unused variables (lint-compliance)

- [x] 4.1 Remove the unused `industrialApplications` declaration in `apps/web/src/components/__tests__/IndustrialApplications.test.ts` (or use it if it is meant to be asserted); verify the test still passes
- [x] 4.2 Remove the unused `fetchMock` declaration in `apps/web/src/lib/api/__tests__/products.test.ts` (or use it); verify that spec still passes
- [x] 4.3 Run `npm run lint --workspace=@riff/web` and confirm exit 0 (no errors from `no-unused-vars`)
- [x] 4.4 Run `npm run test --workspace=@riff/web` and confirm tests pass

## 5. Admin lint — ESLint crudo (lint-compliance)

- [x] 5.1 Create `apps/admin/.eslintrc.cjs` (style `@typescript-eslint`, `complexity`/`max-lines` as warn aligned with web; `root: true`)
- [x] 5.2 Change `apps/admin/package.json` `lint` script from `ng lint --fix` to `eslint "src/**/*.ts" --fix`
- [x] 5.3 Run `npm run lint --workspace=@riff/admin` and fix any non-test lint errors introduced by having a config (iterate to exit 0)
- [x] 5.4 Confirm the Angular build still works (`make build` for admin) after removing `ng lint`

## 6. html-sanitize lint script (lint-compliance)

- [x] 6.1 Add `"lint": "eslint \"src/**/*.ts\" --fix"` to `packages/html-sanitize/package.json` (and a minimal `.eslintrc.cjs` if ESLint needs one there)
- [x] 6.2 Run `npm run lint --workspace=@riff/html-sanitize` and confirm exit 0
- [x] 6.3 Run `npm run test --workspace=@riff/html-sanitize` and confirm tests still pass

## 7. Global validation

- [x] 7.1 Run `make lint` and confirm exit 0 (all workspaces) — 0 errors, 7 advisory warnings
- [x] 7.2 Run `make test` and confirm exit 0 (all workspaces)
- [x] 7.3 Run `make build` and confirm exit 0
- [x] 7.4 Review `git status` scope: only the lint/test/token files under `apps/*` and `packages/*` changed; this change's artifacts live in `openspec/changes/fix-preexisting-lint-test-failures/`
