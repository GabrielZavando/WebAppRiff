# astro-env-contract Specification

## Purpose
TBD - created by archiving change implement-deployment-pipeline. Update Purpose after archive.
## Requirements
### Requirement: The API base URL SHALL be normalized in one place

The Astro site's API clients (`apps/web/src/lib/api/*`) SHALL resolve the API base URL through a single shared function that guarantees the resulting base ends with `/api/v1`, accepting configured values with or without the suffix. The documented default fallback SHALL be `http://localhost:3000/api/v1`.

#### Scenario: Configured value without the version suffix

- **WHEN** `NESTJS_API_URL` is set to `https://api.somosriff.cl` (without `/api/v1`)
- **THEN** the API clients call `https://api.somosriff.cl/api/v1/products` and equivalent endpoints

#### Scenario: Configured value with the version suffix

- **WHEN** `NESTJS_API_URL` is set to `https://api.somosriff.cl/api/v1`
- **THEN** the resulting base is unchanged (no duplicated `/api/v1/api/v1`)

### Requirement: Production builds SHALL fail fast when the API is unavailable

When building for production (`REQUIRE_API=true`), the Astro build SHALL fail with an explicit error if the initial catalog fetch fails or returns an empty catalog. Outside production (no `REQUIRE_API`), the current warn-and-fallback behavior SHALL be preserved.

#### Scenario: Production build with unreachable API

- **WHEN** `astro build` runs with `REQUIRE_API=true` and the API is unreachable
- **THEN** the build fails with an explicit error naming the failed source (products/categories/subcategories) instead of publishing an empty catalog

#### Scenario: Production build with empty catalog response

- **WHEN** the API responds successfully but the public product list is empty and `REQUIRE_API=true`
- **THEN** the build fails with an explicit empty-catalog error

#### Scenario: Development build keeps the fallback

- **WHEN** `astro build` runs without `REQUIRE_API` and the API is unreachable
- **THEN** the build succeeds with a warning and an empty catalog (existing behavior preserved)

### Requirement: `.env.example` SHALL stay synchronized with the code contract

The root `.env.example` SHALL declare exactly the environment variables consumed by the code: it SHALL include `SITE_URL`, `NESTJS_API_URL` (documented with the `/api/v1` suffix contract), `REQUIRE_API` and `CATEGORIES_WEBHOOK_URL`, and SHALL NOT declare variables with no consumers (e.g. `LOG_LEVEL`, `LOG_FORMAT`).

#### Scenario: Copying the template yields a working setup

- **WHEN** a developer copies `.env.example` to `.env` and runs the site locally
- **THEN** the API base URL resolves to `http://localhost:3000/api/v1` and no documented variable is unused or missing

