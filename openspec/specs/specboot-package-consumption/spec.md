# specboot-package-consumption Specification

## Purpose
TBD - created by archiving change update-specboot-framework. Update Purpose after archive.
## Requirements
### Requirement: Specboot installed as npm devDependency from GitHub Packages
The project root `package.json` SHALL declare `@gabrielzavando/specboot` as a devDependency resolved from `https://npm.pkg.github.com`, and a committed root `.npmrc` SHALL map the `@gabrielzavando` scope to that registry without embedding any auth token.

#### Scenario: Local resolution
- **WHEN** a developer with a `read:packages` PAT in their user-level `~/.npmrc` runs `npm install` at the repo root
- **THEN** `node_modules/@gabrielzavando/specboot` is populated and `package-lock.json` records the GitHub Packages registry URL for that scope

#### Scenario: No token in committed config
- **WHEN** the root `.npmrc` is inspected
- **THEN** it contains only the scope-to-registry mapping and no `_authToken` value

### Requirement: Project declared via .specboot.json
The project root SHALL contain a `.specboot.json` declaring `frameworkVersion` equal to the installed package version, `name` `riff-catalogo-digital`, `services: ["."]`, and `stack` including `node`.

#### Scenario: Config valid
- **WHEN** `node -e "require('./.specboot.json')"` is run
- **THEN** the JSON parses and exposes `services` `["."]` and a node stack entry

#### Scenario: Framework Makefile parametrization
- **WHEN** `make help` is run at the repo root
- **THEN** the output reports the detected services (`.`) and stack (`node`)

### Requirement: Framework Make targets delegate to root workspaces scripts
With `services: ["."]` and a node stack, the framework `Makefile` targets SHALL operate on the project root: `make install` SHALL run `npm ci` at the root (installing all workspaces), and `make lint`, `make test`, `make build`, and `make audit` SHALL invoke the corresponding root package scripts that iterate workspaces.

#### Scenario: Install uses the single root lockfile
- **WHEN** `make install` runs
- **THEN** `npm ci` executes at the repository root and installs workspace dependencies

#### Scenario: Lint and test cover all workspaces
- **WHEN** `make lint` and `make test` run
- **THEN** each workspace (`apps/backend`, `apps/web`, `apps/admin`) is linted and tested through the root `--workspaces` scripts

