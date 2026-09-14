# fix-deploy-pipeline-gates Specification — DELTA (fix-deploy-pipeline-gates)

> Este delta ajusta el pipeline de despliegue (`deploy.yml`) para que (1) los
> despliegues solo procedan cuando CI ha pasado (AC2), (2) el build de validación
> de Astro no dependa de una API viva (AC4), y (3) los frontends se disparen por
> ambiente con webhooks autenticados por Bearer (AC6/AC7), con la API desplegada y
> fumada antes que Astro (AC3). Añade una nueva capacidad `fix-deploy-pipeline-gates`.

## ADDED Requirements

### Requirement: Deploy SHALL be gated by a successful CI run
`deploy.yml` SHALL trigger via `workflow_run` on the `CI` workflow with `types: completed` and proceed only when `conclusion == 'success'` for the triggering run/commit. No deploy (Cloud Run or Coolify) SHALL start when CI fails. `workflow_dispatch` remains as an explicit manual exception. PRs SHALL NOT trigger deployment (CI protects PRs).

#### Scenario: No deploy when CI fails
- **WHEN** a push to `main` has a commit whose `CI` workflow concludes with errors
- **THEN** `deploy.yml` is not started by `workflow_run`
- **AND** nothing is deployed to Cloud Run or Coolify

#### Scenario: Deploy runs only after CI success
- **WHEN** a push to `main` has a commit whose `CI` workflow concludes with `success`
- **THEN** `deploy.yml` runs for that same commit

#### Scenario: Manual dispatch remains available
- **WHEN** an operator triggers `workflow_dispatch`
- **THEN** deployment proceeds (explicit manual exception)

### Requirement: Astro validation build SHALL not depend on a live API
The `docker-build` job SHALL build the Astro validation image with `--build-arg REQUIRE_API=false` so the runner can compile without a live API. Real Coolify builds keep `REQUIRE_API=true` (external config) so a real deploy fails when the API is down or the catalog is empty.

#### Scenario: Validation build compiles without a live API
- **WHEN** `docker-build` builds `riff-web:pr`
- **THEN** it passes `--build-arg REQUIRE_API=false`
- **AND** the build does not require a live API to compile

#### Scenario: Real builds keep REQUIRE_API=true
- **WHEN** Coolify builds Astro for staging or production with its Build Variables
- **THEN** `REQUIRE_API` is `true` (external to this workflow)

### Requirement: Coolify webhooks SHALL be authenticated per environment
Frontend deployment SHALL be split into `deploy-frontends-staging` and `deploy-frontends-production`. Each SHALL invoke its webhook with `curl --fail --silent --show-error --request GET "$URL" -H "Authorization: Bearer $COOLIFY_API_TOKEN"`, reading the token from a secret without logging it. Staging SHALL only call staging webhooks; production SHALL only call production webhooks. Missing secrets SHALL yield a clear no-op (exit 0) so main stays green before ops configures them.

#### Scenario: Staging never calls production webhooks
- **WHEN** the staging lane runs
- **THEN** only `COOLIFY_WEB_STAGING_WEBHOOK_URL` and `COOLIFY_ADMIN_STAGING_WEBHOOK_URL` are invoked

#### Scenario: Production only via the production lane
- **WHEN** the production lane runs (tag/director)
- **THEN** only `COOLIFY_WEB_PRODUCTION_WEBHOOK_URL` and `COOLIFY_ADMIN_PRODUCTION_WEBHOOK_URL` are invoked

#### Scenario: Missing secret yields a no-op
- **WHEN** a Coolify secret is not set
- **THEN** the job prints a clear notice and exits 0 without deploying

### Requirement: Backend smoke SHALL precede frontend triggers in staging
In the staging lane, `deploy-frontends-staging` SHALL depend on `deploy-backend-staging` so the backend is deployed and smoke-tested on Cloud Run before the frontends rebuild against it.

#### Scenario: Frontends trigger after Cloud Run smoke
- **WHEN** the staging lane runs
- **THEN** `deploy-backend-staging` (Cloud Run + smoke) completes before `deploy-frontends-staging` starts