# configure-social-links Specification

## Purpose
Configuración de las URLs reales de redes sociales, render en los componentes del sitio público, contrato de seguridad/accesibilidad, contrato de variables de entorno y setup de E2E y build-time para Astro SSG.

## Requirements

### Requirement: Real social media URLs configuration
The Astro site SHALL configure the official Riff social media URLs for Facebook, Instagram, and LinkedIn as **typed constants in `apps/web/src/lib/config/contact.ts`** (NOT via `import.meta.env`), keeping the X URL empty to suppress the X icon and link. Current values: Facebook `https://www.facebook.com/somosriff`, Instagram `https://www.instagram.com/somosriff.cl/`, LinkedIn `https://www.linkedin.com/company/somosriff/`, X `''`. (MODIFIED in `ui-chrome-uniform` — moved from env-driven to code constants.)

#### Scenario: Social URLs come from the configuration constants
- **WHEN** `getContactInfo()` is invoked
- **THEN** `social.facebook` is `https://www.facebook.com/somosriff`, `social.instagram` is `https://www.instagram.com/somosriff.cl/`, `social.linkedin` is `https://www.linkedin.com/company/somosriff/`
- **AND** `social.x` is empty (suppresses the X icon and link)

### Requirement: Public site social components rendering
`Footer.astro` and `ContactBar.astro` SHALL render the official Facebook, Instagram, and LinkedIn links from the shared configuration constants, and SHALL NOT render an anchor or icon for X when the configured X URL is empty.

#### Scenario: X is omitted when its URL is empty
- **WHEN** the configured X URL is empty (`''`)
- **THEN** no X anchor or icon renders in Footer or ContactBar
- **AND** Facebook, Instagram and LinkedIn anchors render with the configured URLs

### Requirement: Security and accessibility contract

Every social link rendered across `Footer` and `ContactBar` SHALL include `target="_blank"`, `rel="noopener noreferrer"`, and an `aria-label` matching the social network name ("Facebook", "Instagram", "LinkedIn").

#### Scenario: Accessible and secure social anchors

- **WHEN** any social anchor is rendered
- **THEN** it carries `target="_blank"`
- **AND** it carries `rel="noopener noreferrer"`
- **AND** its `aria-label` attribute equals the official network name

### Requirement: Coolify build time documentation for Astro SSG
`docs/deploy-standards.md` SHALL document that the social media URLs and the contact phone are **configuration constants in `lib/config/contact.ts`** (not build-time environment variables), so a change to them requires a code change and a site rebuild/redeploy. (MODIFIED in `ui-chrome-uniform` — the socials are no longer Coolify build variables.)

#### Scenario: deploy-standards documents the config constants
- **WHEN** `docs/deploy-standards.md` is read
- **THEN** it documents that the social media URLs and the contact phone are configuration constants in `lib/config/contact.ts` (not build-time env variables)
- **AND** a change to them requires a code change and a site rebuild/redeploy

### Requirement: Social URLs test coverage without the retired top bar
The official social URLs SHALL remain covered by unit/component tests after `top-header.spec.ts` is removed. The tests SHALL assert that Footer and ContactBar render `https://www.facebook.com/somosriff`, `https://www.instagram.com/somosriff.cl/` and `https://www.linkedin.com/company/somosriff/` from the configured constants and that X does not render while its URL is empty. No Playwright spec SHALL depend on a top contact bar.

#### Scenario: Social constants covered by component tests
- **WHEN** `npm run test --workspace=apps/web` executes the Footer, ContactBar and contact config suites
- **THEN** they assert the three official social URLs
- **AND** they assert that X is absent
- **AND** `apps/web/e2e/top-header.spec.ts` no longer exists
