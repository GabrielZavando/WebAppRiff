# deployment-architecture Specification

## Purpose
Decisión de arquitectura de despliegue: separación explícita de responsabilidades, evaluación de Cloud Run vs Coolify para el runtime NestJS, configuración por entorno con secretos, health checks y evidencia de rollback, y frontends desplegados nativamente por Coolify.
## Requirements
### Requirement: Deployment responsibilities SHALL be explicitly separated

The deployment architecture SHALL define Firebase as the managed provider for Firestore, Firebase Authentication —including password recovery— and Firebase Storage. The architecture SHALL define the hosting cPanel/LiteSpeed account of `staging.somosriff.cl` as the runtime of the Astro public site, published by GitHub Actions over FTPES, and the Angular administration panel as an independently deployable static service on its own subdomain, whose publication mechanism is out of scope for this change. The architecture SHALL NOT present hosting platforms that have been removed (Coolify was removed from the staging services) as part of the current arrangement. The architecture SHALL document the selected runtime for the NestJS API before production deployment.

#### Scenario: Services are mapped to their runtime

- **WHEN** the deployment architecture is reviewed
- **THEN** Firestore, Authentication and Storage are identified as Firebase-managed services, Astro is identified as a static site published to the shared hosting by GitHub Actions over FTPES, Angular is identified as an independently deployable static service on its own subdomain, and NestJS has an explicit selected runtime or an approved decision deadline

#### Scenario: Frontend services are independently deployable

- **WHEN** a frontend release is prepared
- **THEN** the Astro site and Angular panel can be built and deployed as independent static services without requiring Firebase Admin credentials in their runtime containers

#### Scenario: Removed hosting platforms are not presented as current

- **WHEN** the deployment architecture is reviewed
- **THEN** no service is attributed to a hosting platform whose staging services have been removed

### Requirement: The NestJS runtime decision SHALL evaluate Cloud Run and Coolify

The architecture decision SHALL compare Cloud Run and a Coolify-managed NestJS container using compatibility with the existing Dockerfile, operational responsibility, scalability, cold starts, cost, Firebase proximity, secret management, health checks, rollback and portability. Cloud Functions 2nd gen SHALL be documented as a secondary alternative and SHALL NOT be selected without an explicit rationale for adapting a containerized NestJS HTTP application to the functions model.

#### Scenario: Cloud Run is selected

- **WHEN** Cloud Run is selected for NestJS
- **THEN** the existing `apps/backend/Dockerfile` is used as the deployment artifact, the image is published to a registry, runtime secrets are injected through a managed secret mechanism, and health/readiness checks are configured

#### Scenario: Coolify is selected

- **WHEN** Coolify is selected for NestJS
- **THEN** Coolify builds the backend from the repository root using `apps/backend/Dockerfile`, configures runtime secrets and resource limits, and exposes a stable HTTPS API URL for Astro and Angular

#### Scenario: The decision is deferred

- **WHEN** no runtime is selected yet
- **THEN** the architecture records the unresolved decision, its owner and deadline, and no production deploy workflow is considered complete until the decision is resolved

### Requirement: Deployment configuration SHALL be environment-specific and secret-safe

The architecture SHALL define separate staging and production configuration for public URLs, API URLs, CORS origins, Firebase credentials, webhook URLs, domains and resource settings. Firebase Admin credentials SHALL NOT be embedded in frontend bundles, Docker build arguments, source control or public environment variables.

#### Scenario: Production secrets are injected

- **WHEN** a production service starts
- **THEN** Firebase Admin credentials are available only to the NestJS runtime through Coolify secrets or Google Secret Manager, and Astro/Angular bundles contain no Firebase Admin private key

#### Scenario: CORS is configured for deployed frontends

- **WHEN** Angular or an authenticated browser client calls the production API
- **THEN** the API allows the configured production frontend origins and rejects unconfigured origins

### Requirement: Deployment SHALL include health checks and rollback evidence

Each deployable service SHALL expose or provide an HTTP health check appropriate to its runtime. The deployment process SHALL define staging validation, smoke tests, promotion to production and rollback to a known previous image or release. For the public site published over FTPES, the rollback SHALL be performed by re-uploading the previous build to the hosting account, and the health checks SHALL be executed again after the rollback.

#### Scenario: Staging validation succeeds

- **WHEN** a staging deployment completes
- **THEN** health checks pass and smoke tests verify the API health endpoint, public product listing, product detail, quotation flow, Astro homepage and Angular admin availability before production promotion

#### Scenario: Staging validation fails

- **WHEN** a health check or smoke test fails
- **THEN** production promotion is blocked and the failed release remains isolated or is rolled back without changing Firebase data

#### Scenario: Production rollback is requested

- **WHEN** the current production release must be reverted
- **THEN** the previous known-good image or platform revision can be selected and redeployed, and the health checks are executed again

#### Scenario: Public site rollback is requested

- **WHEN** a deployment of the public site to the hosting leaves the site in an incorrect state
- **THEN** the previous build can be uploaded again to the hosting account and the smoke checks and header verifications are executed again

### Requirement: Deployment documentation SHALL remain consistent with implementation

The selected architecture, service responsibilities, runtime versions, domains, environment variables, build contexts, deployment commands and rollback procedure SHALL be documented in the project deployment and stack documentation. Documentation SHALL identify the deployment workflow used by each frontend and the replacement strategy for any deploy workflow that no longer applies. Documentation SHALL NOT describe hosting platforms whose services have been removed as part of the current deployment flow.

#### Scenario: Architecture documentation is audited

- **WHEN** `docs/project/stack.md` and `docs/deploy-standards.md` are reviewed
- **THEN** they describe the same Firebase, Cloud Run and shared hosting arrangement, with no contradictory Node version or provider assumptions and no reference to hosting platforms that have been removed

#### Scenario: Current deploy workflow is reviewed

- **WHEN** the workflows in `.github/workflows/` are reviewed
- **THEN** the public site publication workflow is either implemented as the selected GitHub Actions over FTPES flow or explicitly marked as obsolete, and no workflow claims to provide a working deployment while its build, credentials or hosting assumptions are unresolved

### Requirement: Frontend staging deploys SHALL be published by GitHub Actions over FTPES

The public site of staging SHALL be published to the `staging.somosriff.cl` hosting account by a GitHub Actions workflow triggered manually with `workflow_dispatch`, which builds `apps/web` on the runner without Docker and uploads the resulting static output over FTPES. The workflow SHALL read its build variables and its FTP credentials from the GitHub Environment `staging`, SHALL NOT store credentials in the repository, and SHALL verify the site after the upload. The workflow SHALL NOT depend on webhooks or services of hosting platforms that have been removed. The administration panel and the backend deployment SHALL remain unchanged by this model.

#### Scenario: The public site is published from GitHub Actions

- **WHEN** an operator dispatches the publication workflow for the public site
- **THEN** the site is built without Docker and uploaded over FTPES to the staging hosting account by that workflow

#### Scenario: The publication does not depend on removed services

- **WHEN** the public site publication workflow is reviewed
- **THEN** it invokes no webhook and no service of a hosting platform that has been removed

#### Scenario: The other services are unchanged

- **WHEN** the deployment architecture is reviewed
- **THEN** the administration panel and the backend deployment on Cloud Run keep their previously specified behaviour, and any change to their publication mechanism is declared in a separate change

