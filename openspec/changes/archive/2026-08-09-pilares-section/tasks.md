## 1. Types and Configuration

- [x] 1.1 Create `src/lib/types/pilares-section.ts` with `PilarIconName` closed union (`'recycle' | 'clock' | 'monitor' | 'headphones'`, verified against `@iconify-json/lucide`), `Pilar` interface (`label`, `icon`), `PilaresCta` (`label`, `href`) and `PilaresSectionProps` (`eyebrow`, `headline`, `description`, `cta`, `rightHeadline`, `rightDescription`, `pillars`, `leftImage: ImageMetadata`, `rightImage: ImageMetadata`, `leftImageAlt`, `rightImageAlt`) — following the solution-section type conventions (closed union rationale in design.md § Decision 5)
- [x] 1.2 Create `src/lib/config/pilares-section.ts` exporting `PILARES_SECTION_CONTENT: Readonly<PilaresSectionProps>` with eyebrow "Sostenibilidad y Eficiencia", headline "Comprometidos con la Optimización de Recursos", description (mockup copy), cta `{ label: "HABLEMOS DE TU PROYECTO", href: "/contacto" }`, rightHeadline "Nuestros Pilares de Excelencia", rightDescription (mockup copy), 4 pillars in order ("Sostenibilidad"/recycle, "Proyectos a tiempo"/clock, "Tecnología de Vanguardia"/monitor, "Soporte Técnico Especializado"/headphones), `leftImage` from `sostenibilidad-edificios.jpg`, `rightImage` from `planta-tratamiento-ecologica.webp`, plus descriptive `leftImageAlt`/`rightImageAlt`
- [x] 1.3 Add Vitest tests for the types and config contract (`src/lib/types/__tests__/pilares-section.test.ts` and `src/lib/config/__tests__/pilares-section.test.ts`): shape, copy values, pillar labels/icons in order, image imports, imageAlt non-empty, no price fields — following the destacados-section test conventions

## 2. Component Implementation

- [x] 2.1 Write the failing Vitest component suite `src/components/__tests__/PilaresSection.test.ts` (using `experimental_AstroContainer`) covering: full-bleed two-column section (outermost `<section>` without bg/container classes, `grid-cols-1 lg:grid-cols-2`), per-column background `<Image>` with `object-cover` + overlay `bg-secondary-dark/80` + content `relative z-10`, left column (eyebrow accent, h2 white, description, accent CTA → /contacto), right column (h3 white, description, 4 pillar items with Lucide icons and white labels), background images via astro:assets (hashed src, lazy, descriptive alt), heading outline (1 h2 + 1 h3, no h1/h4), canonical tokens only (no hex/brand/rounded), dumb-component contract (no import.meta.env/fetch), icons aria-hidden
- [x] 2.2 Create `src/components/PilaresSection.astro` (dumb presentational component receiving `PilaresSectionProps` via `Astro.props`; `<section class="grid grid-cols-1 lg:grid-cols-2">` full-bleed, each column `relative` with background `<Image>` + overlay div + `relative z-10` content; left column copy + CTA; right column copy + pillar list with `<Icon name={`lucide:${pilar.icon}`} />`)
- [x] 2.3 Run the new test suite until green and run a snapshot update if the suite includes one

## 3. Home Page Integration

- [x] 3.1 Modify `apps/web/src/pages/index.astro` to import `PilaresSection` and `PILARES_SECTION_CONTENT` and render `<PilaresSection {...PILARES_SECTION_CONTENT} />` immediately after `<DestacadosSection />` as the last section inside `<Layout>`

## 4. Verification

- [x] 4.1 Run the full `apps/web` test suite plus typecheck (`npm run test` / `npm run typecheck` in `apps/web`) and confirm all tests pass, including the existing linter tests (`no-brand-classes.test.ts`, `icon-catalog.test.ts`) and the design-tokens sync test
- [x] 4.2 Run `npm run build` in `apps/web` and confirm the home page builds with the new section (image imports resolve, no broken assets)

## 5. E2E Outline Update (home outline 1/2/3/12 → 1/3/4/12)

