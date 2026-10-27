# astro-upgrade Specification

## MODIFIED Requirements

### Requirement: Brand design tokens preserved in @theme
The brand color tokens (`brand-navy`, `brand-navy-light`, `brand-orange`) SHALL be declared in a `@theme {}` block inside `apps/web/src/styles/globals.css` with the exact same hexadecimal values currently declared in `tailwind.config.mjs`, so that Tailwind v4 generates the same `bg-brand-navy`, `bg-brand-navy-light`, and `bg-brand-orange` utility classes.

#### Scenario: brand tokens declared in @theme with identical hex values
- **WHEN** `apps/web/src/styles/globals.css` is inspected
- **THEN** a `@theme { ... }` block exists
- **AND** it declares `--color-brand-navy: #1B2A4A;`
- **AND** it declares `--color-brand-navy-light: #2C3E6B;`
- **AND** it declares `--color-brand-orange: #F97316;`

#### Scenario: Tailwind brand utility classes still resolve
- **WHEN** the production build of `apps/web` is generated
- **THEN** any class `bg-brand-navy`, `bg-brand-navy-light`, `bg-brand-orange`, `text-brand-orange`, or `after:bg-brand-orange` used in `Header.astro` compiles to a CSS rule using the corresponding hex color
- **AND** the rendered site visually matches the pre-upgrade appearance of brand colors

### Requirement: Build, lint, typecheck, tests and smoke tests all green
All standard development scripts for `apps/web` SHALL exit successfully after the upgrade: build, lint, typecheck, unit tests, and Playwright E2E smoke tests.

#### Scenario: astro build succeeds
- **WHEN** `npm run build --workspace=apps/web` is executed
- **THEN** the command exits with code 0
- **AND** a `dist/` directory is produced with the static site for `/` and `/cotizacion`
- **AND** no deprecation warnings related to removed Astro 7 APIs are emitted in the build log

#### Scenario: typecheck succeeds
- **WHEN** `npm run typecheck --workspace=apps/web` is executed (which runs `astro check && tsc --noEmit`)
- **THEN** the command exits with code 0
- **AND** no TypeScript errors are reported

#### Scenario: lint succeeds
- **WHEN** `npm run lint --workspace=apps/web` is executed
- **THEN** the command exits with code 0
- **AND** no ESLint errors are reported (warnings about pre-existing code are acceptable)

#### Scenario: unit tests succeed
- **WHEN** `npm run test --workspace=apps/web` is executed
- **THEN** the command exits with code 0
- **AND** the Header, PhoneFab, WhatsAppButton, navigation and contact suites pass
- **AND** snapshot files are regenerated and committed

#### Scenario: smoke tests succeed
- **WHEN** `npm run test:smoke --workspace=apps/web` is executed
- **THEN** the command exits with code 0
- **AND** the `site-header.spec.ts` and `phone-fab.spec.ts` Playwright suites pass

## REMOVED Requirements

### Requirement: Functional regression-free for site-header and top-header
**Reason**: La capability `top-header` se retira; no puede exigirse su regresión tras el upgrade de Astro.

**Migration**: La regresión de `site-header` se conserva en el requisito nuevo; el FAB de teléfono se cubre con su propia capability y su E2E.

## ADDED Requirements

### Requirement: Functional regression-free for site-header
The pre-existing capability `site-header` SHALL continue to satisfy all its archived requirements and scenarios after the Astro 7.1.6 + Tailwind v4 upgrade, with no behavioral changes to navigation, active-path matching, CTA rendering, mobile hamburger toggling, accessibility landmarks, or hardcoded `NAVIGATION_ITEMS`.

#### Scenario: site-header unit tests still pass
- **WHEN** `npm run test --workspace=apps/web` is executed including `apps/web/src/components/__tests__/Header.test.ts`
- **THEN** all assertions pass (after snapshot regeneration, which is expected because of the `compressHTML: 'jsx'` whitespace change in Astro 7)
- **AND** the snapshot contains the same five navigation items in the same order with the same hrefs and labels as before

#### Scenario: navigation config unit tests unchanged
- **WHEN** `apps/web/src/lib/config/__tests__/navigation.test.ts` and `apps/web/src/lib/config/__tests__/contact.test.ts` are executed
- **THEN** all assertions pass WITHOUT any modification to the test files
- **AND** no test in these files needs snapshot regeneration (they are pure unit tests of library code with no Astro rendering)

#### Scenario: Playwright E2E for site-header still passes
- **WHEN** `npm run test:smoke --workspace=apps/web` executes `apps/web/e2e/site-header.spec.ts`
- **THEN** desktop viewport (>= 1024px) shows logo + five items + CTA
- **AND** mobile viewport (< 1024px) shows hamburger toggle and hides desktop nav
- **AND** clicking the hamburger expands the mobile panel with the five items
