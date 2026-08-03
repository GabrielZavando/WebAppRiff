# astro-upgrade Specification

## Purpose
Define las restricciones técnicas permanentes derivadas del upgrade de Astro 4 → 7.1.6 y Tailwind v3 → v4 en `apps/web`: pin exacto de versión, integración Tailwind v4 vía `@tailwindcss/vite`, design tokens de marca preservados en `@theme`, Node runtime ≥ 22.12, output SSG estático, sin APIs removidas ni integración `@astrojs/tailwind` deprecada y verificación end-to-end (build/lint/typecheck/tests/smoke) en verde. Sirve como contrato de no-regresión para futuros cambios que toquen el stack de `apps/web`.
## Requirements
### Requirement: Astro version is pinned to 7.1.6
The `apps/web` workspace SHALL declare Astro as an exact pinned version `7.1.6` in its `package.json`, without caret (`^`) or tilde (`~`) range modifiers, to guarantee reproducibility of the major-version upgrade.

#### Scenario: package.json declares exact Astro version
- **WHEN** `apps/web/package.json` is inspected
- **THEN** the `dependencies.astro` field is the exact string `"7.1.6"`
- **AND** it is NOT a caret-prefixed range like `"^7.1.6"`
- **AND** it is NOT a tilde-prefixed range like `"~7.1.6"`

#### Scenario: installed Astro matches the pinned version
- **WHEN** `npm ls astro --workspace=apps/web` is executed
- **THEN** the resolved Astro version is exactly `7.1.6`
- **AND** no peer-dependency warnings related to Astro are emitted

### Requirement: Tailwind CSS v4 via @tailwindcss/vite plugin
The `apps/web` workspace SHALL use Tailwind CSS v4 as a Vite plugin (`@tailwindcss/vite`), and SHALL NOT use the deprecated `@astrojs/tailwind` integration nor a JavaScript `tailwind.config.mjs` file.

#### Scenario: @tailwindcss/vite plugin registered in Astro config
- **WHEN** `apps/web/astro.config.mjs` is inspected
- **THEN** the `@tailwindcss/vite` package is imported
- **AND** `tailwindcss()` (the Vite plugin) is included in the `vite.plugins` array
- **AND** the `@astrojs/tailwind` import and `tailwind()` integration are NOT present
- **AND** the `integrations` array does NOT include `tailwind()`

#### Scenario: tailwind.config.mjs file removed
- **WHEN** the `apps/web/` directory is inspected
- **THEN** there is NO `tailwind.config.mjs` file
- **AND** there is NO `tailwind.config.js`, `tailwind.config.ts`, or any JavaScript-based Tailwind config file

#### Scenario: Tailwind v4 imported via CSS
- **WHEN** `apps/web/src/styles/globals.css` is inspected
- **THEN** the file starts with `@import "tailwindcss";`
- **AND** the legacy directives `@tailwind base;`, `@tailwind components;`, `@tailwind utilities;` are NOT present

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
- **THEN** any class `bg-brand-navy`, `bg-brand-navy-light`, `bg-brand-orange`, `text-brand-orange`, or `after:bg-brand-orange` used in `Header.astro` or `TopHeader.astro` compiles to a CSS rule using the corresponding hex color
- **AND** the rendered site visually matches the pre-upgrade appearance of brand colors

### Requirement: All apps/web dev dependencies are compatible with Astro 7
All dev dependencies of `apps/web` (`@astrojs/check`, `eslint-plugin-astro`, `@typescript-eslint/*`, `eslint`, `typescript`, `vitest`, `playwright`) SHALL be bumped to versions whose peer-dependency ranges include `astro@7.x` and/or `vite@^8` as appropriate, so that `npm ls --workspace=apps/web` reports no unmet peer-dependency warnings.

#### Scenario: npm ls reports no peer warnings
- **WHEN** `npm ls --workspace=apps/web --all` is executed
- **THEN** the command exits with code 0
- **AND** the output contains no `UNMET PEER DEPENDENCY` warnings
- **AND** the output contains no `peer dep "astro@7.x"` or `peer dep "vite@^8"` mismatches

#### Scenario: @astrojs/check version supports Astro 7
- **WHEN** `apps/web/package.json` `devDependencies['@astrojs/check']` is inspected
- **THEN** the version resolves to a release whose `peerDependencies.astro` range includes `7.x`
- **AND** `npm run typecheck --workspace=apps/web` (which runs `astro check`) completes successfully

### Requirement: No removed Astro 7 APIs are used
The `apps/web` source code SHALL NOT use any APIs removed in Astro 7: `@astrojs/db`, the `astro:transitions` internals (`TRANSITION_BEFORE_PREPARATION`, `TRANSITION_AFTER_PREPARATION`, `TRANSITION_BEFORE_SWAP`, `TRANSITION_AFTER_SWAP`, `TRANSITION_PAGE_LOAD`, `isTransitionBeforePreparationEvent()`, `isTransitionBeforeSwapEvent()`, `createAnimationScope()`), nor `getContainerRenderer()` imported from an integration package root.

#### Scenario: no removed APIs found via grep
- **WHEN** the `apps/web/src/` directory is searched for the patterns `@astrojs/db`, `TRANSITION_BEFORE_PREPARATION`, `TRANSITION_AFTER_PREPARATION`, `TRANSITION_BEFORE_SWAP`, `TRANSITION_AFTER_SWAP`, `TRANSITION_PAGE_LOAD`, `isTransitionBeforePreparationEvent`, `isTransitionBeforeSwapEvent`, `createAnimationScope`, and `getContainerRenderer`
- **THEN** no matches are found in any `.astro`, `.ts`, `.tsx`, or `.js` file