- [x] 5.1 Update `apps/web/e2e/solution-section.spec.ts` and `apps/web/e2e/services-section.spec.ts`: the "document keeps exactly 1 h1, 2 h2, 3 h3 and 12 h4" test now expects `3` h2 and `4` h3 (PilaresSection adds its own `<h2>` + `<h3>`), with comments referencing the pilares-section spec scenario "DOM order is preserved"
- [x] 5.2 Update the OpenSpec spec scenario "DOM order is preserved" in `openspec/changes/pilares-section/specs/pilares-section/spec.md` if the actual count differs from the planned 1/3/4/12 (spec artifacts before code, per base-standards §7) — no change needed: the spec already declares 1 h1 / 3 h2 / 4 h3 / 12 h4 and the e2e confirms it
- [x] 5.3 Run the updated e2e specs (`npx playwright test --project=chromium solution-section services-section`) and confirm green; re-run the full `apps/web` unit suite to confirm nothing else regressed

## 6. POST-APPLY FIX (client: column color overlays)

- [x] 6.1 Update OpenSpec artifacts FIRST (base-standards §7): spec scenario "Each column has a background image with its color overlay" now declares LEFT overlay `bg-secondary/80` (navy `#1F2D40`) and RIGHT overlay `bg-primary/80` (teal `#41B3C4`) — NOT `bg-secondary-dark/80` on both; design.md § Decision 3 rewritten with the POST-APPLY FIX note (client feedback 2026-08-09, verified by pixel sampling of the mockup: left ≈ navy, right ≈ teal)
- [x] 6.2 Update `src/components/PilaresSection.astro`: left column overlay `bg-secondary/80`, right column overlay `bg-primary/80`
- [x] 6.3 Update `src/components/__tests__/PilaresSection.test.ts` overlay assertions (left `bg-secondary/80`, right `bg-primary/80`) and re-run the component suite until green
- [x] 6.4 Re-run the full `apps/web` suite (`npm run test`), typecheck (`npm run typecheck`) and `npm run build`; re-run e2e (`npx playwright test --project=chromium solution-section services-section`) to confirm the home still passes with the new overlays

## 7. POST-APPLY FIX #2 (client: right column — solid background, eyebrow, icon colors)

- [x] 7.1 Update OpenSpec artifacts FIRST (base-standards §7): spec requirements "full-bleed two-column section" (right column is solid `bg-primary-deep` #006874, NO photo, NO overlay), "Right column renders eyebrow, h3 headline, description and the pillar list" (`rightEyebrow` prop "Estándares de Calidad" with `text-primary`, icons `text-primary` instead of `text-accent`), "left background image uses astro:assets" (only LEFT image remains; `rightImage`/`rightImageAlt` removed from contract), "content is configured via a hardcoded constant" (`rightEyebrow` added, `rightImage`/`rightImageAlt` removed); design.md § Decisions 2, 3, 7, 8 + Goals + Risks rewritten with POST-APPLY FIX #2 notes (client feedback: the `planta-tratamiento-ecologica.webp` photo "no se ve nada de bien")
- [x] 7.2 Update `src/lib/types/pilares-section.ts`: remove `rightImage`/`rightImageAlt` from `PilaresSectionProps`, add `rightEyebrow: string`
- [x] 7.3 Update `src/lib/config/pilares-section.ts`: add `rightEyebrow: "Estándares de Calidad"`, remove `rightImage`/`rightImageAlt` import and fields
- [x] 7.4 Update failing tests FIRST (TDD red): `src/components/__tests__/PilaresSection.test.ts` (right column: `bg-primary-deep`, no image element, eyebrow span "Estándares de Calidad" with `text-primary`, icons `text-primary`; exactly ONE image in the section), `src/lib/config/__tests__/pilares-section.test.ts` (shape without rightImage, rightEyebrow value) and `src/lib/types/__tests__/pilares-section.test.ts` (no rightImage/rightImageAlt, rightEyebrow present)
- [x] 7.5 Update `src/components/PilaresSection.astro` (green): right column `<div class="bg-primary-deep p-8 md:p-12 lg:p-16">` without Image/overlay, rightEyebrow `<span>` with `text-primary` before the h3, icons `text-primary`
- [x] 7.6 Run the full `apps/web` suite (`npm run test`), typecheck, `npm run build`; run e2e (`npx playwright test --project=chromium solution-section services-section`) — heading outline stays 1/3/4/12 (eyebrow is a `<span>`, not a heading)