# configure-social-links Specification

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Environment variables contract and E2E test setup
**Reason**: El E2E `top-header.spec.ts` que verificaba estas URLs se elimina junto con la barra superior; el requisito queda sin sujeto de prueba.

**Migration**: La cobertura de las constantes sociales pasa a los tests de `Footer.astro`, `ContactBar.astro`, `contacto.astro` y `lib/config/contact.ts`, según el nuevo requisito siguiente.

## ADDED Requirements

### Requirement: Social URLs test coverage without the retired top bar
The official social URLs SHALL remain covered by unit/component tests after `top-header.spec.ts` is removed. The tests SHALL assert that Footer and ContactBar render `https://www.facebook.com/somosriff`, `https://www.instagram.com/somosriff.cl/` and `https://www.linkedin.com/company/somosriff/` from the configured constants and that X does not render while its URL is empty. No Playwright spec SHALL depend on a top contact bar.

#### Scenario: Social constants covered by component tests
- **WHEN** `npm run test --workspace=apps/web` executes the Footer, ContactBar and contact config suites
- **THEN** they assert the three official social URLs
- **AND** they assert that X is absent
- **AND** `apps/web/e2e/top-header.spec.ts` no longer exists
