# specboot-framework-sync — Delta Spec

## ADDED Requirements

### Requirement: Framework-owned files match the installed package
After the migration, the intocable file set — `opencode.json`, `AGENTS.md`, `Makefile`, `specboot.sh`, `check-refs.sh`, `validate-specboot.sh`, `ai-specs/`, `.opencode/agents/`, `.opencode/commands/`, `templates/ci/`, and `.github/workflows/ci.yml`+`deploy.yml` — SHALL match the versions shipped by the installed `@gabrielzavando/specboot` package, except where this change's reconciliation rules (below) deliberately override them.

#### Scenario: Post-update structure validation passes
- **WHEN** `bash specboot.sh --init` and `bash specboot.sh --ci` are run at the repo root
- **THEN** both complete with zero errors

#### Scenario: Reference integrity holds
- **WHEN** `bash check-refs.sh` is run at the repo root
- **THEN** it exits 0 (all `{file:...}` references resolve and every `ai-specs/skills/*/` folder is registered in `AGENTS.md`)

#### Scenario: Native SDD agents and commands available
- **WHEN** OpenCode loads the project configuration
- **THEN** the SDD cycle commands (`/plan-change`, `/apply`, `/verify`, `/archive`, `/commit`, `/deploy`, `/enrich-us`, `/adversarial-review`) resolve from `.opencode/commands/` and agents (`plan`, `build`, `verify`, `archive`, `reviewer`, `backend`, `frontend`) resolve from `.opencode/agents/`

### Requirement: Project CI workflow preserved with Packages auth
The repository SHALL keep its own `.github/workflows/ci.yml` (triggers on `main`, `develop`, `feature/**`), patched to authenticate GitHub Packages reads: a workflow-level `packages: read` permission, `registry-url: https://npm.pkg.github.com` on each `setup-node` step that installs dependencies, and `NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` available to `npm ci`.

#### Scenario: CI can resolve the private package
- **WHEN** the CI `lint` job runs `make install` (root `npm ci`)
- **THEN** `@gabrielzavando/specboot` is fetched from GitHub Packages using the workflow token and the job proceeds

#### Scenario: Branch coverage retained
- **WHEN** a push lands on `develop` or `feature/**`
- **THEN** the CI workflow triggers

### Requirement: No release workflow in the consumer repository
The repository SHALL NOT contain `.github/workflows/release.yml`, because the framework's release workflow would attempt to publish the application package on push to `main`.

#### Scenario: Release workflow absent
- **WHEN** the repository contents are inspected after migration
- **THEN** `.github/workflows/release.yml` does not exist

### Requirement: Deprecated template tooling removed
The repository root SHALL NOT contain `update.sh` nor the template self-tests `tests/check-refs-test.sh`, `tests/solid-templates-test.sh`, and `tests/update-test.sh`.

#### Scenario: Deprecated files absent
- **WHEN** the repo root and `tests/` directory are listed
- **THEN** `update.sh` and the three template self-test scripts are gone

### Requirement: Update runbook documented
The change SHALL document the recurring post-update ritual for future framework upgrades: after `specboot update`, restore the project `ci.yml` from the update backup, delete `release.yml`, and re-apply the auth patch if the backup predates it.

#### Scenario: Runbook available
- **WHEN** a maintainer reads this change's documentation
- **THEN** the three post-update steps are listed with their rationale
