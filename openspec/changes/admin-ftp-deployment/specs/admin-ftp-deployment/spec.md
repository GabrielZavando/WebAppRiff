## ADDED Requirements

### Requirement: The manual admin panel deployment SHALL run through a versioned full-cycle script

The repository SHALL contain a script `scripts/deploy/upload-admin.sh` that executes, in a single command and in this order, the full publication cycle of the administration panel: (1) validation of the build environment variables, (2) generation of the production environment file, (3) the Angular build, (4) verification of the `.htaccess` contract against the build output, (5) a marker check over the bundle, (6) the FTPES upload and (7) post-deployment verification in the hosting. The script SHALL NOT modify the Angular application code, its `Dockerfile`, its `nginx.conf` or the monorepo `package-lock.json`.

#### Scenario: The script runs the full cycle in one invocation

- **WHEN** an operator runs `scripts/deploy/upload-admin.sh` with the environment variables and the FTP secrets defined
- **THEN** the script validates the environment, generates `src/environments/environment.production.ts`, builds `apps/admin`, verifies the `.htaccess`, checks the bundle, uploads the result over FTPES and verifies the hosting, without the operator having to chain the steps by hand

#### Scenario: An intermediate failure prevents publication

- **WHEN** any of the steps preceding the upload fails (environment, build, `.htaccess` verification or bundle check)
- **THEN** the script exits with a non-zero status code and performs no write operation on the hosting

#### Scenario: The script does not alter the application code

- **WHEN** the script runs
- **THEN** no file under `apps/admin/src` other than the generated environment file (which is gitignored) changes content, and `apps/admin/Dockerfile`, `apps/admin/nginx.conf` and `package-lock.json` remain untouched

### Requirement: The script SHALL validate the build environment variables before generating the bundle

The script SHALL require `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID` and `API_BASE_URL` to be defined and non-empty before invoking the environment generator, and SHALL abort naming the concrete variable that is missing or empty. The script SHALL generate the production environment in the mode that always overwrites the generated file (without `--if-missing`), so values from a previous execution are never reused by accident. The script SHALL reject an `API_BASE_URL` whose scheme is not `https`, because the panel's Content-Security-Policy (`connect-src 'self' https:`) would block such requests in the browser. The script SHALL reject development or smoke marker values (`dev-placeholder-*`, `bundle-smoke-*`).

#### Scenario: An environment variable is missing

- **WHEN** `API_BASE_URL` (or any of the other four variables) is absent from the process environment
- **THEN** the script aborts before generating the environment and before building, with a message naming the missing variable, and uploads nothing to the hosting

#### Scenario: The environment of a previous execution is not reused

- **WHEN** a previously generated `src/environments/environment.production.ts` exists with other values and the operator runs the script with new values
- **THEN** the generated file is overwritten with the values of the current execution and the resulting bundle contains the new values

#### Scenario: A non-HTTPS API base is rejected

- **WHEN** `API_BASE_URL` is defined with the `http://` scheme
- **THEN** the script aborts with a message explaining that the panel CSP only allows `https` connections, and no build is performed

#### Scenario: Marker values are rejected

- **WHEN** any of the Firebase variables contains a development or smoke marker (`dev-placeholder-*` or `bundle-smoke-*`)
- **THEN** the script aborts with a message naming the variable and the detected marker, and neither builds nor uploads anything

### Requirement: The panel build SHALL be verified against the LiteSpeed contract and against the injected values before it is uploaded

The script SHALL build `apps/admin` in the production configuration, SHALL run the existing verification `npm run verify:htaccess --workspace=@riff/admin` against the generated build and SHALL abort if that verification fails. The script SHALL additionally check the content of `apps/admin/dist/admin/browser/` and confirm that no development or smoke environment marker appears in it and that the injected `API_BASE_URL` and API key do appear. The publishable artifact SHALL be the content of `apps/admin/dist/admin/browser/`; the rest of `apps/admin/dist/admin/` is not part of the publication.

#### Scenario: The .htaccess verification blocks publication

- **WHEN** `npm run verify:htaccess --workspace=@riff/admin` fails against the generated build
- **THEN** the script exits with an error and uploads no file to the hosting

#### Scenario: A bundle with smoke values is detected

- **WHEN** the generated bundle contains a `dev-placeholder-*` or `bundle-smoke-*` marker
- **THEN** the script exits with an error identifying the marker and the file it appears in, and uploads nothing to the hosting

#### Scenario: The bundle contains the injected values

- **WHEN** the bundle check runs after a successful build
- **THEN** the bundle contains the `API_BASE_URL` and the API key injected in this execution

#### Scenario: Only the browser content is published

