# add-frontend-smoke-and-nginx-hardening Specification

## Purpose
TBD - created by archiving change add-frontend-smoke-and-nginx-hardening. Update Purpose after archive.
## Requirements
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
`apps/web/nginx.conf` and `apps/admin/nginx.conf` SHALL serve content-hashed assets (`/_astro/*` for web, `/assets/*` for admin) with `Cache-Control: public, max-age=31536000, immutable`; HTML (including `index.html` and the SPA fallback) with `no-cache`; and every HTML document SHALL carry the security headers `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and a compatible base Content-Security-Policy repeated explicitly in each `location` that defines an `add_header`. The CSP `font-src` directive SHALL be `font-src 'self' https: data:` — the `data:` source allows the self-hosted `@fontsource` fonts that the build inlines as base64 data URIs (change `ui-chrome-uniform`); the other CSP directives remain unchanged. (MODIFIED in `ui-chrome-uniform`.)

#### Scenario: CSP font-src allows embedded fonts
- **WHEN** any `location` in `apps/web/nginx.conf` or `apps/admin/nginx.conf` emits the `Content-Security-Policy` header
- **THEN** the `font-src` directive is `'self' https: data:`
- **AND** the remaining directives (`default-src`, `script-src`, `style-src`, `img-src`, `connect-src`, `object-src`, `base-uri`, `form-action`) are unchanged

#### Scenario: Security headers present on every document
- **WHEN** nginx serves any HTML document
- **THEN** it includes `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` and the base CSP
- **AND** the headers + CSP are repeated explicitly in each `location` that defines its own `add_header` (nginx `add_header` inheritance)

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

