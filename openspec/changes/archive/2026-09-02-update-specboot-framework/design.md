# Design: update-specboot-framework

## Context

The project bootstrapped SDD tooling by copying the old Specboot template into the repo root: `opencode.json` with inline agents/commands, a flat `docs/` layout, `Makefile`/`specboot.sh`/`check-refs.sh`/`update.sh` at root, and no version tracking. Specboot now ships as the npm package `@gabrielzavando/specboot` (GitHub Packages) whose `specboot update` replaces framework-owned ("intocable") files with backup while deliberately skipping all of `docs/` and project code (verified in the v0.1.1 `update` implementation: `UPDATE_ITEMS[]` + `case docs/*) continue`).

Key verified facts driving the design:

- The project is an **npm workspaces monorepo** with a single root `package-lock.json`; no `apps/*` has its own lockfile. Root scripts already iterate workspaces (`npm run lint --workspaces`, etc.).
- `specboot.sh --ci` (post-update validator) requires `docs/api/api-spec.yml`, `docs/data-model/data-model.md` and `.github/pull_request_template.md` (present).
- `specboot update` copies `.github/workflows/` file-by-file: it overwrites `ci.yml`/`deploy.yml` and **adds `release.yml`**, which would attempt `npm publish` of `riff-catalogo-digital` on every push to `main`.
- The old project `Makefile`'s `solid-lint` is vacuous here (guarded by `[ -d src ]`; no root `src/`), so today's CI "SOLID" job already enforces nothing.
- The new framework `Makefile` reads `services`/`stack` from `.specboot.json` and runs per-service `npm ci||npm install`; its `solid-lint` is advisory (eslint failures do not abort the target).
- GitHub Packages requires authentication for npm reads even for same-owner public packages; CI has no PAT — only the scoped `GITHUB_TOKEN`.

## Goals / Non-Goals

**Goals:**
- Consume Specboot as a versioned npm devDependency with a repeatable update path (`npm update` + `specboot update` + backup + runbook).
- Keep the project's own CI behavior (`ci.yml` with `develop`/`feature/**` triggers, Node 20, per-job `make` targets) while making `npm ci` at root resolve the private package.
- Adopt the canonical docs layout and the framework-canonical `base-standards.md` without losing the Riff project context.
- Enforce Conventional Commits at commit time (Husky `commit-msg` + commitlint).
- Leave application code (`apps/*/src`), API contract content, and data model content untouched.

**Non-Goals:**
- Fixing the framework itself (handled in a parallel Specboot-repo change: `ci.yml` token fix, optional `tsconfigRootDir` in `templates/ci/eslintrc.*.js`).
- Migrating `openspec/changes/archive/**` references (historical artifacts stay frozen).
- Activating the new generic `deploy.yml` (stays gated off until VPS/provider decision).
- Real SOLID mechanical enforcement in CI (already vacuous today; framework-side improvement later).
- Changing npm workspace topology (no per-app lockfiles introduced).

## Decisions

1. **Install path: devDependency + manual `.specboot.json` + `specboot update`** (not `specboot init`).
   *Why*: `init` is designed for empty projects — it skips every existing file ("Omite $item (ya existe)"), so it would not actually upgrade anything, and its docs skeleton is meant for fresh scaffolds. `update` backs up and replaces exactly the intocable set, skipping `docs/`. The `update` guard requires `.specboot.json`, so we create it manually with `frameworkVersion` equal to the installed package version (making the version jump `eq`/`patch` — no interactive prompt).
   *Alternative rejected*: `specboot init --interactive` (no-op for existing files, wrong semantics).

2. **`.specboot.json` with `services: ["."]`, `stack: ["node"]`**.
   *Why*: with `["."]` the framework Makefile's `install` runs `npm ci` at root (uses the single root lockfile, installs all workspaces) and `lint/test/build/audit` delegate to the existing root `--workspaces` scripts — exactly today's CI behavior. Declaring the three apps would make `install` run `npm install` per service without a lockfile (unreproducible, duplicates trees, risks missing root-hoisted tooling).
   *Alternative rejected*: `services: ["apps/backend","apps/web","apps/admin"]` (cleaner `solid-lint` scoping, but breaks install reproducibility; `solid-lint` is advisory anyway).

3. **Keep the project's `ci.yml`; patch it minimally for GitHub Packages auth**.
   *Why*: the project's CI triggers on `develop`/`feature/**` (framework's triggers only `main`) and matches the team's flow. After the migration, `make install` = `npm ci` at root, which resolves `@gabrielzavando/specboot` → needs `packages: read` permission, `registry-url` in `setup-node`, and `NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}`. The patch is ~3 lines per affected job plus a workflow-level `permissions` block. Repo access to the package is granted once in Package settings (Manage Actions access).
   *Alternatives rejected*: adopt framework `ci.yml` (loses branch coverage; would also need auth fix upstream — tracked as the parallel Specboot change); disable CI (loses the project gate).

4. **Post-update reconciliation as explicit tasks**: restore project `ci.yml` from backup + apply auth patch; delete framework `release.yml`; keep framework `deploy.yml` (gated by `vars.DEPLOY_ENABLED`, inert until configured); delete root `update.sh` (deprecated, not shipped to consumers) and `tests/*.sh` (template self-tests — the framework `ci.yml` would run them as dogfooding and they test deprecated tooling).
   *Why*: `release.yml` in a consumer repo attempts to publish the app package to a registry on push to `main`; the template self-tests reference pre-migration structure.