- **WHEN** the script prepares the upload
- **THEN** the set of files to upload is the content of `apps/admin/dist/admin/browser/`, and the `3rdpartylicenses.txt` file located outside that directory is not part of the publication

### Requirement: The publication SHALL run over FTPES with `lftp`, reusing the public site lane logic

The secret validation and FTPES session logic SHALL be extracted into a shared file `scripts/deploy/ftp-common.sh`, used by both `scripts/deploy/upload-admin.sh` and `scripts/deploy/upload-web.sh`. The observable behavior of the public site publication lane SHALL remain identical after the extraction. The FTPES session SHALL use port 21, `ftp:ssl-force` and `ftp:ssl-protect-data` enabled, passive mode, bounded retries and timeouts, and `glob:dot 1` so that dotfiles reach the hosting. The credentials `FTP_HOST`, `FTP_USER` and `FTP_PASSWORD` SHALL be read from environment variables, SHALL be validated before use with a fast failure naming the missing or invalid secret, and SHALL NOT appear in the script output, in printed commands or in the repository. The script SHALL NOT write the password to a `.netrc` nor to the operator's real `HOME`.

#### Scenario: Both lanes share the implementation

- **WHEN** `scripts/deploy/upload-web.sh` and `scripts/deploy/upload-admin.sh` are reviewed
- **THEN** both load the secret validation and the session configuration from `scripts/deploy/ftp-common.sh` and neither contains a second copy of that logic

#### Scenario: The public site lane behavior does not change

- **WHEN** `scripts/deploy/upload-web.sh` runs after the extraction
- **THEN** it validates the same secrets, opens the session with the same TLS configuration and publishes the public site with the same order and the same dotfiles as before the extraction

#### Scenario: An FTP secret is missing

- **WHEN** `FTP_HOST`, `FTP_USER` or `FTP_PASSWORD` is not defined or is empty
- **THEN** the script aborts before attempting to connect, with a message naming the missing secret, and prints no secret value

#### Scenario: Credentials do not leak

- **WHEN** the script fails during validation, connection or upload
- **THEN** neither the host, nor the user, nor the password appear in the script output

#### Scenario: The .htaccess reaches the hosting

- **WHEN** the publication completes
- **THEN** the `.htaccess` file at the root of the build is published at the document root of the admin panel subdomain

### Requirement: The upload SHALL run in an order that never exposes an inconsistent index.html

The upload SHALL be split into phases executed in this order: (1) the content-hashed immutable files — `chunk-*.js`, `main-*.js`, `styles-*.css` and the content of `media/` —, (2) the remaining non-hashed static files — `assets/` and `logo_riff.png` —, (3) the root `.htaccess` and (4) the `index.html` as the last file uploaded. The script SHALL build the `lftp` command file so that this order is explicit and verifiable in the generated file itself.

#### Scenario: The index.html is uploaded last

- **WHEN** the `lftp` command file for the admin panel publication is generated
- **THEN** the `index.html` appears after the content-hashed static files, after the non-hashed static files and after the `.htaccess`

#### Scenario: During the upload window the panel is never broken

- **WHEN** a user loads the panel while the upload is in progress
- **THEN** they receive either the previous `index.html` or the new one, and in both cases every bundle and stylesheet that document references is already available in the hosting

#### Scenario: The upload phases are identified in the plan

- **WHEN** the script prints the publication plan
- **THEN** it enumerates the upload phases in the order in which they will be executed

### Requirement: The publication SHALL be non-destructive

The admin panel publication script SHALL NOT delete, remove or replace files in the hosting: it SHALL run no remote delete command and SHALL NOT use a synchronization mode that removes remote files absent from the local build. Old content-hashed chunks SHALL remain in the hosting after every publication, so that active user sessions serving a cached bootstrap document keep resolving the bundles they reference.

#### Scenario: The script contains no delete operation

- **WHEN** the admin panel publication script is reviewed
- **THEN** it contains no remote delete command and no synchronization option that removes remote files absent from the local build

#### Scenario: Old chunks stay available

- **WHEN** a new version of the panel is published and a client holds the previous version's `index.html` in cache
- **THEN** the content-hashed chunks of the previous version are still present in the hosting and can be downloaded

### Requirement: The script SHALL abort when the FTP account belongs to the public site

Before writing, the script SHALL list the remote root and SHALL abort, without uploading anything, if it detects the signature of the public site build in it: the `_astro/` directory or the `404.html` file. The admin build contains neither of them. The cause SHALL be explicit in the error message, stating that the account corresponds to the public site and that the panel requires an account with its own document root.

#### Scenario: The public site account is detected

