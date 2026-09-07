# Skill: deploy

## Description

Release workflow that follows the project's deploy standards. The concrete process — environments, versioning scheme, Docker/registry, smoke tests, and rollback — lives in [`docs/deploy-standards.md`](../docs/deploy-standards.md). That file is the source of truth and must be personalized per project.

**Use when:** Deploying to staging or production. Executed as `/deploy` (registered in `opencode.json`) or manually before a release.

## Prerequisites

- Read [`docs/deploy-standards.md`](../docs/deploy-standards.md) first — it defines the project's environments, versioning rules, registry, and rollback procedure.
- Docker (or the project's container tool) installed and running.
- Access to the container registry and target servers.
- `openspec` CLI installed; confirm the change is archived before releasing.

## Mandatory pre-deploy checklist

Project-agnostic minimum checklist. `/deploy` MUST pass **all six items** before
any release step. If any check fails, the deploy
**stops before the version bump** and reports the failed items; it does not
proceed until every item passes.

1. **Tests green**
2. **Lint without critical errors**
3. **Build succeeds**
4. **Security audit without critical vulnerabilities** (`npm audit` / `composer audit` / `pip-audit`)
5. **Rollback procedure defined**
6. **OpenSpec change archived**

Only when every item passes, continue with the project-specific flow below.

## Process

1. **Pre-deploy checklist** — run the **Mandatory pre-deploy checklist** above (all six items must pass) plus the project-specific checks defined in `docs/deploy-standards.md`.
2. **Version bump** — choose `patch` / `minor` / `major` per the versioning rules in the standards; create the git tag `vX.Y.Z` and the `release: vX.Y.Z` commit, then push the tag.
3. **Build & push** — build the artifact/image tagged with the version and push it to the registry per the standards.
4. **Deploy to staging** — deploy and run smoke tests; on failure, execute rollback immediately.
5. **Deploy to production** — only after staging smoke tests pass.
6. **Post-deploy** — notify the team and create the GitHub release.

The exact commands (Docker build args, kubectl/compose/SSH invocations, webhook payloads) are derived from the project-specific stack declared in `docs/deploy-standards.md`.

## Rollback

Follow the rollback procedure defined in `docs/deploy-standards.md`.

## Output

Produce a Deploy Report with status, timeline (checks, bump, image/tag, staging, production, smoke tests), and the explicit rollback command for the previous version.
