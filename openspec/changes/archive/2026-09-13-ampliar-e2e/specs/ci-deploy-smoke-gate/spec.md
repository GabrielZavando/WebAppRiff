## ADDED Requirements

### Requirement: CI project-ci runs backend e2e

The `ci.yml` job `project-ci` SHALL include a step that runs `npm run test:e2e --workspace=apps/backend` after the unit test steps.

#### Scenario: Backend e2e runs in CI on PR

- **WHEN** a pull request triggers the CI pipeline
- **THEN** the `project-ci` job runs `npm run test:e2e --workspace=apps/backend` and the pipeline fails if any e2e test fails

#### Scenario: Backend e2e runs in CI on push to main

- **WHEN** a push to `main` triggers the CI pipeline
- **THEN** the `project-ci` job runs `npm run test:e2e --workspace=apps/backend`

### Requirement: CI project-ci runs web smoke

The `ci.yml` job `project-ci` SHALL include a step that installs Playwright browsers (`npx playwright install --with-deps chromium`) and then runs `npm run test:smoke --workspace=apps/web`.

#### Scenario: Web smoke runs in CI

- **WHEN** the CI pipeline runs `project-ci`
- **THEN** Playwright chromium is installed and `npm run test:smoke --workspace=apps/web` executes; the pipeline fails if any smoke test fails

### Requirement: CI excludes admin smoke

The `ci.yml` job `project-ci` SHALL NOT run `npm run test:smoke --workspace=apps/admin` (admin has no e2e specs; playwright would fail with "no tests found").

#### Scenario: Admin smoke not in CI

- **WHEN** the CI pipeline runs `project-ci`
- **THEN** no step runs `npm run test:smoke --workspace=apps/admin`

### Requirement: deploy.yml staging smoke covers domain endpoints

The `deploy.yml` `deploy-staging` job's smoke step SHALL verify multiple domain endpoints, not just `/health`. The smoke script SHALL check: `GET /health` (200), `GET /api/v1/products` (200 + `data` array non-empty), `GET /api/v1/categories` (200), `POST /api/v1/quotes` with minimal fixture body (201).

#### Scenario: Staging smoke passes with all endpoints

- **WHEN** the backend is deployed to staging
- **THEN** the smoke step verifies `/health` returns 200, `/api/v1/products` returns 200 with non-empty `data`, `/api/v1/categories` returns 200, and `POST /api/v1/quotes` returns 201

#### Scenario: Staging smoke fails if products empty

- **WHEN** the backend returns an empty product list from `/api/v1/products`
- **THEN** the staging smoke step fails (non-empty `data` assertion)

#### Scenario: Staging smoke fails if quotes endpoint missing

- **WHEN** `POST /api/v1/quotes` returns 404
- **THEN** the staging smoke step fails

### Requirement: deploy.yml production smoke mirrors staging

The `deploy.yml` `deploy-production` job's smoke step SHALL perform the same multi-endpoint verification as staging.

#### Scenario: Production smoke covers same endpoints

- **WHEN** the backend is deployed to production
- **THEN** the smoke step verifies the same 4 endpoints as staging (`/health`, `/api/v1/products`, `/api/v1/categories`, `POST /api/v1/quotes`)