### Requirement: No deprecated @astrojs/tailwind integration in dependencies
The `apps/web/package.json` SHALL NOT list `@astrojs/tailwind` in either `dependencies` or `devDependencies`, since this integration is deprecated since Astro 5+ and incompatible with the Tailwind v4 + `@tailwindcss/vite` strategy.

#### Scenario: @astrojs/tailwind removed from package.json
- **WHEN** `apps/web/package.json` is inspected
- **THEN** neither `dependencies` nor `devDependencies` includes an `@astrojs/tailwind` key
- **AND** the lockfile does not install `@astrojs/tailwind` for the `apps/web` workspace

### Requirement: Functional regression-free for site-header and top-header
The pre-existing capabilities `site-header` and `top-header` SHALL continue to satisfy all their currently archived requirements and scenarios after the Astro 7.1.6 + Tailwind v4 upgrade, with no behavioral changes to navigation, active-path matching, CTA rendering, mobile hamburger toggling, accessibility landmarks, or hardcoded `NAVIGATION_ITEMS`.

#### Scenario: site-header unit tests still pass
- **WHEN** `npm run test --workspace=apps/web` is executed including `apps/web/src/components/__tests__/Header.test.ts`
- **THEN** all assertions pass (after snapshot regeneration, which is expected because of the `compressHTML: 'jsx'` whitespace change in Astro 7)
- **AND** the snapshot contains the same five navigation items in the same order with the same hrefs and labels as before

#### Scenario: top-header unit tests still pass
- **WHEN** `npm run test --workspace=apps/web` is executed including `apps/web/src/components/__tests__/TopHeader.test.ts`
- **THEN** all assertions pass (after snapshot regeneration if needed)
- **AND** the rendered TopHeader still uses a single `<div role="region" aria-label="Barra de contacto">` wrapper (no `<header>` element)

#### Scenario: navigation config unit tests unchanged
- **WHEN** `apps/web/src/lib/config/__tests__/navigation.test.ts` and `apps/web/src/lib/config/__tests__/contact.test.ts` are executed
- **THEN** all assertions pass WITHOUT any modification to the test files
- **AND** no test in these files needs snapshot regeneration (they are pure unit tests of library code with no Astro rendering)

#### Scenario: Playwright E2E for site-header still passes
- **WHEN** `npm run test:smoke --workspace=apps/web` executes `apps/web/e2e/site-header.spec.ts`
- **THEN** desktop viewport (>= 1024px) shows logo + five items + CTA
- **AND** mobile viewport (< 1024px) shows hamburger toggle and hides desktop nav
- **AND** clicking the hamburger expands the mobile panel with the five items

### Requirement: Whitespace handling follows Astro 7 default (compressHTML: 'jsx')
The `apps/web/astro.config.mjs` SHALL NOT explicitly set `compressHTML: true` or `compressHTML: false` (which would override the Astro 7 default), so that the project adopts the new default `compressHTML: 'jsx'` whitespace behavior. Any inline-element visual regression caused by the JSX whitespace collapse SHALL be fixed in the component (`flex gap-*` or explicit `{' '}` expression), NOT by reverting to the legacy default.

#### Scenario: compressHTML not explicitly set in config
- **WHEN** `apps/web/astro.config.mjs` is inspected
- **THEN** the exported config object does NOT contain a `compressHTML` key
- **AND** the runtime defaults to `'jsx'` whitespace handling

#### Scenario: no inline-element visual regression in Header navigation
- **WHEN** the rendered HTML of `Header.astro` is inspected in a browser at desktop viewport
- **THEN** the five navigation items are visually separated (either via `flex` + `gap-*` utility classes, or via explicit `{' '}` whitespace expressions in the `.astro` source)
- **AND** the items do NOT appear glued together (e.g. "InicioNosotrosServicios...")

### Requirement: Node runtime version 22.12 or higher
The repository `package.json` (root) and `apps/web/package.json` SHALL declare `engines.node` as `>=22.12.0` to align with the Node runtime required by Vite 8 (used by Astro 7) and the LTS lifecycle of Node 22.

#### Scenario: root package.json engines.node raised
- **WHEN** the root `package.json` is inspected
- **THEN** the `engines.node` field equals `">=22.12.0"`
- **AND** it is NOT `">=20.19.0"` (the previous value)

#### Scenario: apps/web package.json engines.node raised
- **WHEN** `apps/web/package.json` is inspected
- **THEN** the `engines.node` field equals `">=22.12.0"` (if present; otherwise the root value applies via inheritance)

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
- **AND** all four unit test suites pass (`Header.test.ts`, `TopHeader.test.ts`, `navigation.test.ts`, `contact.test.ts`)
- **AND** snapshot files are regenerated and committed

#### Scenario: smoke tests succeed
- **WHEN** `npm run test:smoke --workspace=apps/web` is executed
- **THEN** the command exits with code 0
- **AND** both `site-header.spec.ts` and `top-header.spec.ts` Playwright suites pass

### Requirement: Static output mode preserved
The `apps/web` workspace SHALL continue to be configured as a static site generator (SSG) by setting `output: 'static'` in `astro.config.mjs`, and SHALL NOT adopt SSR mode, an adapter, or any server-runtime behavior introduced by Astro 7 (advanced routing via `src/fetch.ts`, CDN cache providers, Hono integration).

#### Scenario: output remains static
- **WHEN** `apps/web/astro.config.mjs` is inspected
- **THEN** the config object sets `output: 'static'`
- **AND** no `adapter` property is set
- **AND** no `cache.provider` configuration is present
- **AND** no `routeRules` configuration is present

#### Scenario: src/fetch.ts is not created
- **WHEN** the `apps/web/src/` directory is inspected
- **THEN** there is no `src/fetch.ts` file (advanced routing is out of scope for this upgrade change)

