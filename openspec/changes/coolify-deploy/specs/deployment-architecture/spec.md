## ADDED Requirements

### Requirement: Frontend staging deploys SHALL be handled natively by Coolify via its GitHub App, without a GitHub Actions deploy workflow

The repository SHALL NOT contain a custom deploy workflow (`.github/workflows/deploy.yml`) nor tests referencing one. The frontend staging applications (`riff-web-staging`, `riff-admin-staging`) SHALL be deployed by Coolify natively (GitHub App `coolify-github-zavando`) when a PR is merged to `main`, with in-situ builds managed by Coolify. Manual redeploys SHALL be available from the Coolify panel. `ci.yml` SHALL remain the only workflow in `.github/workflows/` (PR protection; it SHALL NOT trigger deploys). `docs/deploy-standards.md` SHALL document this native flow without references to curl, `/api/v1/deploy` webhooks, or a GitHub Actions deploy workflow.

#### Scenario: Merge to main deploys via the Coolify GitHub App

- **GIVEN** the Coolify GitHub App (`coolify-github-zavando`) has access to the repository
- **WHEN** a PR is merged to `main`
- **THEN** Coolify receives the push natively and deploys both staging frontend applications (`riff-web-staging`, `riff-admin-staging`) with in-situ builds, without a GitHub Actions workflow

#### Scenario: No custom deploy workflow exists

- **GIVEN** the final repository state
- **WHEN** `.github/workflows/` is reviewed
- **THEN** no `deploy.yml` exists, no tests reference a removed deploy workflow, and `ci.yml` is the only workflow (PR protection only)

#### Scenario: Manual redeploy from the Coolify panel

- **GIVEN** an operator wants to redeploy a staging application
- **WHEN** they trigger a redeploy from the Coolify panel (or push a commit to `main`)
- **THEN** Coolify deploys the application without GitHub Actions

#### Scenario: Documentation reflects the native flow

- **GIVEN** `docs/deploy-standards.md`
- **WHEN** its deploy pipeline section is reviewed
- **THEN** it describes the native Coolify GitHub App deploy with no references to curl, `/api/v1/deploy` webhooks, or a GitHub Actions deploy workflow