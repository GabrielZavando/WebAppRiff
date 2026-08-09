# Implementation Tasks — services-section

> Reference: `proposal.md`, `design.md`, `specs/services-section/spec.md`.
> TDD discipline: each implementation task is preceded by a failing test.
> Tasks are small enough to complete in one focused session.

## 1. Types contract (lib/types)

- [x] 1.1 Create `apps/web/src/lib/types/services-section.ts` exporting:
  - `Service` interface with `readonly slug`, `title`, `description`, `image: ImageMetadata`, `imageAlt`, `href` (all `readonly`)
  - `ServicesSectionCta` interface with `readonly label`, `readonly href`
  - `ServicesSectionProps` interface with `readonly headline`, `readonly description`, `readonly services: readonly Service[]`, `readonly cta: ServicesSectionCta`
  - Import `ImageMetadata` from `astro`
  - File header documenting the dumb-component contract (mirror `solution-section.ts` JSDoc style)
- [x] 1.2 Verify the types compile with `npx tsc --noEmit -p apps/web/tsconfig.json` (no errors expected; no consumer yet)

## 2. Content config (lib/config)

- [x] 2.1 Create `apps/web/src/lib/config/services-section.ts` exporting:
  - Imports of the 4 images from `@/assets/img/`: `edificios.jpg`, `medidores-de-agua.webp`, `planta-tratamiento.webp`, `osmosis-inversa.jpg`
  - `SERVICES_DATA: readonly Service[]` with the 4 services in the exact render order and with the exact texts from spec scenario "Services carry the expected descriptions in render order"
    - "Medición en Edificios" / "Instalación y recambio de medidores de agua caliente en comunidades." / `edificiosImg` / `imageAlt` describing the photo (not the title) / `href: "/servicios"`
    - "Medición Industrial" / "Instalación y puesta en marcha de sistemas de medición de caudal." / `medidoresImg` / `imageAlt` / `href: "/servicios"`
    - "Obras y Proyectos" / "Desarrollo de infraestructura para sistemas de medición y control." / `obrasImg` / `imageAlt` / `href: "/servicios"`
    - "Tratamiento de Agua y Desalinización" / "Diseño y optimización de plantas de tratamiento con tecnología de vanguardia." / `osmosisImg` / `imageAlt` / `href: "/servicios"`
  - `SERVICES_SECTION_CONTENT: Readonly<ServicesSectionProps>` with:
    - `headline: "Servicios especializados"`
    - `description: "Soluciones técnicas para instalación, mantenimiento y optimización de sistemas de medición y tratamiento de agua, con respaldo profesional y experiencia en terreno."`
    - `services: SERVICES_DATA`
    - `cta: { label: "Ver todos los servicios", href: "/servicios" }`
  - File header documenting the SSG/Contentful migration path (mirror `solution-section.ts` config JSDoc)
- [x] 2.2 Verify the config compiles with `npx tsc --noEmit -p apps/web/tsconfig.json`

## 3. Test suite (red) — `apps/web/src/components/__tests__/ServicesSection.test.ts`

- [x] 3.1 Create the test file with the standard scaffolding: imports (`vitest`, `experimental_AstroContainer as AstroContainer`, `ServicesSection.astro`, `ServicesSectionProps`, `SERVICES_SECTION_CONTENT`); `baseProps = SERVICES_SECTION_CONTENT`; `render()` helper using `AstroContainer.create().renderToString(ServicesSection, { props })`; `stripHtmlComments()` and `countOccurrences()` helpers (mirror `SolutionSection.test.ts`)
- [x] 3.2 Add `describe('ServicesSection — structure & outermost section')` with tests:
  - renders a `<section>` as outermost element
  - `<section>` carries `py-16` and `md:py-24` vertical padding utilities
  - `<section>` carries the `bg-secondary-dark` background token
  - section contains a `container` (or equivalent `mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl`) inner div
- [x] 3.3 Add `describe('ServicesSection — header (centered, no eyebrow, no underline)')` with tests:
  - header block carries `text-center`
  - exactly one `<h3>` with `text-white` and `font-heading` and the exact headline text
  - `<h3>` does NOT carry `aria-hidden="true"` or `tabindex="-1"`
  - description `<p>` with `text-muted` and `max-w-2xl` and the exact description text
  - header does NOT contain an eyebrow-style uppercase accent `span/p` (assert no `<span ... uppercase ... accent ...>PORTAFOLIO</span>`-like signature)
  - header does NOT contain a teal underline div (assert no `<div ... h-1 w-16 bg-primary ...>`)
