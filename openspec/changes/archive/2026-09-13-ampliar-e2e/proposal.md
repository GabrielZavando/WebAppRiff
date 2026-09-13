## Why

The deploy.yml smoke only tests `/health`; real e2e flows (catalog → detail → quote) don't exist. Backend `test:e2e` is empty (`passWithNoTests: true`, no specs in `test/`). Web e2e only covers 8 landing components. This means regressions in the critical business flow (product browsing → quote request) go undetected, and the `POST /api/v1/quotes` endpoint — documented in `api-spec.yml` and targeted by the production web form — is not even implemented, causing a 404 for real users. High value: prevents regressions in the flow that generates revenue.

## What Changes

- Implement `POST /api/v1/quotes` (public, no auth) and `GET/PATCH /api/v1/quotes/:id` (admin-guarded) backend endpoints with TDD, following the existing Clean Architecture pattern (`cotizaciones/` module).
- Add `rut` optional field to the `CotizacionCreate`/`Cotizacion` contract (`api-spec.yml`) so the web form (which sends `rut` as required) doesn't fail validation with `forbidNonWhitelisted`.
- Create backend e2e test infrastructure: `apps/backend/test/` with a shared in-memory Firestore fake (`fake-firestore.ts`) and supertest-based e2e specs covering health, products, categories, subcategories, quotes CRUD, and admin guards.
- Map `npm run test:smoke` (backend) to the e2e suite; remove `passWithNoTests` from `jest-e2e.json`.
- Create a lightweight stub API server (`apps/web/e2e/support/api-stub.mjs`) that serves product/category/subcategory/quote data from a curated fixture during `astro build`, enabling Playwright e2e of the full critical flow.
- Add Playwright e2e specs: `catalog-flow.spec.ts` (listing → detail → CTA) and `cotizacion-flow.spec.ts` (form fill + intercepted POST).
- Extend CI (`ci.yml` project-ci) to run backend e2e and web smoke (with Playwright browsers).
- Extend deploy.yml smoke steps to verify `/health`, `/api/v1/products`, `/api/v1/categories`, and `POST /api/v1/quotes` (staging + production).
- Update `docs/data-model/data-model.md` with the `cotizaciones` collection shape.

## Capabilities

### New Capabilities

- `quotes-api`: Backend module for quote request capture — POST (public), GET list/detail, PATCH estado (admin-guarded), Firestore persistence, DTO validation with whitelist.
- `backend-e2e-suite`: Supertest-based e2e test infrastructure with shared in-memory Firestore fake, covering all public endpoints and admin guard behavior.
- `web-e2e-critical-flows`: Playwright e2e for catalog browsing → product detail → quote request flow, powered by a stub API server and curated fixture.
- `ci-deploy-smoke-gate`: CI wiring (backend e2e + web smoke in project-ci) and deploy.yml smoke amplification (health + products + categories + quotes).

### Modified Capabilities

<!-- No existing spec requirements change; all changes are additive -->

## Impact

- **Code**: New module `apps/backend/src/cotizaciones/` (~6-8 files: entity, port, service, repository, controller, DTOs, module). New files in `apps/backend/test/` (fake-firestore, app.e2e-spec). New files in `apps/web/e2e/` (support/api-stub.mjs, fixtures/api-data.json, catalog-flow.spec.ts, cotizacion-flow.spec.ts). Modified: `apps/backend/jest-e2e.json`, `apps/backend/package.json` (test:smoke), `apps/web/playwright.config.ts` (multi-server webServer), `apps/web/package.json` (build:e2e script), `apps/backend/src/app.module.ts` (register CotizacionesModule).
- **API**: New endpoints `POST /api/v1/quotes`, `GET /api/v1/quotes`, `GET /api/v1/quotes/:id`, `PATCH /api/v1/quotes/:id`. Contract update: `rut` optional in `CotizacionCreate`/`Cotizacion` schemas.
- **CI/CD**: `ci.yml` adds backend e2e + web smoke steps. `deploy.yml` replaces single `/health` curl with multi-endpoint smoke script.
- **Docs**: `api-spec.yml` (rut field), `data-model.md` (cotizaciones shape), `deploy-standards.md` (coherence with real smoke).
- **Dependencies**: No new external deps. Stub API server is pure Node http (zero deps).
