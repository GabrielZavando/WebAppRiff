## 1. Operational prerequisites (outside the repository)

- [x] 1.1 Confirm with Tecnoinver the admin panel subdomain `admin-staging.somosriff.cl` and that its FTP root is the document root of that subdomain (Option A), and that the account and folder are **independent from the public site's account**
- [ ] 1.2 Create the DNS record for the admin panel subdomain and issue/install its SSL certificate
- [ ] 1.3 Confirm that the hosting allows `mod_rewrite` and `mod_headers` (`AllowOverride`) and check it with a real HTTP request that returns the `.htaccess` headers (status 200, `X-Frame-Options: DENY` and `Cache-Control` on the HTML)
- [ ] 1.4 Register the panel origin in the staging backend's CORS allowlist (`ANGULAR_ADMIN_URL` variable of the Cloud Run service) and check it with an `Origin:` request against `/health`
- [ ] 1.5 Register the admin panel subdomain among the authorized domains of Firebase Authentication in the `riff-catalogo-staging` project
- [ ] 1.6 Confirm the staging values exported on every run (`FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID`, `API_BASE_URL` with the `https` scheme) and that the operator's machine has Node 24 and `lftp` installed

## 2. Script contract tests (TDD: failing test first)

- [x] 2.1 Create `scripts/__tests__/deploy-admin-contract.test.mjs` with the failing cases that require `scripts/deploy/upload-admin.sh` to exist, to use `set -euo pipefail`, and to invoke, in order, `write-env.mjs --target=prod` **without** `--if-missing`, `npm run build --workspace=@riff/admin`, `npm run verify:htaccess --workspace=@riff/admin` and the bundle marker checker
- [x] 2.2 Add the failing cases that require the script to contain no remote delete operation (`rm `, `mrm`, `--delete`, `--remove`) and no synchronization mode that removes remote files
- [x] 2.3 Add the failing cases for the environment validation: require the five build variables to be non-empty, reject an `API_BASE_URL` whose scheme is not `https`, reject `dev-placeholder-*` and `bundle-smoke-*` values, with messages naming the concrete variable
- [x] 2.4 Add the failing cases for the upload order: in the generated `lftp` command file, `index.html` appears after the content-hashed static files, after `assets/` and `logo_riff.png`, and after the `.htaccess`
- [x] 2.5 Add the failing cases for the wrong-account guard: the script aborts if the remote root contains `_astro/` or `404.html`, and does not abort otherwise
- [x] 2.6 Add the failing cases for plan mode: without the publish flag the script runs no remote write operation, and with the flag it publishes
- [x] 2.7 Add the failing cases for the post-deployment verification: the script requires `SMOKE_ADMIN_URL`, invokes `scripts/smoke/admin.mjs` and checks over HTTP the root, the deep route `/products` and a content-hashed asset taken from the local build
- [x] 2.8 Create `scripts/__tests__/check-bundle-markers.test.mjs` with the failing cases for the marker checker: it fails if the bundle contains a marker, fails if it does not contain the injected `API_BASE_URL` and API key, and passes with a coherent bundle
- [x] 2.9 Add the failing cases for the shared FTP library: `scripts/deploy/upload-web.sh` and `scripts/deploy/upload-admin.sh` both load `scripts/deploy/ftp-common.sh`, and the secret validation is not duplicated in either of them
- [x] 2.10 Run the new suite and confirm the cases fail because the implementation is missing (red test)

## 3. Shared FTP library

- [x] 3.1 Create `scripts/deploy/ftp-common.sh` with the secret validation extracted from `scripts/deploy/upload-web.sh` (absent/empty, leading/trailing spaces, control characters, with a message naming the secret) and with the `lftp` session generation (`ftp:ssl-allow yes`, `ftp:ssl-force yes`, `ftp:ssl-protect-data yes`, `ftp:port 21`, passive mode, `net:max-retries`, `net:timeout`, `net:idle`, `cmd:fail-exit`, `glob:dot 1`, credentials via `LFTP_PASSWORD`/`--env-password` and a temporary `HOME`)
- [x] 3.2 Refactor `scripts/deploy/upload-web.sh` to consume the library, **with no change in observable behavior** (same secrets, same session, same upload order for `_astro/` and the rest, same dotfiles)
- [x] 3.3 Run the tests from section 2 and `make ci`, and confirm the public site lane stays green

## 4. Bundle marker checker

