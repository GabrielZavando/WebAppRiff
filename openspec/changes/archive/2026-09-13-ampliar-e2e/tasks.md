## 1. Cotizaciones Backend Module (TDD)

- [x] 1.1 Create `apps/backend/src/cotizaciones/domain/cotizacion.entity.ts` — entity `Cotizacion` with fields: `id`, `nombre`, `email`, `telefono`, `nombre_empresa`, `rut`, `mensaje`, `estado: 'pendiente' | 'atendida'`, `creadoEn`, `actualizadoEn`. Types only, no deps.
- [x] 1.2 Create `apps/backend/src/cotizaciones/domain/icotizacion.repository.ts` — port interface with `create(input)`, `findAll(filter)`, `findById(id)`, `updateEstado(id, estado)`. Dependency: entity types only.
- [x] 1.3 RED: Write `cotizacion.entity.spec.ts` — verify entity types compile and default estado is `pendiente`. Verify `fail` before implementation.
- [x] 1.4 GREEN: Implement entity and port (types compile, test passes).
- [x] 1.5 Create `apps/backend/src/cotizaciones/application/cotizacion.service.ts` — service implementing business logic, depends on `ICotizacionRepository` port (NOT Firestore).
- [x] 1.6 RED: Write `cotizacion.service.spec.ts` — test create, findAll with estado filter, findById, updateEstado using a mock repository. Verify `fail` before implementation.
- [x] 1.7 GREEN: Implement service.
- [x] 1.8 Create `apps/backend/src/cotizaciones/infrastructure/cotizacion.repository.ts` — Firestore implementation, collection `cotizaciones`, same pattern as `producto.repository.ts`.
- [x] 1.9 RED: Write `cotizacion.repository.spec.ts` — test CRUD against in-memory Firestore fake (reuse pattern from `producto.repository.spec.ts`). Verify `fail` before implementation.
- [x] 1.10 GREEN: Implement repository.
- [x] 1.11 Create `apps/backend/src/cotizaciones/infrastructure/cotizacion-create.dto.ts` — DTO with `whitelist: true`, `forbidNonWhitelisted: true`. Fields: `nombre` (string, required), `email` (IsEmail, required), `telefono` (string, optional), `nombre_empresa` (string, required), `rut` (string, optional), `mensaje` (string, required).
- [x] 1.12 Create `apps/backend/src/cotizaciones/infrastructure/cotizacion-update.dto.ts` — DTO with `estado` field (IsIn `['pendiente', 'atendida']`).
- [x] 1.13 RED: Write `cotizacion-create.dto.spec.ts` — verify validation: valid body passes, missing required → 400, extra fields → 400, `rut` optional (accepted). Verify `fail` before implementation.
- [x] 1.14 GREEN: Implement DTOs.
- [x] 1.15 Create `apps/backend/src/cotizaciones/infrastructure/cotizacion.controller.ts` — `@Controller('quotes')`: `POST` (public, no guard) → 201, `GET` (FirebaseAuthGuard + RolesGuard superadmin/admin) with estado filter + pagination, `GET :id` (admin), `PATCH :id` (admin/editor). Same pattern as `categoria.controller.ts`.
- [x] 1.16 RED: Write `cotizacion.controller.spec.ts` — test all 4 routes with mocked service (201, 200, 401/403 behavior). Verify `fail` before implementation.
- [x] 1.17 GREEN: Implement controller.
- [x] 1.18 Create `apps/backend/src/cotizaciones/cotizaciones.module.ts` — register entity, service, repository, controller. Export service.
- [x] 1.19 Register `CotizacionesModule` in `apps/backend/src/app.module.ts` imports array.
- [x] 1.20 Update `docs/api/api-spec.yml` — add `rut` optional to `CotizacionCreate` and `Cotizacion` schemas (lines 591-627).
- [x] 1.21 Update `docs/data-model/data-model.md` — add `cotizaciones` collection documentation with fields, types, and default values.

## 2. Shared Firestore Fake + Fixture for Backend E2E

