## MODIFIED Requirements

### Requirement: Deploy SHALL be gated by a successful CI run

The deployment of the public site to the staging hosting SHALL be triggered only by `workflow_dispatch`, executed manually by an operator. The publication workflow SHALL NOT be triggered by `workflow_run`, by `repository_dispatch`, nor by any automatic `push` or `pull_request` event; automatic triggering of that workflow is deferred to a later cycle. PRs SHALL NOT trigger deployment (CI protects PRs). No deployment workflow SHALL rely on a hosting platform that is no longer in use (Coolify was removed from the staging services), and any lane that is reintroduced in the future SHALL require a new change that declares its gating explicitly.

#### Scenario: No deploy when CI fails

- **WHEN** a push to `main` has a commit whose `CI` workflow concludes with errors
- **THEN** no deployment is started automatically for any service

#### Scenario: Deploy runs only after CI success

- **WHEN** a push to `main` has a commit whose `CI` workflow concludes with `success`
- **THEN** only the lanes explicitly declared as automatic in their own change may proceed for that same commit, and no service is deployed without such a declaration

#### Scenario: Manual dispatch remains available

- **WHEN** an operator triggers `workflow_dispatch` on the public site publication workflow
- **THEN** the publication proceeds (explicit manual exception)

#### Scenario: Automatic triggering is deferred

- **WHEN** the public site publication workflow is reviewed
- **THEN** it declares no `workflow_run` trigger and no `repository_dispatch` trigger

#### Scenario: No lane depends on removed hosting services

- **WHEN** the deployment workflows of the repository are reviewed
- **THEN** none of them invokes webhooks or services of a hosting platform that has been removed

### Requirement: Astro validation build SHALL not depend on a live API

The `docker-build` job SHALL build the Astro validation image with `--build-arg REQUIRE_API=false` so the runner can compile without a live API. The publication workflow of the public site SHALL build `apps/web` with `REQUIRE_API=true`, using the staging API URL taken from the GitHub Environment `staging`, so that a publication to the hosting fails when the API is down or the catalog is empty. The `docker-build` lane and the publication lane SHALL keep their respective values.

#### Scenario: Validation build compiles without a live API

- **WHEN** `docker-build` builds `riff-web:pr`
- **THEN** it passes `--build-arg REQUIRE_API=false`
- **AND** the build does not require a live API to compile

#### Scenario: Real builds keep REQUIRE_API=true

- **WHEN** the publication workflow builds the public site for the staging hosting
- **THEN** `REQUIRE_API` is `true` and the build fails if the staging API is unavailable or returns an empty catalog

### Requirement: Backend smoke SHALL precede frontend triggers in staging

Any lane that triggers a frontend rebuild against the staging API SHALL depend on the backend deployment and its smoke test, so the frontend never builds against an API that has not been validated. The manual publication lane of the public site SHALL NOT depend on a backend deployment job, but it SHALL build against the live staging API with `REQUIRE_API=true`, so the publication fails when the API is unreachable or the catalog is empty.

#### Scenario: Frontends trigger after Cloud Run smoke

- **WHEN** a lane that rebuilds a frontend against the staging API runs
- **THEN** the backend deployment and its smoke test on Cloud Run complete before that frontend rebuild starts

#### Scenario: The manual public site lane requires a live staging API

- **WHEN** the public site publication workflow is dispatched
- **THEN** the build consumes the staging API and fails if the API is unavailable or returns an empty catalog

## REMOVED Requirements

### Requirement: Coolify webhooks SHALL be authenticated per environment

**Reason**: Los servicios de Coolify del entorno de staging fueron eliminados y Coolify ya no forma parte de la arquitectura de despliegue vigente, por lo que esta requirement describe un mecanismo que no existe y no debe presentarse como operativo. La única lane de despliegue que permanece para el sitio público es la publicación manual por FTPES descrita en la capability `web-ftp-deployment`.

**Migration**: No hay migración funcional que ejecutar: ninguna lane vigente invoca webhooks de Coolify. Si en el futuro se reintroduce una plataforma de despliegue con webhooks, SHALL declararse en un change propio, con su autenticación por entorno y sus secrets asociados, en lugar de reactivar esta requirement.
