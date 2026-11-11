## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Frontend staging deploys SHALL be handled natively by Coolify via its GitHub App, without a GitHub Actions deploy workflow

**Reason**: Los servicios de Coolify del staging fueron eliminados y el sitio público de staging se publica desde GitHub Actions por FTPES contra el hosting cPanel/LiteSpeed, porque el hosting compartido es el destino real del sitio y el build de Astro depende de la API de staging en Cloud Run.

**Migration**: El sitio público (`apps/web`) se despliega con el workflow manual de GitHub Actions sobre FTPES, documentado en el runbook de `docs/deploy-standards.md`. El panel de administración (`apps/admin`) deja de depender de una plataforma de despliegue retirada y se trata como un servicio estático independiente en su propio subdominio; su mecanismo de publicación se definirá en un change propio. Ningún webhook de Coolify debe reactivarse sin un change que lo declare.

## ADDED Requirements

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
