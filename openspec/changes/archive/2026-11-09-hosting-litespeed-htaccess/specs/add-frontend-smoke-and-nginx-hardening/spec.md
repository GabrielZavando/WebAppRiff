# add-frontend-smoke-and-nginx-hardening Specification — DELTA

> Este delta amplía el contrato de caché y cabeceras de seguridad para el hosting
> compartido con LiteSpeed (cPanel), donde `nginx.conf` no se interpreta. Añade el
> contrato equivalente en `.htaccess` para el sitio público y el panel, la
> entrega verificada del `.htaccess` en el `dist/` de cada app y la página `404`
> del sitio público. La especificación existente `add-frontend-smoke-and-nginx-hardening`
> se modifica; no se crean capacidades nuevas.

## MODIFIED Requirements

### Requirement: Nginx SHALL enforce cache policy and security headers
`apps/web/nginx.conf` and `apps/admin/nginx.conf` SHALL serve content-hashed assets (`/_astro/*` for web, `/assets/*` for admin) with `Cache-Control: public, max-age=31536000, immutable`; HTML (including `index.html` and the SPA fallback) with `no-cache`; and every HTML document SHALL carry the security headers `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and a compatible base Content-Security-Policy repeated explicitly in each `location` that defines an `add_header`. The CSP `font-src` directive SHALL be `font-src 'self' https: data:` — the `data:` source allows the self-hosted `@fontsource` fonts that the build inlines as base64 data URIs (change `ui-chrome-uniform`); the other CSP directives remain unchanged.

Additionally, the project SHALL provide, for every frontend, a `.htaccess` file that expresses the SAME security headers and CSP as the corresponding `nginx.conf`, and a cache policy that is at least as effective as the one of its `nginx.conf` over the real build layout (see the requirement "LiteSpeed cache policy SHALL match the real build layout"). The `.htaccess` files SHALL be derived from the `nginx.conf` files and SHALL be kept in sync with them by automated tests. The `nginx.conf` files and the Dockerfiles SHALL NOT be modified by this contract: `make docker-build` SHALL keep working unchanged, no `pre`/`post` hook SHALL be added to the `build` script of either app, and the Docker/nginx lane remains the source of truth for the container-based deployments. On LiteSpeed/cPanel hosting, the `.htaccess` file is the source of truth for the header and cache contract.

#### Scenario: CSP font-src allows embedded fonts
- **WHEN** any `location` in `apps/web/nginx.conf` or `apps/admin/nginx.conf` emits the `Content-Security-Policy` header
- **THEN** the `font-src` directive is `'self' https: data:`
- **AND** the remaining directives (`default-src`, `script-src`, `style-src`, `img-src`, `connect-src`, `object-src`, `base-uri`, `form-action`) are unchanged

#### Scenario: Security headers present on every document
- **WHEN** nginx serves any HTML document
- **THEN** it includes `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` and the base CSP
- **AND** the headers + CSP are repeated explicitly in each `location` that defines its own `add_header` (nginx `add_header` inheritance)

#### Scenario: LiteSpeed .htaccess mirrors the nginx header contract
- **WHEN** the `.htaccess` of the public site or of the admin panel is evaluated by LiteSpeed
- **THEN** every served document carries `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` and the base CSP with `font-src 'self' https: data:`
- **AND** the `.htaccess` declares the same `Cache-Control` values as its `nginx.conf`: `public, max-age=31536000, immutable` for content-hashed assets and `no-cache` for HTML

#### Scenario: nginx contract and Docker lane are not modified
- **WHEN** the `.htaccess` contract is introduced
- **THEN** `apps/web/nginx.conf` and `apps/admin/nginx.conf` remain unchanged
- **AND** the Dockerfiles remain unchanged and `make docker-build` keeps working
- **AND** the `build` script of `apps/web` and `apps/admin` gains no `pre`/`post` hook that depends on files outside the build context copied by the Dockerfiles

## ADDED Requirements

### Requirement: LiteSpeed hosting SHALL deliver the .htaccess at the document root
The build of the public site (`apps/web`) and of the admin panel (`apps/admin`) SHALL deliver a `.htaccess` file at the root of the generated `dist/`, because the FTP account of each subdomain lands directly on the document root of that subdomain and the `.htaccess` only takes effect when it sits in that root. The delivery SHALL rely exclusively on mechanisms available in the Docker build context of each app — the `public/` directory for Astro and the `assets` configuration of `angular.json` for Angular — and SHALL NOT depend on a build hook that requires files the Dockerfiles do not copy.

The `.htaccess` of the public site SHALL set the 404 error document to `/404.html` and SHALL NOT implement an SPA fallback (the public site is an MPA); the `.htaccess` of the admin panel SHALL implement the SPA fallback to `/index.html` for paths that do not exist on disk.

Automated tests SHALL verify, for each frontend, that the `.htaccess` is declared with the expected cache policy (`public, max-age=31536000, immutable` for the hashed assets, `no-cache` for HTML), the security headers, the base CSP with `font-src 'self' https: data:`, and the expected 404 or SPA fallback rule. The tests SHALL read the built `dist/` when a build output is present and SHALL skip that assertion when it is not. A standalone verification script per app SHALL validate the same contract against an existing build output, SHALL NOT be wired to the `build` script, and SHALL be runnable on demand.

#### Scenario: Public site .htaccess reaches the dist root
- **WHEN** the public site is built
- **THEN** the build output contains a `.htaccess` at its root
- **AND** the file declares `no-cache` for HTML documents, the immutable cache for the hashed assets, the security headers and the base CSP
- **AND** the file maps the 404 error to `/404.html`

#### Scenario: Admin panel .htaccess reaches the dist root
- **WHEN** the admin panel is built
- **THEN** the build output contains a `.htaccess` at its root
- **AND** the file declares the immutable cache for the hashed bundles and fonts, `no-cache` for `index.html`, the security headers and the base CSP
- **AND** the file rewrites non-existing paths to `/index.html` so client-side routing works on deep links

#### Scenario: Tests fail when the .htaccess contract drifts
- **WHEN** the `.htaccess` of either frontend no longer declares the expected cache values, security headers, CSP or fallback rule
- **THEN** the automated test for that frontend fails

#### Scenario: Verification of the build output is independent of the build
- **WHEN** the build of either frontend runs
- **THEN** no `pre`/`post` build hook executes and no file outside the Docker build context is required
- **AND** the verification of the `.htaccess` in the build output is available as a standalone command

#### Scenario: CI gate verifies the build output before the tests
- **WHEN** the CI gate `make ci` runs
- **THEN** it runs the build of the workspaces, then the verification of the `.htaccess` contract against the build output of the public site and of the admin panel, and only afterwards the test suites
- **AND** a failure in that verification fails the gate
- **AND** no other target of the `Makefile` is modified by this contract

### Requirement: LiteSpeed cache policy SHALL match the real build layout
The cache policy expressed in the `.htaccess` files SHALL be derived from the real structure of each build output, which differs from the paths assumed by the `nginx.conf` files.

For the public site, the content-hashed assets are emitted by Astro under `/_astro/`; the immutable cache SHALL therefore be declared by a `.htaccess` placed inside that directory, so that the rule applies to that path only and not to the static files published in the document root.

For the admin panel, the production build emits the hashed JavaScript and CSS bundles (`chunk-*.js`, `styles-*.css`) in the root of the output and the hashed fonts under `media/`, while `nginx.conf` only covers `/assets/*`; the `.htaccess` SHALL therefore declare the immutable cache by file extension (`js`, `css`, `woff2`, `woff`) and the `no-cache` policy for HTML documents (`index.html` and the SPA fallback), covering the real bundle locations. This divergence from `nginx.conf` is an improvement of the LiteSpeed contract and SHALL be recorded as such, not as a discrepancy.

The `.htaccess` files SHALL NOT use the `Header ... env=` form together with `SetEnvIf` to scope the cache policy.

#### Scenario: Public site immutable cache is scoped to the hashed assets directory
- **WHEN** the public site is served from LiteSpeed
- **THEN** the request for a file under `/_astro/` is served with `Cache-Control: public, max-age=31536000, immutable`
- **AND** the documents published in the document root are not affected by that rule

#### Scenario: Admin panel immutable cache covers the real bundles
- **WHEN** the admin panel is served from LiteSpeed
- **THEN** the request for a JavaScript bundle, a CSS bundle or a font is served with `Cache-Control: public, max-age=31536000, immutable`
- **AND** `index.html` and the documents served through the SPA fallback are served with `Cache-Control: no-cache`

#### Scenario: Cache policy does not rely on env-scoped headers
- **WHEN** the `.htaccess` files are inspected
- **THEN** they contain no `Header` directive using the `env=` form and no `SetEnvIf` directive used to scope the cache policy

### Requirement: Public site SHALL publish a 404 page
The public site SHALL generate a `404.html` document at the root of the build output from a minimal `404.astro` page, so that LiteSpeed can serve it as the error document, and the `.htaccess` of the public site SHALL point the 404 error to that document. The page SHALL be aligned with the public site layout and design tokens and SHALL offer the visitor a way back to the home page.

#### Scenario: Build output contains the 404 document
- **WHEN** the public site is built
- **THEN** the build output contains a `404.html` document at its root, generated from the `404.astro` page

#### Scenario: Unknown route serves the 404 document
- **WHEN** a visitor requests a route that does not exist on the public site in LiteSpeed hosting
- **THEN** the response is the `404` status with the content of `404.html`
- **AND** the page keeps the same layout and design tokens as the rest of the public site

### Requirement: LiteSpeed hosting SHALL redirect HTTP to HTTPS
The `.htaccess` of the public site and of the admin panel SHALL redirect plain HTTP to HTTPS with a `301` permanent redirect, implemented with `mod_rewrite` inside `<IfModule mod_rewrite.c>`, preserving the host and the requested path. The rule SHALL be declared in the repository because a redirect configured in the hosting control panel is lost when a deployment overwrites the `.htaccess` at the document root.

In the admin panel, the redirect SHALL be evaluated BEFORE the SPA fallback, so a deep link requested over HTTP is redirected instead of being served as `index.html`. The redirect SHALL NOT use the `Options` directive nor env-scoped headers, and the ACME challenge path (`/.well-known/acme-challenge/`) SHALL be excluded from the redirect so certificate issuance and renewal keep working.

#### Scenario: Public site redirects HTTP to HTTPS
- **WHEN** a visitor requests any URL of the public site over plain HTTP
- **THEN** the response is a `301` with `Location` pointing to the same host and path over `https`

#### Scenario: Admin panel redirects HTTP before the SPA fallback
- **WHEN** a visitor requests a deep link of the admin panel over plain HTTP
- **THEN** the response is a `301` to the same deep link over `https`
- **AND** the request is not served as the SPA `index.html`

#### Scenario: HTTPS requests are not redirected again
- **WHEN** a request is already served over HTTPS
- **THEN** it is served normally, without any redirect
- **AND** the SPA fallback of the admin panel still applies

#### Scenario: Redirect keeps the certificate renewal working
- **WHEN** a request targets the ACME challenge path
- **THEN** it is not redirected to HTTPS

#### Scenario: Redirect rule stays LiteSpeed compatible
- **WHEN** the `.htaccess` files are inspected
- **THEN** the redirect uses `mod_rewrite` conditions on the scheme, the host and the request path
- **AND** they contain no `Options` directive and no env-scoped header

### Requirement: LiteSpeed .htaccess applicability SHALL be verified empirically
The applicability of the `.htaccess` in the real LiteSpeed/cPanel hosting SHALL be verified empirically before relying on it. The verification SHALL upload, at the document root of the subdomain, a `.htaccess` together with at least one real hashed asset and the `404.html` document, so that the cache rule and the 404 document can actually be exercised; the response headers SHALL be inspected with `curl -I` against a real URL, both over HTTPS and over plain HTTP, where the latter SHALL answer `301` to the HTTPS URL. The verification SHALL be accompanied by a documented checklist of what to look for in the cPanel/LiteSpeed error log when the `.htaccess` is not applied (for example `AllowOverride`/`Options` restrictions, `mod_headers` or `mod_rewrite` not being available, and rewrite or header directives raising a `500` response).

The `.htaccess` files SHALL redirect plain HTTP to HTTPS with a permanent redirect, as declared in the repository (see the requirement "LiteSpeed hosting SHALL redirect HTTP to HTTPS").

#### Scenario: Header verification with curl
- **WHEN** the verification runs against the hosted subdomain
- **THEN** `curl -I` on a document URL shows the expected security headers, the CSP and the expected `Cache-Control`
- **AND** `curl -I` on an uploaded hashed asset shows `Cache-Control: public, max-age=31536000, immutable`
- **AND** `curl -I` over plain HTTP shows a `301` to the HTTPS URL of the same path

#### Scenario: Verification uses real assets and the 404 document
- **WHEN** the verification is prepared
- **THEN** at least one real hashed asset and the `404.html` document are uploaded next to the `.htaccess` in the document root
- **AND** the unknown route returns the `404` status with the content of the uploaded `404.html`

#### Scenario: Error log checklist is documented
- **WHEN** the `.htaccess` is rejected or ignored by the hosting
- **THEN** the documented checklist tells the operator which error log entries to look for and how to translate them into a fix

#### Scenario: HTTPS redirect is declared in the .htaccess
- **WHEN** the `.htaccess` files are inspected
- **THEN** they declare the canonical HTTPS redirect described in the requirement "LiteSpeed hosting SHALL redirect HTTP to HTTPS"
- **AND** the ACME challenge path is excluded from the redirect
