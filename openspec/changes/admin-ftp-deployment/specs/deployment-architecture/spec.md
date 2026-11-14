## MODIFIED Requirements

### Requirement: Deployment responsibilities SHALL be explicitly separated

The deployment architecture SHALL define Firebase as the managed provider for Firestore, Firebase Authentication —including password recovery— and Firebase Storage. The architecture SHALL define the hosting cPanel/LiteSpeed account of `staging.somosriff.cl` as the runtime of the Astro public site, published by GitHub Actions over FTPES, and the Angular administration panel as an independently deployable static service published to its own subdomain on the shared hosting by a versioned manual script over FTPES, whose automatic CI/CD publication is out of scope. The architecture SHALL NOT present hosting platforms that have been removed (Coolify was removed from the staging services) as part of the current arrangement. The architecture SHALL document the selected runtime for the NestJS API before production deployment.

#### Scenario: Services are mapped to their runtime

- **WHEN** the deployment architecture is reviewed
- **THEN** Firestore, Authentication and Storage are identified as Firebase-managed services, Astro is identified as a static site published to the shared hosting by GitHub Actions over FTPES, Angular is identified as an independently deployable static service published to its own subdomain on the shared hosting by a manual FTPES script, and NestJS has an explicit selected runtime or an approved decision deadline

#### Scenario: Frontend services are independently deployable

- **WHEN** a frontend release is prepared
- **THEN** the Astro site and Angular panel can be built and deployed as independent static services without requiring Firebase Admin credentials in their runtime containers

#### Scenario: Removed hosting platforms are not presented as current

- **WHEN** the deployment architecture is reviewed
- **THEN** no service is attributed to a hosting platform whose staging services have been removed

### Requirement: Deployment SHALL include health checks and rollback evidence

Each deployable service SHALL expose or provide an HTTP health check appropriate to its runtime. The deployment process SHALL define staging validation, smoke tests, promotion to production and rollback to a known previous image or release. For the public site published over FTPES, the rollback SHALL be performed by re-uploading the previous build to the hosting account, and the health checks SHALL be executed again after the rollback. The administration panel published over FTPES by manual script SHALL follow the same rollback model: re-uploading the previous build to its hosting account and re-running the health checks afterwards.

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

#### Scenario: Admin panel rollback is requested

- **WHEN** a manual publication of the Angular admin panel to the hosting leaves the panel in an incorrect state
- **THEN** the previous build can be published again to the admin hosting account and the smoke checks and header verifications are executed again

### Requirement: Deployment documentation SHALL remain consistent with implementation

The selected architecture, service responsibilities, runtime versions, domains, environment variables, build contexts, deployment commands and rollback procedure SHALL be documented in the project deployment and stack documentation. Documentation SHALL identify the deployment workflow used by each frontend and the replacement strategy for any deploy workflow that no longer applies. Documentation SHALL NOT describe hosting platforms whose services have been removed as part of the current deployment flow.

#### Scenario: Architecture documentation is audited

- **WHEN** `docs/project/stack.md` and `docs/deploy-standards.md` are reviewed
- **THEN** they describe the same Firebase, Cloud Run and shared hosting arrangement, with no contradictory Node version or provider assumptions and no reference to hosting platforms whose services have been removed

#### Scenario: Current deploy workflow is reviewed

- **WHEN** the workflows in `.github/workflows/` are reviewed
- **THEN** the public site publication workflow is either implemented as the selected GitHub Actions over FTPES flow or explicitly marked as obsolete, and no workflow claims to provide a working deployment while its build, credentials or hosting assumptions are unresolved

#### Scenario: The admin panel publication lane is documented

- **WHEN** `docs/deploy-standards.md` is reviewed
- **THEN** it identifies the manual FTPES script as the current publication lane of the Angular admin panel and states that its automatic CI/CD publication is deferred to a later cycle

### Requirement: Frontend staging deploys SHALL be published by GitHub Actions over FTPES

The public site of staging SHALL be published to the `staging.somosriff.cl` hosting account by a GitHub Actions workflow triggered manually with `workflow_dispatch`, which builds `apps/web` on the runner without Docker and uploads the resulting static output over FTPES. The workflow SHALL read its build variables and its FTP credentials from the GitHub Environment `staging`, SHALL NOT store credentials in the repository, and SHALL verify the site after the upload. The workflow SHALL NOT depend on webhooks or services of hosting platforms that have been removed. The backend deployment SHALL remain unchanged by this model. The administration panel is not published by that workflow in this cycle: it is published to its own subdomain on the shared hosting by the manual FTPES script defined in the capability `admin-ftp-deployment`, and its automatic publication workflow is deferred to a later cycle.

#### Scenario: The public site is published from GitHub Actions

- **WHEN** an operator dispatches the publication workflow for the public site
- **THEN** the site is built without Docker and uploaded over FTPES to the staging hosting account by that workflow

#### Scenario: The publication does not depend on removed services

- **WHEN** the public site publication workflow is reviewed
- **THEN** it invokes no webhook and no service of a hosting platform that has been removed

#### Scenario: The other services are unchanged

- **WHEN** the deployment architecture is reviewed
- **THEN** the backend deployment on Cloud Run keeps its previously specified behaviour, the administration panel is published by the manual FTPES script defined in the capability `admin-ftp-deployment`, and any change to the automatic publication mechanism of the administration panel is declared in a separate change

## ADDED Requirements

### Requirement: The Angular admin panel SHALL be published to the shared hosting over FTPES

The Angular administration panel of staging SHALL be hosted on the shared cPanel/LiteSpeed account, at `admin-staging.somosriff.cl`, using an FTP account and folder that are independent from the public site's account and whose root maps directly to that subdomain's document root. Its publication SHALL be performed by a versioned script in the repository that generates the production environment, builds the Angular application, verifies the LiteSpeed `.htaccess` contract against the build output, uploads the static output over FTPES in a safe order and verifies the result in the hosting. The script SHALL NOT delete any remote file, so that clients serving a cached bootstrap document keep resolving the content-hashed bundles they reference and active user sessions are not broken. The credentials SHALL come from environment variables and SHALL NOT be stored in the repository. The automatic publication of the panel through GitHub Actions SHALL NOT be implemented in this cycle and SHALL require its own change.

#### Scenario: The panel is published by a versioned script

- **WHEN** an operator publishes the Angular admin panel
- **THEN** the publication is performed by the repository script that generates the production environment, builds the panel, verifies the `.htaccess` contract and uploads the static output over FTPES

#### Scenario: The panel lives in its own subdomain

- **WHEN** the panel is published
- **THEN** the uploaded files land in the document root of `admin-staging.somosriff.cl`, whose SPA bootstrap and `.htaccess` contract are served by LiteSpeed, using an FTP account independent from the public site's account

#### Scenario: The publication never deletes remote files

- **WHEN** a new version of the panel is published
- **THEN** no remote file is deleted and the content-hashed bundles of the previous version remain downloadable for clients that cached the previous bootstrap document, so that active user sessions are not broken

#### Scenario: The automatic publication is deferred

- **WHEN** the publication mechanism of the Angular admin panel is reviewed
- **THEN** no GitHub Actions workflow publishes the admin panel and the deferral of that automation is recorded as a separate change