- [x] 3.4 Add `describe('ServicesSection — card grid (2x2 mobile-first)')` with tests:
  - card grid container carries `grid-cols-1`, `md:grid-cols-2`, and a gap utility
  - card grid container does NOT carry `sm:grid-cols-2` or `lg:grid-cols-4` (those are SolutionSection's)
  - renders exactly 4 `<article>` cards
- [x] 3.5 Add `describe('ServicesSection — card layout (horizontal, mobile-first)')` with tests:
  - each `<article>` carries `bg-secondary`, `border`, `border-secondary-light`, `overflow-hidden`
  - each `<article>` carries `flex`, `flex-col`, `sm:flex-row`
  - no `<article>` carries any `shadow-*` utility
- [x] 3.6 Add `describe('ServicesSection — card image (grayscale, lazy, alt)')` with tests:
  - each card image carries the `grayscale` utility
  - each card image carries `loading="lazy"`
  - each card image carries a non-empty `alt` matching the `imageAlt` prop
  - each card image source resolves to an `astro:assets` optimized path (`/_astro/...` or `/_image?...` in dev/test) and carries `width` and `height` attributes (the assertion checks NOT-raw-path + `/_astro|/_image?` endpoint, consistent with `AstroContainer` dev rendering)
- [x] 3.7 Add `describe('ServicesSection — card content')` with tests:
  - each card renders an `<h4>` with `text-primary` and `font-heading` and the title verbatim
  - each card renders a `<p>` with `text-muted` and the description verbatim
- [x] 3.8 Add `describe('ServicesSection — card CTA (design-system solid button)')` with tests:
  - each card `<a>` `href` equals `"/servicios"`
  - each card `<a>` carries the solid primary button pattern: `bg-primary`, `hover:bg-primary-dark`, `text-white`, `inline-flex`, `px-6`, `py-3`, `font-heading`, `font-semibold`, `uppercase`, `text-xs`, `tracking-wide`, `transition-colors`
  - each card `<a>` does NOT carry only a text color token without background (assert NOT `class="...text-accent..."` / NOT `class="...text-primary..."` without `bg-primary`)
  - each card `<a>` contains an `<svg>` (Lucide `arrow-right`) with `aria-hidden="true"`
  - the card `<a>` opening tag does NOT carry `aria-hidden="true"` or `tabindex="-1"`
- [x] 3.9 Add `describe('ServicesSection — bottom CTA (centered, larger)')` with tests:
  - rendered HTML contains a `<div>` wrapper carrying `text-center` AFTER the card grid container
  - the bottom CTA `<a>` carries `href="/servicios"`
  - the bottom CTA visible text includes "Ver todos los servicios"
  - the bottom CTA `<a>` carries the larger solid button pattern: `bg-primary`, `hover:bg-primary-dark`, `text-white`, `inline-flex`, `items-center`, `gap-2`, `font-heading`, `font-semibold`, `uppercase`, `text-sm`, `tracking-wide`, `px-8`, `py-4`, `transition-colors`
  - the bottom CTA contains a decorative `lucide:arrow-right` `<svg>` with `aria-hidden="true"`
  - the bottom CTA `<a>` opening tag does NOT carry `aria-hidden="true"` or `tabindex="-1"`
- [x] 3.10 Add `describe('ServicesSection — heading outline')` with tests:
  - does NOT render `<h1>` or `<h2>`
  - renders exactly 1 `<h3>` and exactly 4 `<h4>`
  - `<h3>` does NOT carry `aria-hidden="true"` or `tabindex="-1"`
- [x] 3.11 Add `describe('ServicesSection — design tokens')` with tests:
  - rendered HTML does NOT contain literal hex color values (regex `/#[0-9a-fA-F]{3,8}/`)
  - rendered HTML does NOT contain `brand-(teal|navy|orange|gray)` tokens
  - rendered HTML does NOT contain any `rounded` utility (flat design)
- [x] 3.12 Add `describe('ServicesSection — dumb component')` with tests:
  - frontmatter of `ServicesSection.astro` does NOT contain `import.meta.env`
  - frontmatter does NOT contain `fetch(`
- [x] 3.13 Add `describe('ServicesSection — content config')` with tests importing `SERVICES_SECTION_CONTENT` and `SERVICES_DATA` from `@/lib/config/services-section`:
  - `SERVICES_SECTION_CONTENT` has the documented shape; `headline` and `description` are non-empty; `services` length is exactly 4; `cta.label` and `cta.href` are non-empty
  - `SERVICES_DATA` titles in render order are exactly: "Medición en Edificios", "Medición Industrial", "Obras y Proyectos", "Tratamiento de Agua y Desalinización"
  - `SERVICES_DATA` descriptions in render order match the spec exactly (including the corrected "Tratamiento de Agua y Desalinización" description)
  - every `SERVICES_DATA` element's `href` equals `"/servicios"`
  - every `SERVICES_DATA` element's `imageAlt` is a non-empty string
  - `cta.label` equals `"Ver todos los servicios"` and `cta.href` equals `"/servicios"`
- [x] 3.14 Add `describe('ServicesSection — snapshot')` with a single test rendering the component with `SERVICES_SECTION_CONTENT` and asserting `toMatchSnapshot()`
- [x] 3.15 Run `npx vitest run --project web ServicesSection` (run from `apps/web`: `npx vitest run ServicesSection`) and confirm ALL tests fail with the expected "module not found / component not yet implemented" reason (RED phase)

## 4. Component implementation (green) — `apps/web/src/components/ServicesSection.astro`

- [x] 4.1 Create `apps/web/src/components/ServicesSection.astro` with:
  - frontmatter imports: `ServicesSectionProps` from `@/lib/types/services-section`, `Icon` from `astro-icon/components`, `Image` from `astro:assets`
  - `interface Props extends ServicesSectionProps {}`
  - `const { headline, description, services, cta } = Astro.props;`
  - HTML comment documenting: dumb component, mobile-first layout, accessible semantics
  - `<section class="py-16 md:py-24 bg-secondary-dark">` wrapping `<div class="container mx-auto px-4 sm:px-6 lg:px-8">`
  - Header block: `<div class="text-center mb-12">` with `<h3 class="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white">{headline}</h3>` and `<p class="mt-4 text-base text-muted max-w-2xl mx-auto">{description}</p>`
  - Card grid: `<div class="grid grid-cols-1 md:grid-cols-2 gap-6">` mapping `services` to `<article class="flex flex-col sm:flex-row bg-secondary border border-secondary-light overflow-hidden">`
  - Each card image: `<Image src={service.image} alt={service.imageAlt} widths={[400, 800]} sizes="(max-width: 768px) 100vw, 50vw" loading="lazy" class="w-full sm:w-2/5 aspect-square object-cover grayscale" />`
  - Each card content wrapper: `<div class="flex-1 p-5 flex flex-col justify-between">` containing the title `<h4 class="text-lg font-heading font-semibold text-primary">{service.title}</h4>`, the description `<p class="mt-2 text-sm text-muted">{service.description}</p>`, and the per-card CTA `<a href={service.href} class="mt-4 inline-flex items-center gap-1 bg-primary hover:bg-primary-dark text-white font-heading font-semibold uppercase text-xs tracking-wide px-6 py-3 transition-colors self-start">{cta.label}<Icon name="lucide:arrow-right" class="h-3 w-3" aria-hidden="true" /></a>`
  - Bottom CTA wrapper: `<div class="mt-12 text-center">` containing `<a href={cta.href} class="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-heading font-semibold uppercase text-sm tracking-wide px-8 py-4 transition-colors">{cta.label}<Icon name="lucide:arrow-right" class="h-4 w-4" aria-hidden="true" /></a>`
- [x] 4.2 Run the full test suite: `npx vitest run ServicesSection` (from `apps/web`) — confirm ALL tests pass (GREEN phase). Small refactor: consolidated repeated card/bottom-CLA extraction into `forEachCard`/`getCardCta`/`getBottomWrapper` helpers to stay under the 400-line ESLint `max-lines` threshold; 43 tests still pass
- [x] 4.3 Inspect the generated snapshot file `apps/web/src/components/__tests__/__snapshots__/ServicesSection.test.ts.snap` and confirm it contains the expected structure (no surprises)

## 5. Page integration — `apps/web/src/pages/index.astro`

- [x] 5.1 Add the imports at the top of the frontmatter (after the `SOLUTION_SECTION_CONTENT` import, preserving alphabetical-ish ordering of the existing block):
  - `import ServicesSection from '@/components/ServicesSection.astro';`
  - `import { SERVICES_SECTION_CONTENT } from '@/lib/config/services-section';`
- [x] 5.2 Add `<ServicesSection {...SERVICES_SECTION_CONTENT} />` immediately AFTER `<SolutionSection {...SOLUTION_SECTION_CONTENT} />` inside the `<Layout>` slot
- [x] 5.3 Run the page render test (or add one if missing): confirm `apps/web/src/pages/index.astro` renders the 4 sections in order — HeroBanner, PanelHome, SolutionSection, ServicesSection (this is the spec scenario "Home page renders HeroBanner, PanelHome, SolutionSection and ServicesSection in order"). Verified via new e2e `e2e/services-section.spec.ts` (11 tests) + updated `e2e/solution-section.spec.ts` (DOM order + outline now 1/2/2/8) — 23/23 e2e pass
- [x] 5.4 Run the existing `no-brand-classes.test.ts` and `icon-catalog.test.ts` tests and confirm they still pass (no new brand classes introduced; only `lucide:arrow-right` icon used)

## 6. Verification & cleanup

- [x] 6.1 Run the full Vitest suite for `apps/web`: `npx vitest run` (from `apps/web`) — confirm 100% green (existing tests + new ServicesSection tests): 23 files, 315 tests passed
- [x] 6.2 Run TypeScript typecheck: `npm run typecheck` (from `apps/web` — `astro check && tsc --noEmit`) — confirm no errors: 0 errors / 0 warnings / 0 hints
- [x] 6.3 Run ESLint on the new files: `npx eslint -c .eslintrc.cjs <new files>` (from `apps/web`) — confirm no errors (e2e specs are ignored by the repo ignore pattern, same as existing e2e specs)
- [x] 6.4 Run `openspec verify --change services-section` (or `openspec status --change services-section --json`) and confirm ALL specs are satisfied (status `isComplete: true`): `openspec validate services-section` → "Change 'services-section' is valid"
- [x] 6.5 Manually verify the visual result with Playwright e2e: on desktop the ServicesSection shows a dark navy block with 2×2 horizontal grayscale cards and a centered bottom CTA; on mobile the cards stack vertically (image on top, content below) — flat design (no rounded corners, no shadows on cards). Verified by `e2e/services-section.spec.ts` (real browser, 1280px and 375px viewports)
- [x] 6.6 Mark all tasks above as completed and prepare the change for `/archive services-section` (out of scope for this apply phase). NOTE: per AGENTS.md rule 4, the OpenSpec artifacts were updated first (spec integration scenario now declares 1/2/2/8 page outline; `tasks.md` reflects the e2e additions) before the e2e code changes were applied

## 7. POST-APPLY UPDATE — client request: full-color images + "Ver detalles" card CTA (2026-08-09)

> Per AGENTS.md rule 4, the OpenSpec artifacts were updated FIRST (spec.md requirements/scenarios, design.md Decisions 8 & 9) and then the code. This section records the fix; the spec/design are the authoritative record.

- [x] 7.1 Update `specs/services-section/spec.md`: image requirement SHALL render full-color (remove grayscale) + scenario "Each card image is rendered in full color (no grayscale filter)"; card CTA requirement SHALL show visible text "Ver detalles" (from `service.ctaLabel`) + scenario "Each card CTA visible text is 'Ver detalles'"; content requirement SHALL carry `ctaLabel: "Ver detalles"` per service + scenario "Each service carries the 'Ver detalles' card CTA label"
- [x] 7.2 Update `design.md`: Decision 8 superseded (grayscale removed → full color), Decision 9/Sub-decision 9a (per-card label "Ver detalles", bottom CTA stays "Ver todos los servicios"), Risks & Migration Plan updated accordingly
- [x] 7.3 RED: update `apps/web/src/components/__tests__/ServicesSection.test.ts` — image test asserts NO `grayscale`; new card CTA text test (`/Ver detalles/` via `service.ctaLabel`, NOT "Ver todos los servicios"); config test asserts every `ctaLabel` = "Ver detalles"; `forEachCard` now passes the corresponding `Service` — 3 tests fail against the old implementation
- [x] 7.4 GREEN: add `readonly ctaLabel: string` to `Service` (`lib/types/services-section.ts`), `ctaLabel: 'Ver detalles'` on each of the 4 services (`lib/config/services-section.ts`), remove `grayscale` from the `<Image>` class and render `{service.ctaLabel}` in the card CTA (`ServicesSection.astro`) — 46/46 Vitest pass (snapshot regenerated with `-u`)
- [x] 7.5 Update `apps/web/e2e/services-section.spec.ts`: image filter asserts NOT grayscale; card CTA role name `/Ver detalles/`; bottom CTA test unchanged — 23/23 (services + solution sections) then full chromium suite 76/76 pass
- [x] 7.6 Refactor: extract render/extraction helpers (render, forEachCard, getCardCta, getBottomWrapper, countOccurrences, escapeRegex, stripHtmlComments) to `apps/web/src/components/__tests__/helpers/services-section-test-utils.ts` to keep `ServicesSection.test.ts` under the 400-line ESLint `max-lines` budget (421 → 371) — ESLint 0 problems
- [x] 7.7 Full verification: Vitest 23 files / 318 tests passed; `npm run typecheck` 0 errors / 0 warnings / 0 hints; Playwright chromium 76/76 passed; `openspec validate services-section --strict` → "Change 'services-section' is valid"
- [x] 7.8 /verify follow-up: add the 2 remaining explicit assertions so all 48 spec scenarios have direct unit coverage — (a) "each card image alt is NOT identical to the card h4 title" (R5-S3), (b) "SERVICES_DATA imports the correct image file per card index" via `{src}` containment (R14-S7). Both green immediately (invariants already satisfied); test file compacted to stay under the 400-line ESLint `max-lines` budget (403 → 397). Final state: Vitest 23 files / **320 tests passed**, typecheck **0 errors / 0 warnings / 0 hints**, ESLint **0 problems**
