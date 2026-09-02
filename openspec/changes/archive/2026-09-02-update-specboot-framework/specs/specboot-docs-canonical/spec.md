# specboot-docs-canonical — Delta Spec

## ADDED Requirements

### Requirement: Canonical docs layout
The project `docs/` directory SHALL follow the canonical Specboot layout: `docs/api/api-spec.yml` (OpenAPI contract), `docs/data-model/data-model.md` (domain entities), and `docs/project/{stack,domain,client}.md` (project context), with `docs/base-standards.md` replaced by the framework-canonical version.

#### Scenario: Required files exist at canonical paths
- **WHEN** the `docs/` tree is inspected
- **THEN** `docs/api/api-spec.yml`, `docs/data-model/data-model.md`, `docs/project/stack.md`, `docs/project/domain.md`, and `docs/project/client.md` exist and the old flat paths `docs/api-spec.yml` and `docs/data-model.md` do not

#### Scenario: Project context preserved
- **WHEN** `docs/project/stack.md`, `docs/project/domain.md`, and `docs/project/client.md` are read
- **THEN** they contain the Riff project context previously held in `docs/base-standards.md` §8 (stack/architecture, domain, client) without loss of information

#### Scenario: Canonical base standards
- **WHEN** `docs/base-standards.md` is diffed against the version shipped in the installed package
- **THEN** it matches the package version (pure principles template, no project-specific §8)

### Requirement: Path references updated in project-owned documentation and living specs
All active references to `docs/api-spec.yml` and `docs/data-model.md` in project-owned documentation (`docs/documentation-standards.md`, `docs/seed-catalog.md`, `README.md`, `apps/backend/README.md`) and in living OpenSpec specs (`openspec/specs/**/*.md`) SHALL point to the new canonical paths.

#### Scenario: No stale references in active files
- **WHEN** the project-owned docs and `openspec/specs/**/*.md` are searched for `docs/api-spec.yml` or `docs/data-model.md` (flat form)
- **THEN** no occurrences remain

#### Scenario: Archived changes untouched
- **WHEN** `openspec/changes/archive/**` is compared against its pre-migration state
- **THEN** no file was modified

### Requirement: Design and app docs unaffected
The migration SHALL NOT modify `docs/design/**`, `docs/ci-standards.md`, `docs/deploy-standards.md` content, `docs/frontend-standards.md` content, `docs/backend-standards.md` content, or any file under `apps/*/src`.

#### Scenario: Application code untouched
- **WHEN** `git diff` is reviewed after the migration
- **THEN** no changes appear under `apps/*/src`, `docs/design/`, or the content of the per-stack standard docs (path-reference lines in `documentation-standards.md` excepted)
