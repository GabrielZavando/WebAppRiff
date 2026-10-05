# configure-social-links Specification

## MODIFIED Requirements

### Requirement: Real social media URLs configuration
The Astro site SHALL configure the official Riff social media URLs for Facebook, Instagram, and LinkedIn as **typed constants in `apps/web/src/lib/config/contact.ts`** (NOT via `import.meta.env`), keeping the X URL empty to suppress the X icon and link. Current values: Facebook `https://www.facebook.com/somosriff`, Instagram `https://www.instagram.com/somosriff.cl/`, LinkedIn `https://www.linkedin.com/company/somosriff/`, X `''`. (MODIFIED in `ui-chrome-uniform` — moved from env-driven to code constants.)

#### Scenario: Social URLs come from the configuration constants
- **WHEN** `getContactInfo()` is invoked
- **THEN** `social.facebook` is `https://www.facebook.com/somosriff`, `social.instagram` is `https://www.instagram.com/somosriff.cl/`, `social.linkedin` is `https://www.linkedin.com/company/somosriff/`
- **AND** `social.x` is empty (suppresses the X icon and link)

### Requirement: Public site social components rendering
`TopHeader.astro`, `Footer.astro`, and `ContactBar.astro` SHALL render the official Facebook, Instagram, and LinkedIn links from the shared configuration constants, and SHALL NOT render an anchor or icon for X when the configured X URL is empty. (MODIFIED in `ui-chrome-uniform` — same behavior, wording updated from `SOCIAL_X_URL` env to the configured constant.)

#### Scenario: X is omitted when its URL is empty
- **WHEN** the configured X URL is empty (`''`)
- **THEN** no X anchor or icon renders in TopHeader, Footer or ContactBar
- **AND** Facebook, Instagram and LinkedIn anchors render with the configured URLs

### Requirement: Environment variables contract and E2E test setup
The project SHALL keep the official social URLs testable via the e2e suite: `apps/web/e2e/top-header.spec.ts` SHALL assert the configured Facebook, Instagram and LinkedIn URLs (and the absence of X). The social URLs are code constants in `lib/config/contact.ts`; the legacy env declarations (`.env.example`, `playwright.config.ts` env injection) are no longer required by the implementation and may be cleaned up by the team separately. (MODIFIED in `ui-chrome-uniform` — the env contract is no longer required; e2e asserts the constants.)

#### Scenario: E2E asserts the configured social URLs
- **WHEN** the e2e `top-header.spec.ts` runs
- **THEN** it finds `https://www.facebook.com/somosriff`, `https://www.instagram.com/somosriff.cl/` and `https://www.linkedin.com/company/somosriff/` in the rendered top bar
- **AND** it does not expect an X icon

### Requirement: Coolify build time documentation for Astro SSG
`docs/deploy-standards.md` SHALL document that the social media URLs and the contact phone are **configuration constants in `lib/config/contact.ts`** (not build-time environment variables), so a change to them requires a code change and a site rebuild/redeploy. (MODIFIED in `ui-chrome-uniform` — the socials are no longer Coolify build variables.)

#### Scenario: deploy-standards documents the config constants
- **WHEN** `docs/deploy-standards.md` is read
- **THEN** it documents that the social media URLs and the contact phone are configuration constants in `lib/config/contact.ts` (not build-time env variables)
- **AND** a change to them requires a code change and a site rebuild/redeploy