- [x] 4.1 Create `apps/admin/scripts/check-bundle-markers.mjs`: traverse `apps/admin/dist/admin/browser/`, fail if it finds `dev-placeholder-*` or `bundle-smoke-*` markers (naming the file where they appear), fail if it does not find the injected `API_BASE_URL` and API key, and only read the `dist/` (never regenerate or modify the environment)
- [x] 4.2 Expose the checker as the npm script `check:bundle` in `apps/admin/package.json`
- [x] 4.3 Run its tests and confirm they pass

## 5. Admin panel publication script

- [x] 5.1 Create `scripts/deploy/upload-admin.sh` (executable) with `set -euo pipefail`, the publish flag and plan mode as the default, environment validation (the five variables non-empty, `https` scheme for `API_BASE_URL`, rejection of markers) and a fast failure naming the concrete variable
- [x] 5.2 Implement the production environment generation with `node apps/admin/scripts/write-env.mjs --target=prod` (without `--if-missing`) and the build with `npm run build --workspace=@riff/admin`
- [x] 5.3 Implement the pre-upload gate `npm run verify:htaccess --workspace=@riff/admin` and the marker checker, aborting before any write if either fails
- [x] 5.4 Implement the read-only listing of the remote root and the guard that aborts on `_astro/` or `404.html`, with a message explaining that the account hosts the public site and that the panel needs its own document root
- [x] 5.5 Implement the generation of the `lftp` command file with the four phases in order (content-hashed static → `assets/` and `logo_riff.png` → `.htaccess` → `index.html`), with the phases delimited and readable in the file
- [x] 5.6 Implement the FTPES upload reusing the shared library, with `glob:dot 1` so the `.htaccess` reaches the hosting, and with no remote delete operation whatsoever
- [x] 5.7 Implement the post-deployment verification: require `SMOKE_ADMIN_URL`, run `scripts/smoke/admin.mjs`, and check over HTTP the root, the deep route `/products` (HTML with 200, not a server-side 404) and a real content-hashed asset from the local build
- [x] 5.8 Implement plan mode: generate the build, pass the gates, check read-only access, print the phase plan and the `lftp` command file, and exit without writing anything to the hosting
- [x] 5.9 Run the tests from section 2 and confirm they pass

## 6. Documentation

- [x] 6.1 Add to `docs/deploy-standards.md` the admin panel lane (shared hosting over FTPES, manual script) and its runbook: required variables and secrets, the exact commands in order, the rationale of the phased upload order and what would happen if it were inverted, the rollback procedure, and the warning that old content-hashed chunks are intentionally never deleted so that active user sessions are not broken
- [x] 6.2 Add to `docs/deploy-standards.md` the manual pre-deployment checklist: the panel origin in the backend CORS allowlist, the subdomain in the Firebase Auth authorized domains, and the check that the hosting applies the `.htaccess`
- [x] 6.3 Document in `docs/deploy-standards.md` how the GitHub Actions workflow for automatic publication would look (same shape as the public site lane, invoking the script as its single step) and explicitly declare that its implementation belongs to a later change
- [x] 6.4 Fix in `docs/project/stack.md` the description of the admin panel, which today attributes it to Coolify, so it reflects the current staging lane on the shared hosting over FTPES, without touching the description of the backend or the public site
- [x] 6.5 Review the variables table in `docs/deploy-standards.md` so that `API_BASE_URL` and the admin's `FIREBASE_*` variables state that they are injected into the build by the publication script

## 7. Final gates

- [x] 7.1 Run `npx openspec validate --all --strict` and confirm the change and the delta specs are valid
- [x] 7.2 Run `make lint`, `make typecheck` and `make test` and confirm they pass with no changes to the application code
- [x] 7.3 Run `make docker-build` and confirm the admin's Docker lane still builds (`Dockerfile`, `nginx.conf` and the admin `.htaccess` were not touched)
- [x] 7.4 Check with `git diff --exit-code package-lock.json` that the lockfile has not changed
- [x] 7.5 Check that there is no workflow in `.github/workflows/` that builds or publishes `apps/admin`

## 8. End-to-end verification in the hosting

- [ ] 8.1 Run `scripts/deploy/upload-admin.sh` in plan mode and review the phase plan, the order of the generated `lftp` command file and that the wrong-account guard does not trigger
- [ ] 8.2 Run the real publication and confirm the smoke test and the post-deployment HTTP checks pass
- [ ] 8.3 Verify in the browser that the published `index.html` is the one from the build (the `main-*.js` reference matches the local `dist/`), that login works and that `/products` loads
- [ ] 8.4 Reload a deep route directly (`/products`) and confirm it responds 200 with the SPA document (SPA fallback working on LiteSpeed)
- [ ] 8.5 Check with `curl -I` the security headers and the `Cache-Control` of the HTML and of a content-hashed asset, and record the result in the delivery
