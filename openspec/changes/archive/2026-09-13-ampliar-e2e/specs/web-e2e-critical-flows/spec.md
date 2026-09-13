## ADDED Requirements

### Requirement: Stub API server serves catalog data for Playwright build

The system SHALL provide a lightweight Node.js HTTP server (`apps/web/e2e/support/api-stub.mjs`) that serves product, category, subcategory, and quote data from a curated fixture (`apps/web/e2e/fixtures/api-data.json`) in the standard envelope format `{ data, error, meta }`.

#### Scenario: Stub serves products with pagination envelope

- **WHEN** a GET request is made to `http://localhost:3001/api/v1/products?page=1&limit=24`
- **THEN** the response is `{ "data": [...products...], "error": null, "meta": { "page": 1, "limit": 24, "total": N } }`

#### Scenario: Stub serves product by slug

- **WHEN** a GET request is made to `http://localhost:3001/api/v1/products/slug/{known-slug}`
- **THEN** the response is `{ "data": { ...product... } }` with the matching product

#### Scenario: Stub serves active categories

- **WHEN** a GET request is made to `http://localhost:3001/api/v1/categories?activa=true`
- **THEN** the response is `{ "data": [...categories...] }`

#### Scenario: Stub serves active subcategories

- **WHEN** a GET request is made to `http://localhost:3001/api/v1/subcategories?activa=true`
- **THEN** the response is `{ "data": [...subcategories...] }`

#### Scenario: Stub accepts POST /api/v1/quotes

- **WHEN** a POST request is made to `http://localhost:3001/api/v1/quotes` with valid JSON body
- **THEN** the response is HTTP 201 with `{ "data": { ...quote, "id": "<auto>", "estado": "pendiente", "creadoEn": "<timestamp>" } }`

#### Scenario: Stub health check

- **WHEN** a GET request is made to `http://localhost:3001/health`
- **THEN** the response is HTTP 200

### Requirement: Playwright config uses multi-server webServer

The `apps/web/playwright.config.ts` SHALL configure `webServer` as an array with two entries: the stub API server (port 3001) and the astro build + preview (port 4321). The build command SHALL set `NESTJS_API_URL=http://localhost:3001/api/v1` and `REQUIRE_API=true`.

#### Scenario: Build fails if stub is down

- **WHEN** `REQUIRE_API=true` and the stub API server is not running
- **THEN** `astro build` exits with non-zero status (catalog empty → build failure)

#### Scenario: Build succeeds with stub

- **WHEN** the stub API server is running on port 3001 and `REQUIRE_API=true`
- **THEN** `astro build` completes successfully and the catalog pages contain product data from the fixture

### Requirement: Curated e2e fixture

The system SHALL provide `apps/web/e2e/fixtures/api-data.json` containing a curated subset of products (8-10 items with real slugs, titles, descriptions), categories, and subcategories derived from `data/seed-*.json`, formatted as API envelope responses.

#### Scenario: Fixture has published products

- **WHEN** the fixture is loaded
- **THEN** it contains at least 8 products with `publicado: true`, each with a unique `slug`, `titulo`, `descripcionBreve`, `categoriaId`, `subcategoriaId`

#### Scenario: Fixture has categories and subcategories

- **WHEN** the fixture is loaded
- **THEN** it contains at least 3 categories and at least 3 subcategories with `activa: true`

### Requirement: catalog-flow.spec.ts tests listing → detail → CTA

The Playwright spec `apps/web/e2e/catalog-flow.spec.ts` SHALL verify the critical flow from catalog listing to product detail to quote request CTA.

#### Scenario: Catalog page renders product cards

- **WHEN** a user navigates to `/productos`
- **THEN** the page renders a grid of product cards (count > 0) and each card has a link to `/productos/{slug}`

#### Scenario: Click card navigates to product detail

- **WHEN** a user clicks on a product card link
- **THEN** the browser navigates to `/productos/{slug}` and the page renders an `<h1>` with the product title

#### Scenario: Detail page has SOLICITAR COTIZACIÓN CTA

- **WHEN** the product detail page is rendered
- **THEN** a link with text "SOLICITAR COTIZACIÓN" is visible and its `href` is `/cotizacion?producto={slug}`

#### Scenario: Click CTA navigates to cotización page

- **WHEN** a user clicks the "SOLICITAR COTIZACIÓN" link
- **THEN** the browser navigates to `/cotizacion?producto={slug}` and the cotización form is visible

### Requirement: cotizacion-flow.spec.ts tests form submission

The Playwright spec `apps/web/e2e/cotizacion-flow.spec.ts` SHALL verify the quote request form renders correctly and submits successfully (via route interception).

#### Scenario: Cotización form renders all fields

- **WHEN** a user navigates to `/cotizacion?producto={slug}`
- **THEN** the page renders a form with fields: NOMBRE COMPLETO, CORREO ELECTRÓNICO, TELÉFONO, NOMBRE DE LA EMPRESA, RUT DE LA EMPRESA, MENSAJE, and a submit button "ENVIAR SOLICITUD"

#### Scenario: Form submission intercepted with correct payload

- **WHEN** a user fills all form fields and clicks "ENVIAR SOLICITUD", and `page.route('**/api/v1/quotes')` intercepts the POST returning 201
- **THEN** the intercepted request body contains fields `nombre`, `email`, `telefono`, `nombre_empresa`, `rut`, `mensaje` with the values entered by the user

### Requirement: Existing 8 landing specs remain green

The 8 existing Playwright specs in `apps/web/e2e/` (hero-banner, site-header, site-header-scroll, top-header, search-form, panel-home, services-section, solution-section) SHALL continue to pass with the stub API present in the webServer.

#### Scenario: Landing specs pass with stub

- **WHEN** `npx playwright test --project=chromium` is executed with the stub API running
- **THEN** all 8 existing landing specs pass (no failures)

### Requirement: npm run test:smoke runs full Playwright suite

The `test:smoke` script in `apps/web/package.json` SHALL execute `playwright test --project=chromium` (same as now), which runs both existing landing specs and new flow specs.

#### Scenario: test:smoke runs all specs

- **WHEN** `npm run test:smoke` is executed in the web workspace
- **THEN** all Playwright specs (landing + flows) are executed