- [x] 2.1 Create `apps/backend/test/fake-firestore.ts` — extract the in-memory fake pattern from `producto.repository.spec.ts:1-70` into a reusable module: Map store, `makeDoc`, `collectionRef` with `where/orderBy/select/offset/limit/count/get` chain. Export `createFakeFirestore(seedData)`.
- [x] 2.2 Create `apps/backend/test/fixtures/seed-data.ts` — minimal seed fixture: 2-3 categories, 2-3 subcategories, 6-8 products (publicado: true with real slugs), 2-3 quotes. Derived from `data/seed-*.json` but minimal for fast e2e.
- [x] 2.3 RED: Write `fake-firestore.spec.ts` — verify the fake supports all repository operations (where, orderBy, select, offset, limit, count). Verify `fail` before implementation.
- [x] 2.4 GREEN: Implement fake Firestore and seed fixture.

## 3. Backend E2E Suite (Supertest)

- [x] 3.1 Create `apps/backend/test/app.e2e-spec.ts` — `Test.createTestingModule({ imports: [AppModule] }).overrideProvider(FIRESTORE).useValue(createFakeFirestore(seedData)).compile()`, then `supertest(app.getHttpServer())`.
- [x] 3.2 RED: Write test for `GET /health` → 200, `{ status: 'ok', firebase: 'up' }`. Verify `fail`.
- [x] 3.3 GREEN: (health works out of the box with fake Firestore ping).
- [x] 3.4 RED: Write test for `GET /api/v1/products?page=1&limit=24` → 200, envelope `{data, meta: {page, limit, total}}`, card projection (no full galeria). Verify `fail`.
- [x] 3.5 GREEN: (pagination/projection already implemented in W2).
- [x] 3.6 RED: Write test for `GET /api/v1/products/slug/{known-slug}` → 200, full product. Verify `fail`.
- [x] 3.7 GREEN: (slug endpoint already implemented in W2).
- [x] 3.8 RED: Write test for `GET /api/v1/categories?activa=true` → 200, `{data: [...]}` with only active categories. Verify `fail`.
- [x] 3.9 GREEN: (categories already implemented).
- [x] 3.10 RED: Write test for `GET /api/v1/subcategories?activa=true` → 200. Verify `fail`.
- [x] 3.11 GREEN: (subcategories already implemented).
- [x] 3.12 RED: Write test for `POST /api/v1/quotes` with valid body → 201, `{data: {id, nombre, email, ..., estado: 'pendiente', creadoEn}}`. Verify `fail`.
- [x] 3.13 GREEN: Implement via T1-1.19 (quotes module).
- [x] 3.14 RED: Write test for `POST /api/v1/quotes` with missing required fields → 400. Verify `fail`.
- [x] 3.15 GREEN: (DTO validation handles this).
- [x] 3.16 RED: Write test for `GET /api/v1/quotes` without token → 401. Verify `fail`.
- [x] 3.17 GREEN: (FirebaseAuthGuard handles this).
- [x] 3.18 RED: Write test for `GET /api/v1/quotes` with editor role token → 403. Verify `fail`.
- [x] 3.19 GREEN: (RolesGuard handles this).
- [x] 3.20 Update `apps/backend/jest-e2e.json` — remove `passWithNoTests: true`.
- [x] 3.21 Update `apps/backend/package.json` — change `test:smoke` script from `jest --testPathPattern=smoke` to `jest --config jest-e2e.json` (maps to e2e suite).

## 4. Stub API + Fixture + Playwright Config for Web E2E

- [x] 4.1 Create `apps/web/e2e/fixtures/api-data.json` — curated fixture with 8-10 products (real slugs/titles from seed), 3+ categories, 3+ subcategories, formatted as API envelope responses `{data, meta}`.
- [x] 4.2 Create `apps/web/e2e/support/api-stub.mjs` — Node.js HTTP server (no deps) on port 3001: serves `/health` (200), `/api/v1/products` (paginated envelope), `/api/v1/products/slug/:slug`, `/api/v1/categories?activa=true`, `/api/v1/subcategories?activa=true`, `POST /api/v1/quotes` (201). Reads fixture from `../fixtures/api-data.json`.
- [x] 4.3 Add `build:e2e` script to `apps/web/package.json`: `NESTJS_API_URL=http://localhost:3001/api/v1 REQUIRE_API=true npm run build && npm run preview`.
- [x] 4.4 Update `apps/web/playwright.config.ts` — change `webServer` from single entry to array: `[{command: 'node e2e/support/api-stub.mjs', url: 'http://localhost:3001/health'}, {command: 'npm run build:e2e', url: 'http://localhost:4321', timeout: 120_000}]`. Keep `reuseExistingServer: !CI`.

