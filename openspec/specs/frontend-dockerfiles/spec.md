# frontend-dockerfiles Specification

## Purpose
TBD - created by archiving change implement-deployment-pipeline. Update Purpose after archive.
## Requirements
### Requirement: The Astro web app SHALL have a reproducible multi-stage Docker image

The repository SHALL provide `apps/web/Dockerfile` that builds the Astro site with the monorepo root as build context, using the root lockfile (`npm ci --workspace=@riff/web`), and produces a static runtime image served by a lightweight HTTP server (nginx) without Node.js in the runtime stage. The image SHALL NOT contain Firebase Admin credentials or any secret.

#### Scenario: Local build succeeds from the monorepo root

- **WHEN** `docker build -f apps/web/Dockerfile .` is executed from the repository root
- **THEN** the build completes and produces a working image with the static site baked in

#### Scenario: The runtime image serves the static site

- **WHEN** the built image is started and `GET /` is requested
- **THEN** the server responds 200 with the site HTML and `GET /health` (or equivalent lightweight endpoint) is available for container healthchecks

#### Scenario: Production build arguments are injected

- **WHEN** the image is built with `SITE_URL`, `NESTJS_API_URL` and `REQUIRE_API` build arguments
- **THEN** the baked static site uses those values and contains no localhost URLs for canonical/sitemap/API calls in production builds

### Requirement: The Angular admin app SHALL have a reproducible multi-stage Docker image

The repository SHALL provide `apps/admin/Dockerfile` that builds the Angular app with the monorepo root as build context and serves it from a lightweight static HTTP server with SPA fallback routing, without Node.js in the runtime stage and without secrets.

#### Scenario: Local build succeeds from the monorepo root

- **WHEN** `docker build -f apps/admin/Dockerfile .` is executed from the repository root
- **THEN** the build completes and produces a working image with the compiled admin bundle

#### Scenario: SPA routes resolve in the runtime image

- **WHEN** a client requests a deep route (e.g. `/login`) from the running image
- **THEN** the server returns the index HTML (SPA fallback) with status 200

### Requirement: All three service images SHALL be verified in CI

The deploy workflow SHALL include a job that builds the backend, web and admin Docker images on pull requests (build only, no push) so that broken images cannot reach staging.

#### Scenario: A pull request with a broken Dockerfile fails CI

- **WHEN** a pull request modifies an app Dockerfile or its build inputs and the image build fails
- **THEN** the CI pipeline fails and the pull request cannot merge

