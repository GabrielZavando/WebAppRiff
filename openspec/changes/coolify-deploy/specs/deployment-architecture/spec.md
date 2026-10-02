## ADDED Requirements

### Requirement: Frontend staging deploys SHALL be triggered automatically on merge to main via Coolify webhooks

The `.github/workflows/deploy.yml` workflow SHALL trigger automatically on push to `main` and SHALL support manual `workflow_dispatch` runs. On each run it SHALL invoke the Coolify deploy webhooks for both staging frontend applications (`riff-web-staging`, `riff-admin-staging`) via `curl --request POST` with `Authorization: Bearer $COOLIFY_API_TOKEN` using the GitHub secrets `COOLIFY_WEB_STAGING_WEBHOOK_URL` and `COOLIFY_ADMIN_STAGING_WEBHOOK_URL`. The workflow SHALL NOT require the `DEPLOY_ENABLED` variable, SSH secrets, or any build/Docker logic (Coolify builds in-situ). If a webhook URL secret is missing, the corresponding step SHALL be skipped with a visible warning without failing the workflow or blocking the other application's deploy. `docs/deploy-standards.md` SHALL document this flow.

#### Scenario: Merge to main triggers the automatic deploy

- **GIVEN** a PR from a feature branch to `main` has been merged
- **WHEN** the resulting push to `main` completes
- **THEN** the `Deploy to Coolify` workflow runs automatically without requiring `DEPLOY_ENABLED` or SSH secrets

#### Scenario: The workflow invokes both application webhooks

- **GIVEN** the `Deploy to Coolify` workflow is running on `main`
- **WHEN** the deploy job executes its invocation steps
- **THEN** a `curl --request POST` with `Authorization: Bearer $COOLIFY_API_TOKEN` is sent to the `riff-web-staging` webhook (`COOLIFY_WEB_STAGING_WEBHOOK_URL`) and to the `riff-admin-staging` webhook (`COOLIFY_ADMIN_STAGING_WEBHOOK_URL`), and Coolify receives the signal and deploys both applications

#### Scenario: Manual workflow_dispatch triggers the deploy

- **GIVEN** an operator opens the repository Actions tab
- **WHEN** they run the `Deploy to Coolify` workflow manually selecting the `main` branch
- **THEN** the deploy is triggered and both staging application webhooks are invoked

#### Scenario: Pushes to non-main branches do not deploy

- **GIVEN** a developer pushes to a feature branch or opens a PR
- **WHEN** the push or PR completes
- **THEN** the `Deploy to Coolify` workflow does not run (only `ci.yml` protects PRs)

#### Scenario: Missing webhook secret degrades gracefully

- **GIVEN** the workflow is running and `COOLIFY_ADMIN_STAGING_WEBHOOK_URL` is not configured
- **WHEN** the corresponding step evaluates the secret
- **THEN** the step is skipped with a visible `::warning::` in the log, the other application's deploy proceeds, and the workflow does not fail

#### Scenario: Webhook failure is visible in the workflow

- **GIVEN** the workflow is running and Coolify returns an HTTP error (>= 400) for a webhook
- **WHEN** `curl --fail` exits with a non-zero code
- **THEN** the step fails, the deploy job turns red, and the error is visible in the Actions log without exposing the secret value
