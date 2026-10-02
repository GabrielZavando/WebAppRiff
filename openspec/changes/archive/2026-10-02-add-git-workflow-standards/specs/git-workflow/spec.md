## ADDED Requirements

### Requirement: The git workflow standard document SHALL exist and norm the standard branch flow (feature → PR → merge to main)

The repository SHALL contain `docs/git-workflow-standards.md` (project-owned) as the single source of truth for the project's git convention. The document SHALL norm the standard branch flow: a ticket branch `feature/{name}` is created from `main` (clean git tree, by `/plan-change` Step 1½), a PR is opened, and the PR is merged to `main`. It SHALL norm history accumulation (merging `main` into the feature branch to stay updated). The documented flow SHALL reflect the real repository practice (merge commits via GitHub PRs, e.g. `feature/cicd-coolify-deploy` → PR #31 → `main`).

#### Scenario: The document exists and norms the branch flow

- **GIVEN** `docs/git-workflow-standards.md` is created
- **WHEN** a developer consults the branch convention
- **THEN** the standard flow `feature/` → PR → merge to `main` is documented in §1

#### Scenario: The documentation reflects the real flow

- **GIVEN** the document
- **WHEN** it is contrasted with the real repository state
- **THEN** real branches (`feature/cicd-coolify-deploy`, `chore/specboot-0.11.0`) match the documented pattern and the documented deploy matches `deploy-standards.md` (native Coolify, no webhooks)

### Requirement: The document SHALL norm the branch naming convention without ticket IDs

The document SHALL define the branch naming pattern `{type}/{short-name-kebab-case}` WITHOUT ticket IDs, and SHALL list the allowed types (`feature/`, `fix/`, `chore/`, `docs/`, `test/`, `refactor/`). The document is the source of truth that the `plan-change` skill already delegates to (§1); the skill's example (`feature/{ticket-id}-{short-name}`) is subordinate to the document.

#### Scenario: Branch naming convention is normed

- **GIVEN** the document
- **WHEN** the naming section is reviewed
- **THEN** it defines the pattern `{type}/{short-name-kebab-case}` without ticket IDs and lists the allowed branch types

### Requirement: The document SHALL norm the commit process

The document SHALL norm Conventional Commits in English (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`), one commit = one logical change, and the hard gates (verify `PASS` + adversarial `SHIP`) required before committing. Ownership of `git commit` and `git push` SHALL be exclusive to `/commit` (plan/apply agents are denied).

#### Scenario: Commit process documented

- **GIVEN** the document
- **WHEN** a developer consults how to commit
- **THEN** it documents Conventional Commits in English, one commit = one logical change, and the hard gates (verify `PASS` + adversarial `SHIP`) before committing

### Requirement: The document SHALL norm the PR process

The document SHALL norm the PR process: the pre-PR check `git merge-base --is-ancestor origin/main HEAD` (warn when the branch is behind `main`), a conventional title with a body referencing the change, and merging to `main` — a direct push to `main` without a PR SHALL be prohibited (the merge triggers the deploy).

#### Scenario: PR process documented

- **GIVEN** the document
- **WHEN** a developer consults how to open/merge a PR
- **THEN** it documents the pre-check against `origin/main`, the conventional title with change reference, and the merge to `main` (no direct push)

### Requirement: The document SHALL document the native Coolify integration

The document SHALL describe the automatic native deploy on merge to `main` via the Coolify GitHub App (`coolify-github-zavando`): staging apps (`riff-web-staging`, `riff-admin-staging`) built in-situ per app (`web`, `admin`), and manual redeploy (Coolify panel or pushing a commit to `main`). It SHALL state explicitly that the backend lane (Cloud Run) is pending its own workflow, without inventing steps. It SHALL be consistent with `docs/deploy-standards.md` ("Deploy de frontends — nativo vía GitHub App de Coolify"), with no references to obsolete webhooks or a deploy workflow.

#### Scenario: Coolify integration documented

- **GIVEN** the document
- **WHEN** the frontend deploy section is reviewed
- **THEN** it documents the native automatic deploy on merge to `main` via the Coolify GitHub App (in-situ staging builds, manual redeploy) and states the backend Cloud Run lane is pending its own workflow

### Requirement: Existing references SHALL resolve and the bridge integrity tools SHALL pass

The 4 existing references to `docs/git-workflow-standards.md` (`ai-specs/skills/plan-change/SKILL.md`, `ai-specs/agents/plan-agent.md`, `.opencode/commands/apply.md`, `docs/framework-contract.md`) SHALL point to an existing file. After creating the document, `bash check-refs.sh` and `bash specboot.sh --ci` SHALL report 0 errors.

#### Scenario: References resolve

- **GIVEN** the document is created
- **WHEN** plan-change/plan-agent/apply/framework-contract reference it
- **THEN** the reference points to an existing file (prose references, no broken `{file:...}`)

#### Scenario: Integrity tools are green

- **GIVEN** the document created
- **WHEN** `bash check-refs.sh` and `bash specboot.sh --ci` run
- **THEN** both report 0 errors
