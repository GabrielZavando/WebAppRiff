# configure-social-links Specification

## Purpose

Centralización y publicación de las URLs oficiales de redes sociales (Facebook, Instagram, LinkedIn) en el frontend estático de Astro (`apps/web`), garantizando la omisión de X cuando `SOCIAL_X_URL` está vacío, el cumplimiento de atributos de accesibilidad y seguridad en `TopHeader`, `Footer` y `ContactBar`, la sincronización de contratos de entorno y pruebas E2E, y la documentación de variables de build SSG para Coolify.

## ADDED Requirements

### Requirement: Real social media URLs configuration

The Astro site SHALL configure the official Riff social media URLs for Facebook, Instagram, and LinkedIn in `apps/web/src/lib/config/contact.ts` via `import.meta.env`, keeping `SOCIAL_X_URL` empty to suppress the X icon and link.

#### Scenario: Official social links configured

- **WHEN** the site is built with the official environment variables
- **THEN** `getContactInfo()` returns `facebook`, `instagram`, and `linkedin` with their official URLs
- **AND** `social.x` equals an empty string

#### Scenario: Social links filtering

- **WHEN** `getSocialLinks()` processes the contact info
- **THEN** it returns exactly three items corresponding to Facebook, Instagram, and LinkedIn
- **AND** no item for X is included

### Requirement: Public site social components rendering

`TopHeader.astro`, `Footer.astro`, and `ContactBar.astro` SHALL render the official Facebook, Instagram, and LinkedIn links from the shared configuration, and SHALL NOT render an anchor or icon for X when `SOCIAL_X_URL` is empty.

#### Scenario: TopHeader renders official social links

- **WHEN** `TopHeader.astro` renders with the official configuration
- **THEN** it displays links for Facebook, Instagram, and LinkedIn
- **AND** it does NOT render any link or icon with `aria-label="X"`

#### Scenario: Footer renders official social links

- **WHEN** `Footer.astro` renders with the official configuration
- **THEN** it displays links for Facebook, Instagram, and LinkedIn
- **AND** it does NOT render any link or icon with `aria-label="X"`

#### Scenario: ContactBar renders official social links

- **WHEN** `ContactBar.astro` renders on `/contacto`
- **THEN** it displays links for Facebook, Instagram, and LinkedIn
- **AND** it does NOT render any link or icon with `aria-label="X"`

### Requirement: Security and accessibility contract

Every social link rendered across `TopHeader`, `Footer`, and `ContactBar` SHALL include `target="_blank"`, `rel="noopener noreferrer"`, and an `aria-label` matching the social network name ("Facebook", "Instagram", "LinkedIn").

#### Scenario: Accessible and secure social anchors

- **WHEN** any social anchor is rendered
- **THEN** it carries `target="_blank"`
- **AND** it carries `rel="noopener noreferrer"`
- **AND** its `aria-label` attribute equals the official network name

### Requirement: Environment variables contract and E2E test setup

The project SHALL declare `SOCIAL_FACEBOOK_URL`, `SOCIAL_INSTAGRAM_URL`, `SOCIAL_LINKEDIN_URL`, and `SOCIAL_X_URL` in `apps/web/.env.example` and `apps/web/.env`, and SHALL update `apps/web/playwright.config.ts` and `apps/web/e2e/top-header.spec.ts` to match the official three networks without expecting X.

#### Scenario: Env files contain official social configuration

- **WHEN** `apps/web/.env.example` and `apps/web/.env` are inspected
- **THEN** both files contain the official URLs for Facebook, Instagram, and LinkedIn
- **AND** both files keep `SOCIAL_X_URL` empty

#### Scenario: Playwright E2E suite matches official social links

- **WHEN** Playwright executes e2e tests
- **THEN** `playwright.config.ts` injects the official Facebook, Instagram, and LinkedIn URLs and empty `SOCIAL_X_URL`
- **AND** `top-header.spec.ts` verifies Facebook, Instagram, and LinkedIn without checking for X

### Requirement: Coolify build time documentation for Astro SSG

`docs/deploy-standards.md` SHALL document that `SOCIAL_FACEBOOK_URL`, `SOCIAL_INSTAGRAM_URL`, `SOCIAL_LINKEDIN_URL`, and `SOCIAL_X_URL` are public build-time variables for the Astro SSG site in Coolify, and that modifying them requires a site rebuild/redeploy to update the static HTML.

#### Scenario: Deployment standards document social build variables

- **WHEN** `docs/deploy-standards.md` is inspected
- **THEN** it includes the `SOCIAL_*_URL` variables in its environment variables reference table
- **AND** it notes that Astro SSG bakes these variables into static HTML at build time
