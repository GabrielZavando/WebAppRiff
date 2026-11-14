## Why

The Angular administration panel (`apps/admin`) has no publication path to the shared hosting the client just contracted at Tecnoinver: its only deployment lane is the nginx container image (`apps/admin/Dockerfile` + `apps/admin/nginx.conf`), and the staging Coolify services were removed, so the panel is not reachable on any subdomain. The hosting already has a proven FTPES lane for the public site (`scripts/deploy/upload-web.sh`), but that script assumes the Astro MPA layout (`_astro/`, `404.html`, stale HTML cleanup) and does not fit the Angular SPA build (`apps/admin/dist/admin/browser/`, content-hashed chunks at the root, `index.html` as the single bootstrap and an SPA fallback in `.htaccess`).

## What Changes

- A manual admin panel deployment script, `scripts/deploy/upload-admin.sh`, is added. It orchestrates the full cycle in a single command: build environment variable validation → production environment generation → Angular build → `.htaccess` contract verification → bundle marker check → FTPES upload → post-deployment verification in the hosting.
- The script reuses the pattern already established in `scripts/deploy/upload-web.sh`: FTPES connection with `lftp` (port 21, `ftp:ssl-force`, `ftp:ssl-protect-data`, passive mode, `glob:dot 1`), credentials read from environment variables that are never printed, secret validation that fails fast naming the missing secret, and a temporary `HOME` so the operator's `~/.lftprc` is never touched.
- The common secret validation and FTPES session logic is extracted into `scripts/deploy/ftp-common.sh`, shared by `upload-web.sh` and `upload-admin.sh`, without changing the observable behavior of the public site lane.
- The admin upload follows a **safe order**: first the content-hashed immutable files (`chunk-*.js`, `main-*.js`, `styles-*.css`, `media/*`), then the non-hashed static files (`assets/*`, `logo_riff.png`), then the `.htaccess`, and **last the `index.html`**. A client never receives a new `index.html` pointing at chunks that have not been uploaded yet.
- The script **deletes no remote file**. Old content-hashed chunks accumulate; this is intentional, because deleting them breaks active user sessions that still resolve the bundles referenced by a cached `index.html`. The runbook documents this explicitly.
- The script runs in **plan mode by default**: it generates the build, runs every gate, performs a read-only access check and prints the upload plan and the generated `lftp` command file **without writing to the hosting**. The real write requires an explicit `--publish` flag.
- The script includes a guard against the worst possible failure: if the remote root contains `_astro/` (the signature of the public site build), it aborts, because that account hosts the public site and uploading the admin there would overwrite its `index.html` and its `logo_riff.png`.
- The admin panel is deployed to `admin-staging.somosriff.cl`, using an FTP account and folder that are **independent from the public site's account**. The guard above remains in place as a safety net.
- `docs/deploy-standards.md` documents the manual procedure: required variables and secrets, exact commands, the upload order and its rationale, the warning that old content-hashed chunks are never deleted, the manual pre-deployment checklist (admin origin in the backend CORS allowlist and subdomain in the Firebase Auth authorized domains) and the rollback procedure.
- The shape of the future GitHub Actions workflow for automatic publication is documented, **but not implemented** in this change.
- The staging deployment model of the admin panel changes: from the removed container/Coolify lane to a manual FTPES lane on the shared hosting, on a subdomain with its own FTP root. The backend, the public site and production are out of scope.

## Capabilities

### New Capabilities

- `admin-ftp-deployment`: manual publication of the Angular administration panel (`apps/admin`) to `admin-staging.somosriff.cl` over FTPES, with a reproducible build, a safe upload order, pre- and post-deployment gates, a guard against the wrong hosting account and a documented runbook.

### Modified Capabilities

- `deployment-architecture`: the admin panel is no longer a "static service whose publication mechanism is out of scope"; it becomes an independently deployable static service published to its own subdomain on the shared hosting by a versioned manual script over FTPES, with its automatic CI/CD publication explicitly deferred to a later cycle.

## Impact

- **Code and configuration**: new files `scripts/deploy/upload-admin.sh`, `scripts/deploy/ftp-common.sh`, `apps/admin/scripts/check-bundle-markers.mjs` and their tests; a behavior-preserving refactor of `scripts/deploy/upload-web.sh`; new npm scripts in `apps/admin/package.json`. **The Angular application code is not modified** (`base href="/"` and the `.htaccess` are already correct for a subdomain with its own document root), nor are its `Dockerfile`, its `nginx.conf` or the monorepo `package-lock.json`.
- **External infrastructure**: the admin panel subdomain `admin-staging.somosriff.cl` with its own FTPES root at Tecnoinver, the credentials of that account, the admin origin registered in the backend CORS allowlist on Cloud Run (`ANGULAR_ADMIN_URL`) and in the Firebase Auth authorized domains.
- **Documentation**: `docs/deploy-standards.md` (admin manual deployment runbook) and the `deployment-architecture` spec delta.
- **Out of scope**: automatic CI/CD publication of the admin panel, production deployment, revival of the admin Docker/nginx lane, deletion of old chunks in the hosting, changes to the public site and any modification of the backend.