5. **Canonical docs layout via `git mv`, references updated, archives frozen**.
   *Why*: `specboot.sh --ci` validates the canonical paths; `git mv` preserves history. Project-owned docs (`documentation-standards.md`, `seed-catalog.md`, READMEs) and living specs (`openspec/specs/**/*.md`) get path-reference updates; `openspec/changes/archive/**` stays untouched (historical record).

6. **Adopt framework-canonical `docs/base-standards.md`; extract Riff context to `docs/project/{stack,domain,client}.md`**.
   *Why*: in the new contract `base-standards.md` is intocable (replaced by future updates) and project context lives in `docs/project/` (conditionally loaded by the new `AGENTS.md` bridge). The old §8 context maps 1:1 to those three files.
   *Alternative rejected*: keep the customized `base-standards.md` (leaves the project outside the contract; future updates would silently skip it).

7. **Husky: `commit-msg` hook only (commitlint)**.
   *Why*: root `package.json` already ships `husky` + `.commitlintrc.json` but never activated (no `prepare` script, no `.husky/`). The `commit-msg` hook closes the Conventional Commits loop at the source (the kept `ci.yml` also validates via `make commitlint`). The `pre-commit` sample generated by `husky init` is removed to avoid surprise slow commits; adding lint-staged-style pre-commit work is out of scope.

8. **Framework fix (Specboot repo) runs in parallel, non-blocking**.
   *Why*: the framework's own `ci.yml` lacks `packages: read` + `registry-url` + `NODE_AUTH_TOKEN`, so consumer `npm install` fails 401 — a framework bug worth fixing at source (dogfooding), but this project is unaffected because it keeps its own patched `ci.yml`.

## Risks / Trade-offs

- [Every future `specboot update` re-copies framework `ci.yml` and `release.yml`] → Post-update runbook documented in the change: restore project `ci.yml` from the update backup, delete `release.yml`, re-apply auth patch if the backup predates it. Backups (`.specboot-backup-<ts>`, gitignored) make this mechanical.
- [`make solid-lint` is advisory and configs assume service-root CWD (`parserOptions.project: './tsconfig.json'`)] → Accepted: it is already vacuous in this project; real enforcement is a framework-side improvement (`tsconfigRootDir`, per-service CWD) in the parallel Specboot change.
- [`npm ci` at root in CI can 401 if the auth patch or package grant is missing] → Validation task simulates the CI install; the package grant (T0.3) is a hard prerequisite for CI green.
- [`AGENTS.md`/`opencode.json` replacement changes the agent context model (dynamic tag-based loading, no `opsx-*` commands)] → Decision accepted by stakeholder; the OpenSpec CLI remains available directly, and the `openspec-*` plugin skills under `.opencode/skills/` are untouched by `update`.
- [Docs path migration could break stale references] → Grep sweep across project docs + living specs (archived changes deliberately excluded); validated by `specboot.sh --ci` and check-refs.
- [Rollback] → Full state is recoverable via git (`git checkout`/branch) plus the update backup directory; the update itself is atomic per-item with backup-first ordering.

## Migration Plan

1. Parallel: Specboot-repo fix (own SDD cycle) — non-blocking for this repo.
2. Prereqs: package grant to repo (GitHub UI); verify published version (`npm view`).
3. Branch `feature/update-specboot-framework` → OpenSpec change artifacts (this change).
4. `.npmrc` + `npm install -D @gabrielzavando/specboot` + manual `.specboot.json`.
5. `specboot update --dry-run` → `specboot update` (backup) → reconcile (restore `ci.yml`+patch, delete `release.yml`, remove deprecated tooling).
6. Docs migration (`git mv` + references + `docs/project/*` + canonical `base-standards.md`).
7. Husky activation.
8. Validation suite (`specboot.sh --init`, `check-refs.sh`, `specboot.sh --ci`, `make` targets, CI-equivalent simulation, git diff scope check).
9. `/verify` → `/archive` → `/commit`.

Rollback: at any step, `git checkout .` / branch abandonment restores pre-migration state; the update backup dir is an extra safety net.

## Open Questions

None — all decisions confirmed with the stakeholder (keep project `ci.yml`; A2 for framework fix; discard `opsx-*`; adopt canonical `base-standards.md`; execute via SDD cycle).

## Post-Update Runbook

Whenever running `npm update @gabrielzavando/specboot` followed by `bash node_modules/@gabrielzavando/specboot/specboot.sh update`, perform the following mandatory post-update steps:

1. **Restore custom project CI workflow:**
   ```bash
   cp .specboot-backup-<timestamp>/.github/workflows/ci.yml .github/workflows/ci.yml
   ```
2. **Delete unwanted framework release workflow:**
   ```bash
   rm -f .github/workflows/release.yml
   ```
3. **Verify Auth patch in `ci.yml`:**
   Ensure `.github/workflows/ci.yml` retains `packages: read` permissions and `NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` setup for `make install`.
4. **Validate structure:**
   ```bash
   bash specboot.sh --ci && bash check-refs.sh
   ```

