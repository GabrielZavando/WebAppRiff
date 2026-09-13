## Context

The Riff Catálogo Digital Headless has a critical business flow (catalog → product detail → quote request) that is completely untested end-to-end. The backend `test:e2e` is empty (jest config exists but no specs; `passWithNoTests: true`). Web e2e covers only 8 landing page components. The `POST /api/v1/quotes` endpoint — documented in `api-spec.yml` and targeted by the production form — is not implemented (returns 404 for real users). Deploy smoke only curls `/health`.

The site is SSG (Astro): catalog data is baked at `astro build` time from the backend API. Full-flow e2e requires data during the build, not at runtime. The backend uses Firestore via `firebase-admin` with a well-established in-memory fake pattern in unit tests.

W2 (products pagination) is done, providing the paginated `GET /api/v1/products` with card projection and envelope `{data, error, meta}`.

## Goals / Non-Goals

**Goals:**
- Implement `POST /api/v1/quotes` (public) + `GET/PATCH` admin endpoints with TDD, following existing Clean Architecture.
- Create backend e2e test infrastructure with supertest + shared in-memory Firestore fake.
- Create web e2e for the critical flow (catalog → detail → quote) using a stub API server.
- Wire e2e into CI (project-ci) and amplify deploy smoke to cover domain endpoints.
- Update `api-spec.yml` to include `rut` in the quotes contract (required by the web form).

**Non-Goals:**
- Admin e2e (login, CRUD) — deferred to admin feature ticket.
- Firebase emulator setup — in-memory fake is the established pattern.
- Contract tests between frontend/backend (Q4 topic).
- Mocking Firestore at the emulator level — overkill for this scope.

## Decisions

### D1: Backend quotes endpoint — Clean Architecture module

**Decision**: Create `apps/backend/src/cotizaciones/` following the same `domain/application/infrastructure` split as `productos/`.

**Rationale**: Consistency with the existing codebase. The `CotizacionRepository` implements `ICotizacionRepository` (port), `CotizacionService` depends on the port (not Firestore), and the controller handles HTTP concerns. The envelope interceptor already wraps all `/api/v1/` responses.

**Alternatives considered**:
- Flat module (controller + service in one file): Rejected — inconsistent with the established pattern and harder to test in isolation.
- Reuse `productos` module: Rejected — different entity, different collection, different guards (POST is public vs. products POST requires admin).

### D2: `rut` in the contract

**Decision**: Add `rut` as optional in `CotizacionCreate` and `Cotizacion` schemas in `api-spec.yml`. The DTO uses `whitelist + forbidNonWhitelisted`, so `rut` must be in the DTO or the form submission fails with 400.

**Rationale**: The web form (`CotizacionForm.astro`) marks `rut` as required and sends it. The api-spec contract is aspirational — the form is the real consumer. Absorbing `rut` here avoids a 400 on every quote submission.

**Alternatives considered**:
- Remove `rut` from the form: Rejected — the client requires it (business need).
- Implement without DTO whitelist: Rejected — security risk (allows arbitrary field injection).

### D3: Backend e2e — in-memory Firestore fake + supertest

**Decision**: Extract the fake Firestore pattern from `producto.repository.spec.ts:1-70` into a shared `test/fake-firestore.ts`. Use `Test.createTestingModule({ imports: [AppModule] }).overrideProvider(FIRESTORE).useValue(fakeFirestore)` with supertest.

**Rationale**: This is the established pattern in the codebase. Deterministic, no external dependencies, fast CI. The fake supports `where`, `orderBy`, `select`, `offset`, `limit`, `count` — matching what the repositories use.

**Alternatives considered**:
- Firebase emulator: Rejected — heavier (firebase-tools, Java, emulator config), slower CI, non-deterministic data.
- Mock at the service layer only: Rejected — doesn't test the full HTTP pipeline (pipes, guards, envelope).

### D4: Web e2e — stub API server in Playwright webServer

**Decision**: A lightweight Node.js HTTP server (`apps/web/e2e/support/api-stub.mjs`) serves fixture data from `apps/web/e2e/fixtures/api-data.json`. Playwright `webServer` runs as an array: stub on port 3001, then `astro build` + `preview` with `NESTJS_API_URL=http://localhost:3001/api/v1` and `REQUIRE_API=true`.

**Rationale**: SSG requires data at build time. The stub gives deterministic, fast builds with real catalog data. `REQUIRE_API=true` ensures the build fails if the stub is down (honest testing). The real API contract is covered by backend e2e (supertest).

**Alternatives considered**:
- Real backend + Firebase emulator: Rejected — too heavy for Playwright webServer.
- Route interception for all API calls: Rejected — doesn't test build-time data fetching (the core SSG behavior).
- Static fixture baked into HTML: Rejected — doesn't test the real build pipeline.

### D5: Cotización form submission — page.route interception

**Decision**: The `cotizacion-flow.spec.ts` uses `page.route('**/api/v1/quotes')` to intercept the form POST and assert the payload. The `astro preview` server is static and cannot handle POST to `/api/v1/quotes`.

**Rationale**: The real POST contract is tested by backend e2e (supertest). The web e2e tests the form UI, field rendering, validation, and payload shape. Route interception is the pragmatic Playwright pattern for this.

**Alternatives considered**:
- Proxy the stub to handle POST from preview: Rejected — complex, fragile, doesn't test the real flow.
- Run the backend alongside preview: Rejected — same origin issue (different ports).

### D6: CI wiring — backend e2e + web smoke in project-ci

**Decision**: Add `npm run test:e2e --workspace=apps/backend` (fast, no deps) and `npm run test:smoke --workspace=apps/web` (with `npx playwright install --with-deps chromium` step) to `ci.yml` project-ci. Admin smoke excluded.

**Rationale**: Both suites are designed for CI: backend e2e uses in-memory fake (no Firebase), web smoke uses the stub API. Admin is excluded because it has no e2e specs (playwright would fail with "no tests found").

### D7: Deploy smoke — curl-based multi-endpoint check

**Decision**: Replace the single `curl /health` in deploy.yml with a bash script that checks `/health` (200), `/api/v1/products` (200 + data non-empty), `/api/v1/categories` (200), and `POST /api/v1/quotes` (201 with fixture body). Applied to both staging and production smoke steps.

**Rationale**: Matches `deploy-standards.md:59-68` requirements. Curl-based is lightweight and doesn't require Playwright in the deploy pipeline. Full web e2e runs in CI, not in deploy.

## Risks / Trade-offs

- **Playwright config change may break existing 8 specs**: The `webServer` array changes how the build runs. Mitigation: run all 8 existing specs locally after the change; they don't assume empty catalog.
- **Coverage threshold risk**: New `cotizaciones` module adds code without existing tests. Mitigation: TDD — write all specs first, ensure coverage ≥90% before merging.
- **Stub drift from real API**: The stub serves a curated fixture, not the real backend. Mitigation: backend e2e (supertest) covers the real API; the stub mirrors the envelope contract. Fixture derived from real seed data.
- **`passWithNoTests` removal**: If someone empties `test/`, CI fails. Mitigation: intentional — we WANT CI to fail if the e2e suite is deleted.
- **Playwright browser install in CI**: Adds ~15-40s to CI. Mitigation: acceptable for the value; browsers are cached in subsequent runs.