## 5. Web E2E Critical Flow Specs

- [x] 5.1 RED: Create `apps/web/e2e/catalog-flow.spec.ts` — test: navigate to `/productos`, assert grid has cards (>0), assert card links to `/productos/{slug}`, click card → detail page with `<h1>` = product title, assert "SOLICITAR COTIZACIÓN" CTA visible with href `/cotizacion?producto={slug}`, click CTA → `/cotizacion?producto={slug}` with form visible. Verify `fail` before stub+fixture are complete.
- [x] 5.2 GREEN: Stub + fixture + Playwright config working; catalog-flow spec passes.
- [x] 5.3 RED: Create `apps/web/e2e/cotizacion-flow.spec.ts` — test: navigate to `/cotizacion?producto={slug}`, assert form renders all fields (NOMBRE COMPLETO, CORREO ELECTRÓNICO, TELÉFONO, NOMBRE DE LA EMPRESA, RUT DE LA EMPRESA, MENSAJE) and submit button, fill all fields, setup `page.route('**/api/v1/quotes')` to intercept POST and return 201, submit form, assert intercepted request body contains `nombre`, `email`, `telefono`, `nombre_empresa`, `rut`, `mensaje`. Verify `fail`.
- [x] 5.4 GREEN: cotizacion-flow spec passes.
- [x] 5.5 Run all 8 existing landing specs to verify they still pass with stub present. Fix any regressions.
- [x] 5.6 BUG FIX (found by e2e): `CotizacionForm.astro` sent `name="empresa"` but the backend contract requires `nombre_empresa` — the public form would 400 on submit. Renamed the field and updated `CotizacionForm.test.ts`.
- [x] 5.7 Rehabilitate pre-existing landing e2e rot (never run in CI): selectors `bg-secondary-dark`→`bg-primary-deep` (services), `bg-bg`→`bg-bg:has(h3)` (solution), heading counts 3h2→4h2 (team-section), hero h1 text-5xl/7xl sizes, panel overlap only on mobile (current design), search-form categories from stub, `/cotizacion` has no search bar, `/productos` heading "Catálogo de Productos", lazy-loaded image waits.

## 6. CI + Deploy Wiring + Docs

- [x] 6.1 Update `.github/workflows/ci.yml` → `project-ci` job: add step `npx playwright install --with-deps chromium` before web tests, add step `npm run test:e2e --workspace=apps/backend` after backend unit tests, add step `npm run test:smoke --workspace=apps/web` after web unit tests. Do NOT add admin smoke.
- [x] 6.2 Update `.github/workflows/deploy.yml` → `deploy-staging` smoke step: replace single `curl /health` with a script that checks `GET /health` (200), `GET /api/v1/products` (200 + data non-empty), `GET /api/v1/categories` (200), `POST /api/v1/quotes` with `{"nombre":"test","email":"test@test.com","nombre_empresa":"test","mensaje":"smoke"}` (201).
- [x] 6.3 Update `.github/workflows/deploy.yml` → `deploy-production` smoke step: mirror the staging smoke script.
- [x] 6.4 Verify `bash check-refs.sh` passes with 0 errors.
- [x] 6.5 Verify `bash specboot.sh --ci` passes with 0 errors.

## Mandatory Steps

### Pre-implementación

- [x] La **rama activa** sigue la convención vigente del proyecto (`feature/Q3-ampliar-e2e`); trabajar sobre ella, nunca directamente sobre la rama principal.
- [x] Estado **git limpio**: sin cambios sin commitear (ni staged) antes de empezar.

### Durante la implementación

- [x] **Test nuevo que falla antes de implementar (RED)**: escribir el test del escenario (`SC-NNN`) y verificar que falla antes de escribir código de producción.
- [x] Ejecutar los **tests unitarios del módulo** tocado mientras se itera (ciclo RED-GREEN-REFACTOR), no solo al final.

### Post-implementación

- [x] **Ejecutar `verify`**: la verificación del change corre y produce evidencia persistente (`openspec/state/verify-results.json`).
- [x] **Ejecutar `adversarial-review`**: la auditoría adversarial corre y produce veredicto persistente (`openspec/state/adversarial-result.json`).
