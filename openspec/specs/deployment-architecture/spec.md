# deployment-architecture Specification

## Purpose
TBD - created by archiving change decide-api-deployment-architecture. Update Purpose after archive.
## Requirements
### Requirement: Deployment responsibilities SHALL be explicitly separated

The deployment architecture SHALL define Firebase as the managed provider for Firestore, Firebase Authentication —including password recovery— and Firebase Storage. The architecture SHALL define the VPS managed by Coolify as the runtime for the Astro public site and Angular administration panel. The architecture SHALL document the selected runtime for the NestJS API before production deployment.

#### Scenario: Services are mapped to their runtime

- **WHEN** the deployment architecture is reviewed
- **THEN** Firestore, Authentication and Storage are identified as Firebase-managed services, Astro and Angular are identified as Coolify/VPS services, and NestJS has an explicit selected runtime or an approved decision deadline

#### Scenario: Frontend services are independently deployable

- **WHEN** a frontend release is prepared
- **THEN** the Astro site and Angular panel can be built and deployed as independent static services without requiring Firebase Admin credentials in their runtime containers

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

Each deployable service SHALL expose or provide an HTTP health check appropriate to its runtime. The deployment process SHALL define staging validation, smoke tests, promotion to production and rollback to a known previous image or release.

#### Scenario: Staging validation succeeds

- **WHEN** a staging deployment completes
- **THEN** health checks pass and smoke tests verify the API health endpoint, public product listing, product detail, quotation flow, Astro homepage and Angular admin availability before production promotion

#### Scenario: Staging validation fails

- **WHEN** a health check or smoke test fails
- **THEN** production promotion is blocked and the failed release remains isolated or is rolled back without changing Firebase data

#### Scenario: Production rollback is requested

- **WHEN** the current production release must be reverted
- **THEN** the previous known-good image or platform revision can be selected and redeployed, and the health checks are executed again

### Requirement: Deployment documentation SHALL remain consistent with implementation

The selected architecture, service responsibilities, runtime versions, domains, environment variables, build contexts, deployment commands and rollback procedure SHALL be documented in the project deployment and stack documentation. Documentation SHALL identify the missing frontend Dockerfiles and the replacement strategy for the current deploy workflow.

#### Scenario: Architecture documentation is audited

- **WHEN** `docs/project/stack.md` and `docs/deploy-standards.md` are reviewed
- **THEN** they describe the same Firebase, Coolify and NestJS runtime arrangement, with no contradictory Node version or provider assumptions

#### Scenario: Current deploy workflow is reviewed

- **WHEN** `.github/workflows/deploy.yml` is reviewed before implementation
- **THEN** it is either replaced by the selected Coolify/Cloud Run flow or explicitly marked as obsolete, and it does not claim to provide a working production deployment while its Dockerfile, registry and secret assumptions are unresolved

