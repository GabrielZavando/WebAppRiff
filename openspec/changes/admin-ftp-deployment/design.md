## Context

The administration panel is an Angular 22 SPA (`apps/admin`) without SSR: the builder is `@angular-devkit/build-angular:application` (`apps/admin/angular.json:20`), there is no `server` or `prerender` target (`apps/admin/angular.json:18-78`) and the `outputPath` is `dist/admin` (`apps/admin/angular.json:22`). The hosting runtime is LiteSpeed/cPanel serving static files; the admin `Dockerfile` is a container lane with nginx (`apps/admin/nginx.conf`) that this change does not touch.

Verified facts in the repository (the basis of the decisions, not assumptions):

- The publishable artifact is `apps/admin/dist/admin/browser/`: it contains `index.html`, `.htaccess`, `logo_riff.png`, `styles-*.css`, `main-*.js`, ~25 `chunk-*.js`, `media/*.woff2|woff` and `assets/img/logo-web.webp`. `3rdpartylicenses.txt` stays outside, in `apps/admin/dist/admin/`.
- The content-hashed bundles sit at the **root** of the output, not under `assets/`. That is why `nginx.conf:21` (which caches `/assets/*`) is weaker than the `.htaccess`, which caches by extension with `FilesMatch "\.(js|css|woff2|woff)$"`.
- `apps/admin/src/index.html:6` declares `<base href="/" />` and the favicon with the absolute path `/logo_riff.png`. The `.htaccess` rewrites to `/index.html` with an absolute server path (`apps/admin/src/.htaccess:52-60`). **Both are coherent only with a dedicated document root**, i.e. a subdomain with its own FTP root. This is why the client chose Option A instead of a subdirectory of the public site's FTP root: in a subdirectory the rewrite would serve the public site's `index.html`.
- The admin `.htaccess` **already exists and already travels inside the build**: `angular.json:29` copies it with `{ "glob": ".htaccess", "input": "src", "output": "/" }`. There is no manual "create the `.htaccess`" step; what must be verified is that the hosting allows `mod_rewrite` and `mod_headers`.
- `apps/admin/scripts/verify-htaccess.mjs` validates the LiteSpeed contract against `dist/admin/browser/.htaccess` (security headers, CSP with `font-src 'self' https: data:`, immutable cache by extension, `no-cache` for HTML, HTTP→HTTPS redirect **before** the fallback, absence of `Options`/`SetEnvIf`/`env=`, and equality with `src/.htaccess`), and exits with code 1 when the build output is missing.
- Environment injection already exists: `apps/admin/scripts/write-env.mjs` generates `src/environments/environment.production.ts` (gitignored) from `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID` and `API_BASE_URL`; `angular.json:35-40` injects it into the production build through `fileReplacements`.
- **The build does not regenerate the environment**: `apps/admin/package.json:14` defines `prebuild: node scripts/sync-favicon.mjs` and there is no environment hook in `build`. The build uses whatever `environment.production.ts` exists at that moment.
- **The `postinstall` creates the production file with empty values**: `apps/admin/package.json:9` runs `write-env.mjs --target=prod --if-missing` and, for the `prod` target, `write-env.mjs:81` disables the placeholder bootstrap, so it writes empty strings when variables are missing (with a warning). A clean clone compiles "fine" and produces a silently broken bundle.
- **`API_BASE_URL` falls back to `http://localhost:3000/api/v1`** when it is not defined (`write-env.mjs:58-60`), without failing. And an `http://` URL in general **would not work**: the panel CSP is `connect-src 'self' https:` (`apps/admin/src/.htaccess:22`).
- `apps/admin/scripts/check-bundle-env.mjs` detects bundles built with placeholders, but **overwrites `environment.production.ts` with smoke values and rebuilds** (`check-bundle-env.mjs:11-14`, `:72-76`). On this machine that file currently holds `bundle-smoke-api-key` and `https://bundle-smoke.example.com/api/v1`: building without regenerating it publishes a bundle with smoke URLs.
- The public site's FTPES lane is mature and verified: `scripts/deploy/upload-web.sh` validates the secrets without printing them (`:5-27`), generates an `lftp` command file with forced TLS and `glob:dot 1` (`:40-58`) and uses `LFTP_PASSWORD`/`--env-password` with a temporary `HOME` (`:60-62`). `scripts/deploy/list-remote.sh` performs the read-only listing. `.github/workflows/deploy-web-staging.yml` orchestrates the site cycle with `workflow_dispatch` and a `listar`/`desplegar` mode.
- `scripts/deploy/upload-web.sh` is **specialized for the Astro layout**: `:53-57` chooses between uploading `_astro/` or "the rest" excluding `_astro`. It does not fit the admin as is.
- `scripts/smoke/admin.mjs` is the existing panel smoke test: it validates `/`, a deep route (it calls `/productos`, while the app's real route is `/products`, `apps/admin/src/app/app.routes.ts:39`), the presence of `<app-root>` and, if it finds an `/assets/*` link in the HTML, that it loads. The real `index.html` references `styles-*.css` and `main-*.js` relatively, so the `/assets/*` check falls into its notice branch (`smoke/admin.mjs:55-62`).
- No workflow builds or publishes `apps/admin`: `.github/workflows/` only contains `ci.yml` (gate + Docker build) and `deploy-web-staging.yml` (public site).
- The deployment documentation still describes an obsolete lane: `docs/deploy-standards.md:42` and `:61-67` attribute the admin to Coolify, and `docs/project/stack.md:30` describes it as an "independent service on a VPS with Coolify". The domains foreseen for the panel are `admin.somosriff.cl` (production) and `admin-staging.somosriff.cl` (staging) (`docs/deploy-standards.md:9`, `:160-164`).
- The staging backend runs on Cloud Run (`https://riff-api-staging-345601325361.southamerica-west1.run.app/api/v1`) and its CORS allowlist is fed by `ANGULAR_ADMIN_URL` (`docs/deploy-standards.md:362`), which makes the panel origin an operational prerequisite rather than a deployment detail.

Decisions confirmed by the client for this cycle:

- The panel is deployed to `admin-staging.somosriff.cl`.
- Its FTP account and folder are **independent from the public site's account**; the account guard below remains as a safety net.
- Old content-hashed chunks are **never deleted**. This is intentional: deleting them would break active user sessions whose cached bootstrap document still references them.
- One full-cycle script, `--publish` opt-in, and the shared `ftp-common.sh` extraction are all confirmed.

Constraints fixed for this cycle:

- **Manual** deployment of the admin panel. Automatic publication through CI/CD is a later change.
- Option A: subdomain with its **own FTP root** → the Angular code is not modified (`base href` and `.htaccess` are already correct).
- Credentials come from environment variables; never in the repository nor in the logs.
- Reuse the established FTPES pattern without introducing new monorepo dependencies (`lftp` is a system tool, not an npm dependency).
- `apps/admin/src`, its `Dockerfile`, its `nginx.conf` and `package-lock.json` are not touched.

## Goals / Non-Goals

**Goals:**

- Give the admin panel a reproducible, auditable publication path versioned in the repository, on the same shared hosting where the public site already lives.
- Reuse the already proven FTPES lane (`lftp`, secret validation, TLS session) instead of inventing a new mechanism.
- Guarantee the hosting is never left inconsistent mid-publication (content-hashed assets first, `index.html` last).
- Prevent the worst possible failure: publishing the admin over the public site's FTP account and overwriting its `index.html` and its `logo_riff.png`.
- Prevent publishing a bundle with placeholders, smoke values or an invalid API URL.
- Leave the procedure and its prerequisites written down so another operator can repeat it.
- Leave the path towards automatic publication documented, without implementing it.

**Non-Goals:**

- Automating the admin publication with GitHub Actions (deferred to a later change).
- Deploying to production.
- Modifying the backend, its Cloud Run variables or its CORS allowlist from the repository.
- Modifying the Angular application code, its `Dockerfile`, its `nginx.conf` or its `.htaccess`.
- Deleting old chunks or any file in the hosting.
- Retiring the admin Docker/nginx lane; it coexists with the LiteSpeed lane.
- Restructuring the public site publication lane beyond the shared refactor described in D2.

## Decisions

### D1 — One full-cycle script, not a upload-only binary

`scripts/deploy/upload-admin.sh` orchestrates the whole cycle: validate environment → generate the production environment → build → verify `.htaccess` → check bundle markers → upload → verify hosting.

**Why not two scripts (`build-admin.sh` + `upload-admin.sh`):** the manual panel cycle has four documented traps (the build does not regenerate the environment; the `postinstall` leaves the production file empty; `API_BASE_URL` falls back to `localhost`; the production file may hold smoke values from a previous execution). Splitting build and upload turns each of them into a silent failure the operator may not notice. Chaining them in a single command means none can be skipped. The full-cycle script is also directly reusable by the future workflow: the future publish job will be a single call to it.

**Why not a Node binary instead of bash:** the established lane (`scripts/deploy/*.sh`) is bash with `lftp`; introducing a deployment runner in Node would add a dependency and a new secret-handling model. The only Node component will be a bundle marker checker, because string comparison is trivial and testable in JS (D7).

**Consequence:** the script requires Node 24 and `lftp` on the operator's machine. Documented as a prerequisite.

### D2 — The common FTPES logic is extracted into `scripts/deploy/ftp-common.sh`

The secret validation (`upload-web.sh:5-27`) and the session configuration (`:40-58`, `:60-62`) are extracted into a shared file that both scripts load. The rejected alternative is **copying the block** into `upload-admin.sh`: duplicating security code in two files that run against production is exactly the pattern `docs/base-standards.md` (§1) asks to abstract, and a future fix (for example, rejecting an additional control character) would only land in one copy.

**Accepted risk:** a script of the public site lane, already in production, is modified. It is bounded as follows: the refactor is purely extractive (moving code into `ftp-common.sh` and replacing it with a `source` that does not change semantics), the observable behavior of the web lane does not change, and the `make ci` gate plus the existing workflow contract tests (`scripts/__tests__/deploy-web-staging-workflow.test.mjs`) keep enforcing the same requirements. If the change turns out to be invasive, plan B is to leave `upload-web.sh` untouched and extract a copy with a parity test instead; that is decided during implementation with the criterion "if the diff of `upload-web.sh` goes beyond moving code, use plan B".

### D3 — Four-phase upload, with `index.html` always last

```
  phase 1  chunk-*.js, main-*.js, styles-*.css, media/**     (immutable, content-hashed)
  phase 2  assets/**, logo_riff.png                            (non-hashed static)
  phase 3  .htaccess                                           (LiteSpeed contract)
  phase 4  index.html                                          (SPA bootstrap)  <-- ALWAYS last
```

**Why:** `index.html` is the single entry point of the SPA and carries `Cache-Control: no-cache`, so it is the only file whose content effectively changes version. If it were uploaded before the bundles, a client downloading it in that window would receive a document referencing non-existent chunks → blank screen and 404s in the console. Uploading the bootstrap last reduces the inconsistency window to "an old `index.html` with a few extra new chunks", which is harmless: the old chunks are not deleted (D4).

**Why phase 3 before phase 4:** the `.htaccess` is the contract for headers, cache and the SPA fallback. Publishing it before the `index.html` guarantees that, when the new bootstrap comes into play, the server already applies the expected LiteSpeed contract.

**Why phase 2 before phase 3:** `logo_riff.png` and `assets/**` are referenced by the document; the favicon additionally by an absolute path.

**Mechanism:** the script generates an `lftp` command file with explicit, delimited phases, so the order is verifiable by reading that file (and testable without network). The concrete choice between `mirror` with `--include-glob` and `put`/`mput` per group is resolved during implementation; what the spec fixes is the order and its verifiability.

**Rejected alternative — uploading a zip and extracting it in the hosting:** it requires the Tecnoinver panel to offer extraction or SSH, which is not guaranteed; and the extraction is not atomic.

### D4 — Non-destructive publication: zero deletions

The script deletes nothing. Old content-hashed chunks accumulate.

**Why:** deleting them breaks clients that cached a previous `index.html`, which still references them → 404 bundles in live sessions. This is the same reason the public site lane keeps the old `_astro/` assets.

**Consequence:** the hosting grows by ~25 files per publication. It is accepted as a cost and documented in the runbook, with the warning not to remove them by hand without the same care. The long-term retention policy is out of scope.

### D5 — Guard against the wrong account, based on the public site signature

Before writing, the script lists the remote root and aborts if it finds `_astro/` (the directory only the Astro build generates) or `404.html` (the document only the public site generates). The admin build contains neither.

**Why:** the admin's `index.html` would overwrite the public site's `index.html`, and `logo_riff.png` as well (both builds contain it), silently destroying the live site in a way that is hard to revert from the hosting. This is the worst failure this change can produce and the cheapest to prevent.

**Why not compare against a hash of the public site:** the public site changes with every publication; there is no stable fingerprint to compare against. The presence of `_astro/` is stable, because the public site always has it and the admin never does.

**Why not rely only on the credentials being different:** exporting the wrong variables in the shell is a one-line mistake with large consequences; the guard turns it into an early, noisy failure.

**Confirmed state:** the admin account is in fact independent, so the guard will not trigger in the normal flow. It stays as a safety net.

### D6 — Plan mode by default, write only with an explicit flag

Without the flag, the script generates the build, runs all the gates, performs a read-only access check, prints the plan and the `lftp` command file, and exits **without writing anything**. With the publish flag, it uploads and verifies.

**Why:** unlike the public site workflow (where the default mode is `listar` because GitHub only lets you launch a workflow that already exists in the default branch), this script runs directly on the operator's machine: the safe default is "do not publish". The cost is one extra step (`--publish`), acceptable in a manual procedure.

**Why plan mode connects read-only:** it needs to confirm that the credentials work and that the account is the right one (D5) before the operator commits to publishing; a read-only check leaves no state in the hosting.

### D7 — Environment and bundle gates before compiling and before uploading

Three validations, all before the write:

1. **Variables**: the five build variables must be defined and non-empty; the error names the missing variable.
2. **Semantics**: `API_BASE_URL` must use `https` (the CSP is `connect-src 'self' https:`); marker values (`dev-placeholder-*`, `bundle-smoke-*`) are rejected.
3. **Bundle**: after compiling, `apps/admin/dist/admin/browser/` is traversed and checked for the absence of markers and the presence of the injected `API_BASE_URL` and API key.

**Why a bundle check instead of reusing `check-bundle-env.mjs`:** that script **rewrites** `environment.production.ts` with smoke values and rebuilds (`check-bundle-env.mjs:11-14`), i.e. it is a destructive test of the working environment, not a publication gate. A **read-only** checker over the `dist/` is needed, which is a new, small component: `apps/admin/scripts/check-bundle-markers.mjs`.

**Why also checking the presence of the injected values:** the absence of markers does not rule out a bundle built against another environment (for example, a previous execution); requiring the injected `API_BASE_URL` and API key to appear ties the published artifact to the concrete execution.

### D8 — Post-deployment verification in the hosting: existing smoke plus explicit HTTP checks

After the upload: `scripts/smoke/admin.mjs` with `SMOKE_ADMIN_URL` (which must be defined in order to publish), plus HTTP requests against the subdomain for the root, a real deep route of the app (`/products`) and a content-hashed asset taken from the local build.

**Why the smoke alone is not enough:** it validates `/` and a deep route, but it does not check headers, and its deep route `/productos` is not a real route of the app (`/products`), so it is actually exercising the SPA fallback with an arbitrary path. The explicit check of `/products` covers the real route, and the `curl -I` against a real content-hashed asset covers bundle resolution.

**Why `SMOKE_ADMIN_URL` is required:** without the panel URL there is no possible post-deployment verification; the script must fail before uploading rather than publish without checking anything.

### D9 — The future GitHub Actions lane is documented, not implemented

In `design.md` and in the runbook, the shape of the workflow is described: manual `workflow_dispatch`, `environment: staging`, `permissions: contents: read`, `concurrency` without cancellation, a read-only access-check job and a publish job that invokes `scripts/deploy/upload-admin.sh --publish` with the environment's variables and secrets. It is explicitly declared that its implementation belongs to a later change.

**Why not implement it now:** the user explicitly asked to "define and run the strategy" and left automation for a later change; moreover, an automated workflow that writes to the hosting without having gone through the manual procedure is exactly the order of risk to avoid.

### D10 — The `deployment-architecture` delta and the new capability are written in English

From this cycle onwards, **all specs and deltas are written in English**, which is the primary language of the AI models and yields better precision in validation. The delta for `deployment-architecture` and the new capability `admin-ftp-deployment` follow that rule, as do the rest of the artifacts of this change.

**Consequence:** `openspec/config.yaml` states the same convention, so future changes do not contradict it.

### D11 — The admin Docker/nginx lane remains intact

`apps/admin/Dockerfile` and `apps/admin/nginx.conf` are not touched and `make docker-build` keeps building the admin image. The `.htaccess` remains the source of truth for the contract on LiteSpeed and `nginx.conf` for the container lane, as fixed by the `add-frontend-smoke-and-nginx-hardening` spec.

**Why:** the production panel may keep running in a container; this change only defines the staging lane on the shared hosting. Retiring the Docker lane here would be a deployment architecture change that was not requested.

### D12 — The script contract is covered by tests

Tests verify, without needing a network: the phase order in the generated `lftp` command file, the absence of delete commands, the environment variable validation (including the empty value, `http` scheme and marker cases), the behavior of the bundle marker checker, the use of the shared FTP library by both scripts and the behavioral parity of the web lane.

## Risks / Trade-offs

- [The operator exports the public site's credentials by mistake] → D5 guard: aborts on detecting `_astro/` or `404.html` in the remote root, before writing.
- [The hosting does not apply the `.htaccess` because `AllowOverride` does not allow `mod_rewrite`/`mod_headers`] → the panel would load but deep routes would 404 and there would be no security headers; the runbook requires checking it with `curl -I` (status 200 + `X-Frame-Options` + `Cache-Control`), because `verify:htaccess` only validates the local file, not its application on the server.
- [`environment.production.ts` contains smoke or empty values] → D7 gate: the bundle checker fails before uploading; the script also always regenerates the file in overwrite mode.
- [`API_BASE_URL` without `https` or pointing at `localhost`] → the script rejects non-`https` schemes; an explicit `localhost` is rejected as well, because it is not an absolute URL of a reachable host.
- [The refactor of `upload-web.sh` introduces a regression in the live public site] → purely extractive refactor without semantic change, covered by the existing workflow contract tests and by `make ci`; plan B defined in D2.
- [Unbounded accumulation of old chunks in the hosting] → accepted cost (D4); cleaning it requires a retention policy that is not defined and is out of scope.
- [The existing smoke uses `/productos` instead of `/products`] → the script adds an explicit check of `/products` (D8); fixing the shared smoke script is deferred, because it is also used by the container lane.
- [The panel CSP (`connect-src 'self' https:`) blocks some Firebase Auth call] → the panel is a Firebase Auth web client with requests to `https://*.firebaseapp.com` and to `identitytoolkit.googleapis.com`, both `https`, so the CSP allows them; the real risk is `frame-ancestors` and `X-Frame-Options: DENY` on the Auth popup, which is verified empirically on the first publication (manual login test in the checklist).
- [The panel does not start because its origin is not in the backend CORS allowlist] → the runbook requires it as a pre-deployment checklist item, not an optional step; the failure surfaces at login, with the panel visible.
- [The panel subdomain is not among the Firebase Auth authorized domains] → same treatment: mandatory pre-deployment checklist item.
- [The panel has no subdomain, certificate or FTP root yet] → an operational prerequisite outside the repository, collected in section 1 of `tasks.md`; without it the script cannot run and the change stops there.

## Migration Plan

1. **Operational prerequisites (outside the repository)**: the admin panel subdomain `admin-staging.somosriff.cl` with its own FTPES root, DNS, SSL certificate and `AllowOverride` enabling `mod_rewrite`/`mod_headers`; the panel origin in the backend CORS allowlist (`ANGULAR_ADMIN_URL` on Cloud Run); the subdomain in the Firebase Auth authorized domains.
2. **Implementation**: tests first (TDD) for the script contract, the marker checker and the shared FTP library; then the shared library, the extractive refactor of `upload-web.sh`, the checker, the publication script and the runbook.
3. **First deployment in plan mode**: run `scripts/deploy/upload-admin.sh` without the publish flag; check the plan, the phase order and that the D5 guard does not trigger.
4. **Real publication**: run with the publish flag; check that the smoke and the HTTP checks pass and that the published `index.html` is the one from the build (for example, comparing the `main-*.js` reference with the local `dist/`).
5. **Manual browser verification**: login with a real user of the staging Firebase project, load `/products`, navigate to a deep route and reload that same route (SPA fallback test), and check the headers with `curl -I`.
6. **Documentation**: update `docs/deploy-standards.md` (admin lane, runbook, variables, checklist, rollback) and `docs/project/stack.md` (which currently attributes the panel to Coolify) so the documentation reflects the current lane.

**Rollback:** republish the previous build. Because the script is deterministic and the whole operation is "generate environment → build → upload", the rollback consists of running the script again from the previous repository commit with the same variables, which produces and uploads the good build. Because the publication deletes nothing, the failed build's `index.html` is replaced and the chunks of both versions stay available.

## Open Questions

- **None blocking this cycle.** The subdomain is `admin-staging.somosriff.cl`, the FTP account and folder are independent from the public site's account, old chunks are never deleted by design, and the single-script, `--publish`, `ftp-common.sh` and read-only bundle checker approaches are all confirmed.
- **Retention policy for old chunks** → undefined by design in this cycle; out of scope.
- **Fixing the deep route in `scripts/smoke/admin.mjs`** (`/productos` → `/products`) → deferred to a separate change, because that script is shared with the container lane.