- **WHEN** the remote root contains the `_astro/` directory
- **THEN** the script aborts before uploading anything, with a message identifying the public site account, and it does not overwrite the public site's `index.html` or its `logo_riff.png`

#### Scenario: The correct account does not trigger the guard

- **WHEN** the remote root contains the panel's `index.html` and its `.htaccess` but no `_astro/` and no `404.html`
- **THEN** the guard does not trigger and the publication continues

### Requirement: The script SHALL separate the publication plan from the write

The script SHALL run in plan mode by default: it generates the build, runs all the gates, performs a read-only access check on the hosting and prints the publication plan and the content of the `lftp` command file **without writing, overwriting or deleting anything** in the hosting. The real write SHALL require an explicit publish flag. In plan mode the script SHALL NOT run any remote write command.

#### Scenario: The default run does not write to the hosting

- **WHEN** an operator runs the script without the publish flag
- **THEN** the script generates the build, passes the gates, checks read-only access, prints the plan and exits without having written, overwritten or deleted anything in the hosting

#### Scenario: Publication requires an explicit flag

- **WHEN** an operator runs the script with the publish flag
- **THEN** the script uploads the build to the hosting and verifies the result

### Requirement: The publication SHALL be verified in the hosting after the upload

After the upload, the script SHALL run the existing smoke test `scripts/smoke/admin.mjs` with the `SMOKE_ADMIN_URL` variable pointing at the admin panel subdomain, and SHALL exit with an error if the smoke test fails. The script SHALL additionally check, with HTTP requests against the subdomain, that the root responds, that a real deep route of the application (for example `/products`) responds with the SPA HTML document and not with a server-side 404, and that a content-hashed asset from the local build responds successfully. The script SHALL require `SMOKE_ADMIN_URL` to be defined in order to publish.

#### Scenario: The smoke test fails after the publication

- **WHEN** `scripts/smoke/admin.mjs` returns an error after the upload
- **THEN** the script exits with a non-zero status code and the failure remains visible to the operator

#### Scenario: The deep route uses the SPA fallback

- **WHEN** `/products` is requested on the admin panel subdomain
- **THEN** the response is an HTML document with status 200 and not a server-side 404 error

#### Scenario: The panel URL is missing

- **WHEN** `SMOKE_ADMIN_URL` is not defined and a publication is attempted
- **THEN** the script aborts before uploading, with a message naming the missing variable

### Requirement: The manual admin panel deployment runbook SHALL be documented

`docs/deploy-standards.md` SHALL document the manual deployment procedure of the administration panel: the required build variables and FTP secrets, the exact commands to run and their order, the rationale of the phased upload order, the warning that old content-hashed chunks accumulate and are never deleted in the same publication, the manual pre-deployment checklist and the rollback procedure. The manual pre-deployment checklist SHALL include, at minimum, the confirmation that the panel origin is in the backend CORS allowlist and the confirmation that the panel subdomain is registered among the Firebase Authentication authorized domains.

#### Scenario: The runbook allows performing the deployment

- **WHEN** an operator needs to publish the administration panel
- **THEN** the documentation states the variables and secrets to define, the commands to run in order and what to check in the output

#### Scenario: The runbook documents the upload order

- **WHEN** the admin panel runbook is reviewed
- **THEN** it explains that the content-hashed assets are uploaded before the `index.html` and what would happen if that order were inverted

#### Scenario: The runbook warns about old chunks

- **WHEN** the admin panel runbook is reviewed
- **THEN** it documents that the publication never deletes old content-hashed chunks, why they must not be deleted in the same publication and what the accepted cost is

#### Scenario: The runbook includes the pre-deployment checklist

- **WHEN** the admin panel runbook is reviewed
- **THEN** it includes the verification of the panel origin in the backend CORS allowlist and of the panel subdomain in the Firebase Authentication authorized domains

#### Scenario: The runbook allows reverting

- **WHEN** a publication leaves the panel in an incorrect state
- **THEN** the runbook explains how to publish the previous build again and which checks to repeat afterwards

### Requirement: The automatic publication of the admin panel SHALL be declared as a later cycle

In this cycle NO GitHub Actions workflow that builds or publishes `apps/admin` over FTPES SHALL exist. The documentation and the design of the change SHALL record how that workflow would look — reusing the publication script as the single step of the publish job, with the same gate and credential pattern as the public site lane — and SHALL explicitly declare it as the work of a later change.

#### Scenario: No admin publication workflow exists

- **WHEN** the workflows of the repository are reviewed
- **THEN** none builds or publishes `apps/admin` over FTPES

#### Scenario: The future lane is documented

- **WHEN** the admin panel deployment documentation is reviewed
- **THEN** it describes how the automatic publication workflow would look and declares that its implementation belongs to a later change
