# add-sitemap Specification

## Purpose
TBD - created by archiving change add-sitemap. Update Purpose after archive.
## Requirements
### Requirement: The Astro build SHALL generate a sitemap-index and sections

`apps/web` SHALL integrate the official `@astrojs/sitemap` integration such that an Astro
build with a configured `SITE_URL` produces `/sitemap-index.xml` (and `/sitemap-0.xml`
sections when warranted) under `dist/`, listing the site's routes.

#### Scenario: SC-201 — Sitemap generated in the build

- **WHEN** an Astro build is executed with `SITE_URL` configured
- **THEN** `/sitemap-index.xml` is generated in `dist/` referencing a `/sitemap-0.xml` section file.

#### Scenario: SC-204 — The sitemap is served publicly

- **WHEN** the static site is served by the web Dockerfile runtime (nginx)
- **THEN** `GET /sitemap-index.xml` returns `200` with `Content-Type: application/xml` without extra nginx configuration.

### Requirement: The sitemap SHALL include dynamic product routes

Product slugs generated at build-time by `getStaticPaths` in `apps/web/src/pages/productos/[slug].astro` SHALL be included in the sitemap.

#### Scenario: SC-202 — Product slugs are included

- **WHEN** the build generates the sitemap with the published products present at build-time
- **THEN** every `/productos/<slug>` route appears in the sitemap.

### Requirement: Sitemap URLs SHALL be absolute to the canonical domain

All `<loc>` entries in the generated sitemap SHALL be absolute URLs rooted at the configured canonical `SITE_URL`, and SHALL NOT use `localhost` in a production build.

#### Scenario: SC-203 — URLs point to the canonical domain

- **WHEN** a production build runs with `SITE_URL=https://somosriff.cl`
- **THEN** all `<loc>` entries use `https://somosriff.cl/...` and no `localhost` appears.

### Requirement: Canonical URL SHALL be coherent with the sitemap

The `<link rel="canonical">` emitted by `apps/web/src/layouts/Layout.astro` SHALL point to the same domain/URL as the corresponding `<loc>` in the sitemap for any given page.

#### Scenario: SC-205 — Canonical coherent with the sitemap

- **WHEN** a page is rendered
- **THEN** its canonical link points to the same domain/URL as its `<loc>` in the sitemap.

### Requirement: The sitemap integration SHALL be contract-tested

`apps/web` SHALL include automated configuration tests that assert the sitemap integration is declared in `package.json` and wired into `astro.config.mjs`, and that the production site is not pinned to `localhost`.

#### Scenario: SC-206 — Sitemap integration is contract tested

- **WHEN** the web test suite runs
- **THEN** a configuration test asserts `@astrojs/sitemap` is declared in `apps/web/package.json` and `sitemap()` is wired in `astro.config.mjs`, and a test validates the production `site` is not `localhost`.

