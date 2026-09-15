# add-frontend-smoke-and-nginx-hardening Specification — DELTA

> Este delta añade los smoke tests post-deploy de los frontends (API/Astro/Angular)
> y el hardening de caché + seguridad de nginx en web y admin, más la
> documentación de rollback y migración de URLs. Añade una nueva capacidad
> `add-frontend-smoke-and-nginx-hardening`.

## ADDED Requirements

### Requirement: Deploy smoke tests SHALL validate API, Astro and Angular
The project SHALL provide smoke-test scripts that validate the deployed API
(`/health` with `status` ok and `firebase:up`, plus `/api/v1/products`,
`/api/v1/categories`, `/api/v1/subcategories` returning 200 with a data array),
the Astro site (home 200, `/productos` 200, at least one published product, a valid
`/productos/{slug}` 200, and `/_astro/*` assets loading) and the Angular admin
(`/` 200, SPA fallback on a deep route, main content rendered, JS/CSS loaded).
`deploy.yml` SHALL invoke these smoke tests for the environment after deploying the
frontends, and a failure SHALL mark the deployment as failed.

#### Scenario: API smoke validates health and catalog endpoints
- **WHEN** the API smoke runs against a deployed backend
- **THEN** `/health` returns 200 with `status` ok and `firebase` up
- **AND** products/categories/subcategories return 200 with a data array

#### Scenario: Astro smoke validates the public site
- **WHEN** the Astro smoke runs
- **THEN** `/` and `/productos` return 200, at least one published product exists,
and a valid `/productos/{slug}` returns 200
- **AND** `/_astro/*` assets load

#### Scenario: Angular smoke validates SPA routing and rendering
- **WHEN** the Angular smoke runs
- **THEN** `/` returns 200, a deep route uses the SPA fallback, and JS/CSS load

#### Scenario: Smoke runs after frontend deploy
- **WHEN** the pipeline deploys frontends for an environment
- **THEN** the corresponding smoke tests run after the deploy, polling Astro/Angular
until the asynchronously-built Coolify deployment is live or a timeout is reached
- **AND** a smoke failure fails the deployment

#### Scenario: Smoke is skipped when the environment URL is unset
- **WHEN** an environment URL is not configured
- **THEN** the smoke script prints a notice and is skipped without failing

### Requirement: Nginx SHALL enforce cache policy and security headers
`apps/web/nginx.conf` and `apps/admin/nginx.conf` SHALL serve content-hashed assets
immutably (`/_astro/*` for web, `/assets/*` for admin), HTML/index without permanent
caching (`no-cache`), keep the web 404 static page and the admin SPA fallback, and
add security headers compatible with both apps (`X-Content-Type-Options`,
`X-Frame-Options`, `Referrer-Policy`, and a compatible base Content-Security-Policy
that does not break required inline styles/scripts).

#### Scenario: Web nginx cache and 404
- **WHEN** a client requests web assets and HTML
- **THEN** `/_astro/*` is served immutable and HTML is served no-cache
- **AND** unknown paths hit the static 404 page

#### Scenario: Admin nginx cache and SPA fallback
- **WHEN** a client requests admin assets and a deep route
- **THEN** `/assets/*` is served immutable, `index.html` no-cache
- **AND** deep routes fall back to `index.html`

#### Scenario: Security headers present in both apps
- **WHEN** web or admin responds with any document (including index.html served via
its own location or the SPA fallback)
- **THEN** `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and a
compatible base CSP are present
- **AND** those headers are repeated explicitly in every `location` that defines
`add_header` (nginx does not inherit `add_header`), so no served document loses them

### Requirement: Rollback and URL migration SHALL be documented
`docs/deploy-standards.md` SHALL document how to identify the last healthy
revision, how to revert the Cloud Run revision, how to redeploy the previous commit
in Coolify, which smoke tests to run after a rollback, and who authorizes the
production promotion. It SHALL also document the provisional-to-definitive URL
migration checklist (update Coolify Build Variables, redeploys, CORS in Cloud Run,
and API domain mapping) to apply once `somosriff.cl` exists.

#### Scenario: Rollback procedure is documented
- **WHEN** an operator needs to revert
- **THEN** the doc covers healthy-revision identification, Cloud Run revert,
Coolify redeploy, post-rollback smoke, and promotion authorization

#### Scenario: URL migration checklist is documented
- **WHEN** `somosriff.cl` becomes available
- **THEN** the doc provides the migration checklist for Build Variables, redeploys,
CORS and API domain mapping