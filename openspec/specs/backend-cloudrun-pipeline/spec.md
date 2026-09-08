# backend-cloudrun-pipeline Specification

## Purpose
TBD - created by archiving change implement-deployment-pipeline. Update Purpose after archive.
## Requirements
### Requirement: The backend deploy pipeline SHALL publish the image to Artifact Registry and deploy to Cloud Run staging

The deploy workflow SHALL build `apps/backend/Dockerfile` from the monorepo root, push the image to Artifact Registry in region `southamerica-west1` tagged with the commit SHA (never `latest` for production), and deploy it to the Cloud Run service `riff-api-staging` using `gcloud run deploy`. Authentication to GCP SHALL use a minimal-privilege identity (Workload Identity Federation preferred, no exported JSON keys).

#### Scenario: Merge to main deploys staging

- **WHEN** a commit is merged to `main`
- **THEN** the workflow builds and pushes the backend image tagged `sha-<commit>`, deploys it to `riff-api-staging` in `southamerica-west1`, and runs a smoke check against `GET /health`

#### Scenario: The staging smoke check fails

- **WHEN** the smoke check against `GET /health` fails after the staging deploy
- **THEN** the workflow reports failure, production is NOT deployed, and the previous staging revision remains serving

### Requirement: Production promotion SHALL be manual and reuse the staged image

Production deploys to `riff-api-prod` SHALL only happen via explicit trigger (tag `v*` or `workflow_dispatch`) and SHALL deploy the exact image revision previously validated in staging (same digest), never a fresh build tagged `latest`.

#### Scenario: Tagged release promotes to production

- **WHEN** a tag `vX.Y.Z` is pushed and staging is green
- **THEN** the workflow deploys the staged image digest to `riff-api-prod` and runs production smoke checks

#### Scenario: Rollback is a revision revert

- **WHEN** production must be reverted
- **THEN** the operator reverts to the previous Cloud Run revision (or runs the documented rollback path) and smoke checks are executed again

### Requirement: The obsolete SSH/docker deploy workflow SHALL be removed

The legacy workflow logic (root `Dockerfile` lookup, build without push, VPS `docker pull`, `:previous` rollback tag, missing env injection) SHALL be removed and replaced by the Cloud Run lane plus optional Coolify webhook trigger for frontend rebuilds.

#### Scenario: No legacy deploy path remains

- **WHEN** `.github/workflows/deploy.yml` is inspected
- **THEN** it contains no root-Dockerfile hashFiles check, no SSH docker pull of an unpushed image, and no `:previous` rollback tag

