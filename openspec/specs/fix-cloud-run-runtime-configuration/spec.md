# fix-cloud-run-runtime-configuration Specification

## Purpose
TBD - created by archiving change fix-cloud-run-runtime-configuration. Update Purpose after archive.
## Requirements
### Requirement: Staging Cloud Run SHALL be configured with runtime env, service account and public ingress
The staging deploy step SHALL configure `riff-api-staging` (via `vars.CLOUD_RUN_SERVICE`)
with `--service-account=${{ vars.GCP_RUNTIME_SA }}`, `--allow-unauthenticated`, and the
env vars `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `NODE_ENV=production`,
`ASTRO_SITE_URL` and `ANGULAR_ADMIN_URL` (the latter two from
`SMOKE_WEB_STAGING_URL` / `SMOKE_ADMIN_STAGING_URL`). It SHALL NOT set `PORT`
manually. ADC is preserved (no service-account JSON). The image path SHALL use
`vars.GCP_ARTIFACT_REPOSITORY` instead of hardcoded `riff/riff-backend` literals.
The staging gate SHALL require `vars.GCP_PROJECT`, `vars.GCP_RUNTIME_SA` and
`vars.FIREBASE_PROJECT_ID` to be set before the staging deploy proceeds (link to W1).

#### Scenario: Creates the service with runtime config from scratch
- **WHEN** the staging lane deploys and `riff-api-staging` does not exist yet
- **THEN** the service is created with the configured runtime SA, env vars and unauthenticated ingress

#### Scenario: Runtime SA and ADC are used without JSON credentials
- **WHEN** the container boots
- **THEN** it authenticates via ADC using the runtime service account and only reads `FIREBASE_PROJECT_ID`/`FIREBASE_STORAGE_BUCKET`

#### Scenario: CORS origins come from the temporary staging URLs
- **WHEN** the service is deployed
- **THEN** `ASTRO_SITE_URL` is `SMOKE_WEB_STAGING_URL` and `ANGULAR_ADMIN_URL` is `SMOKE_ADMIN_STAGING_URL`

### Requirement: Catalog rebuild secrets SHALL come from Secret Manager
`CATALOG_REBUILD_WEBHOOK_URL` and `CATALOG_REBUILD_WEBHOOK_TOKEN` SHALL be injected
into the staging service from Google Secret Manager via the `secrets` input, never
written into the workflow or logs. A missing secret SHALL fail the deploy with a
clear error (not silently).

#### Scenario: Secrets are injected from Secret Manager
- **WHEN** the staging backend is deployed
- **THEN** the webhook secrets are mounted from Secret Manager and not present in code/workflow/logs

### Requirement: Production lane SHALL remain blocked until its own vars exist
The production Cloud Run and frontend lanes SHALL be no-ops until every production
var is configured, so a manual dispatch cannot deploy production with empty/invalid
config. The gate SHALL enumerate all required production vars: 
`vars.CLOUD_RUN_SERVICE_PRODUCTION`, `vars.FIREBASE_PROJECT_ID_PRODUCTION`,
`vars.FIREBASE_STORAGE_BUCKET_PRODUCTION`, `vars.GCP_RUNTIME_SA_PRODUCTION`,
`vars.SMOKE_WEB_PRODUCTION_URL` and `vars.SMOKE_ADMIN_PRODUCTION_URL`. Link to fix
W2: production SHALL be blocked unless all production vars (service, Firebase project
ID, storage bucket, runtime SA, web/admin smoke URLs) are set.

#### Scenario: Production is no-op until its own resources are configured
- **WHEN** `workflow_dispatch` runs with any production var unset
- **THEN** the production jobs are skipped (no deployment)

### Requirement: Backend staging deployment SHALL keep CI gating and precede frontends
The staging pipeline SHALL keep the existing CI gate and the order
`deploy-backend-staging` (deploy + smoke) before `deploy-frontends-staging`.

#### Scenario: CI gating and ordering are preserved
- **WHEN** the staging lane runs
- **THEN** CI must pass first and the backend staging smoke precedes the frontend triggers

