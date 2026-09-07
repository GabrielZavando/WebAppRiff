# Proposal: update-specboot-framework

## Why

The project's SDD tooling (Specboot) was installed as a raw template copy (unversioned files at the repo root). Specboot is now distributed as the npm package `@gabrielzavando/specboot` (GitHub Packages) with a versioned update flow (`specboot update`), native `.opencode/` agents/commands, a dynamic-context `AGENTS.md` bridge, and a `.specboot.json`-parametrized Makefile. Staying on the template copy means no upgrade path and a widening divergence from the framework contract.

## What Changes

- **BREAKING (tooling only, no app code)**: framework-owned files (`opencode.json`, `AGENTS.md`, `Makefile`, `specboot.sh`, `check-refs.sh`, `ai-specs/`, `.opencode/agents|commands`, `templates/ci/`, `.github/workflows/`) are replaced with the package versions via `specboot update` (backup included). The old inline agent/command definitions in `opencode.json` are superseded by native `.opencode/` agents and commands; the native OpenSpec `opsx-*` commands are discarded (per decision).
- Add `@gabrielzavando/specboot` as a root devDependency (GitHub Packages) plus a committed, token-free `.npmrc` scope mapping.
- Create `.specboot.json` with `services: ["."]` and `stack: ["node"]` so framework Make targets delegate to the existing root npm-workspaces scripts.
- Reconcile post-update state: restore the project's own `ci.yml` (with a minimal GitHub Packages auth patch), delete the framework's `release.yml` (would attempt to publish the app), keep the framework's gated `deploy.yml`.
- Migrate docs to the canonical layout: `docs/api/api-spec.yml`, `docs/data-model/data-model.md`, `docs/project/{stack,domain,client}.md`; adopt the framework-canonical `docs/base-standards.md`; update all path references in project-owned docs and living OpenSpec specs (archived changes untouched).
- Remove deprecated template leftovers: root `update.sh` and self-tests in `tests/` (`check-refs-test.sh`, `solid-templates-test.sh`, `update-test.sh`).
- Activate Husky with a `commit-msg` hook running commitlint (Conventional Commits enforcement at commit time).
- Document the recurring post-update runbook (restore `ci.yml`, delete `release.yml`).

## Capabilities

### New Capabilities
- `specboot-package-consumption`: The project consumes Specboot as an npm devDependency from GitHub Packages: token-free `.npmrc` scope mapping, `.specboot.json` (version, services, stack), and framework Make targets delegating to root npm-workspaces scripts.
- `specboot-framework-sync`: Framework-owned (intocable) files are the installed package's versions; `specboot update` is the upgrade path with backup, and a defined post-update reconciliation (restore project `ci.yml` + auth patch, delete `release.yml`, remove deprecated tooling) plus a documented runbook.
- `specboot-docs-canonical`: Project documentation follows the canonical Specboot layout (`docs/api/`, `docs/data-model/`, `docs/project/`), `docs/base-standards.md` is the framework-canonical version, and every reference (project docs, living specs, READMEs) points at the new paths.
- `commit-msg-enforcement`: Git `commit-msg` hook validates Conventional Commits locally via Husky + commitlint before a commit is created.

### Modified Capabilities
<!-- None: all existing capabilities (backend-*, pages, design-tokens, ...) keep their requirements unchanged. This change touches SDD tooling and docs layout only. -->

## Impact

- **Root tooling/config**: `package.json` (+devDep, +prepare script), new `.npmrc`, new `.specboot.json`, replaced `opencode.json`/`AGENTS.md`/`Makefile`/`specboot.sh`/`check-refs.sh`, new `validate-specboot.sh`, replaced `templates/ci/`, replaced `ai-specs/`, replaced `.opencode/commands|agents`.
- **CI/CD**: `.github/workflows/ci.yml` restored (project-owned, + auth patch: `packages: read`, `registry-url`, `NODE_AUTH_TOKEN`), `deploy.yml` replaced by framework's gated generic version, `release.yml` deleted.
- **Docs**: path moves under `docs/` + reference updates in `docs/documentation-standards.md`, `docs/seed-catalog.md`, `README.md`, `apps/backend/README.md`, `openspec/specs/**/*.md`.
- **Removals**: root `update.sh`, `tests/*.sh` (template self-tests).
- **Git hooks**: new `.husky/` with `commit-msg`.
- **CI prerequisites (outside repo)**: grant repo access to the package (Package settings → Manage Actions access).
- **No changes** to `apps/*/src`, application behavior, API contract content, or data model content.
