# Proposal: Configure Cloud Run runtime for staging (fix-cloud-run-runtime-configuration)

- **Ticket ID**: RIFF-DEPLOY-02
- **Título original**: "[deploy] Configure Cloud Run runtime for staging"
- **Tag**: `[deploy]`
- **Change name**: `fix-cloud-run-runtime-configuration`

## Why

The staging lane in `.github/workflows/deploy.yml` deploys to Cloud Run with
`google-github-actions/deploy-cloudrun@v2` passing only `service`, `region` and
`image`. On a first real deployment, `riff-api-staging` would boot **without** the
runtime configuration the NestJS backend requires:

- The runtime service account is not set → Cloud Run uses the Compute-Engine default
  service account, which has no access to the staging Firebase project
  (`riff-catalogo-staging`). ADC fails or cannot reach Firestore/storage.
- `FIREBASE_PROJECT_ID` / `FIREBASE_STORAGE_BUCKET` are not set →
  `FirebaseModule` uses `config.getOrThrow(...)`, so the container aborts on boot.
- `ASTRO_SITE_URL` / `ANGULAR_ADMIN_URL` are not set → CORS builds an empty allowlist
  (fail-closed), so the Astro site and Angular admin cannot reach the public API.
- No public ingress (`--allow-unauthenticated`) → smoke tests and the frontends
  cannot call the public endpoints.

This blocks the very first staging deploy (everything after `docker-build`) —
the API never becomes healthy, so Coolify frontends are never triggered.

## What Changes

Refactor the staging deploy step in `deploy.yml` to provide a complete, safe,
reproducible Cloud Run runtime configuration (via `vars`/`secrets` and the
`deploy-cloudrun` action inputs), without hardcoded values where a repo variable
exists, and keep ADC (no JSON service-account keys). Keep the production lane
blocked until it has its own resources and values.

Operational human actions in GCP are documented (Secret Manager secrets, IAM of
`GCP_RUNTIME_SA`, cross-project access to `riff-catalogo-staging`, minimal
Firestore seed) but not executed by this change.

## Out of scope

- Creating Cloud Run service resources manually (Cloud Run creates it on first
  deploy).
- Provisioning the Google Cloud runtime service account / IAM / Secret Manager
  entries (ops, documented exhaustively).
- Any production deployment (kept blocked).
- Code changes to the backend (NestJS already reads env vars; `resolvePort`
  handles Cloud Run's injected `PORT`; CORS is already env-driven / fail-closed).

## Acceptance

- The staging workflow can create `riff-api-staging` even if it does not exist yet.
- Cloud Run uses the runtime service account from `GCP_RUNTIME_SA`.
- The container starts with ADC (no JSON credentials).
- Firebase Admin accesses `riff-catalogo-staging` via ADC.
- `/health` responds; products/categories/subcategories pass the smoke tests.
- CORS accepts only the configured temporary web/admin staging origins.
- Secrets (webhook URL/token) come from Secret Manager and never appear in code,
  workflow or logs.
- Coolify frontends are triggered only after the staging backend smoke passes.
- `CI`, tests, YAML validation and the three image builds stay green.
- `docs/deploy-standards.md` documents the remaining human GCP actions.
- The production lane remains blocked (no-operative) until it has its own vars,
  secrets and resources.