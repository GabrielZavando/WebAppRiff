## 1. Types and Configuration

- [x] 1.1 Create `src/lib/types/destacados-section.ts` with `FeaturedProduct` (id, titulo, slug, imagen: ImageMetadata, imagenAlt — no price fields) and `DestacadosSectionProps` (headline, ctaText, ctaHref, products)
- [x] 1.2 Create `src/lib/config/destacados-section.ts` exporting `FEATURED_PRODUCTS` (exactly 4 products in the client-specified order with the real image imports from `src/assets/img/`) and `DESTACADOS_SECTION_CONTENT: Readonly<DestacadosSectionProps>` (headline "Soluciones Destacadas", ctaText "EXPLORAR CATÁLOGO COMPLETO", ctaHref "/productos")
- [x] 1.3 Add Vitest tests for the types and config contract (`src/lib/types/__tests__/destacados-section.test.ts` and `src/lib/config/__tests__/destacados-section.test.ts`): shape, titles in order, image imports, slugs kebab-case, no price fields — following the services-section test conventions

## 2. Component Implementation

- [x] 2.1 Write the failing Vitest component suite `src/components/__tests__/DestacadosSection.test.ts` (using `experimental_AstroContainer`) covering: flat dark section, header row (h3 headline + accent CTA), responsive grid 1/2/4, card structure (white, shadow-2/hover:shadow-4, image mat with object-contain), lazy images with descriptive alt via astro:assets, h4 titles, "Cotizar" outline primary CTA linking to `/productos/{slug}`, NO price rendering, heading outline (1 h3 + N h4, no h1/h2), canonical tokens only (no hex/brand/rounded), no icons, dumb-component contract
- [x] 2.2 Create `src/components/DestacadosSection.astro` (dumb presentational component receiving `DestacadosSectionProps` via `Astro.props`; `bg-secondary-dark` section, canonical container, `flex flex-col sm:flex-row justify-between` header, `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` product grid)
- [x] 2.3 Run the new test suite until green and run a snapshot update if the suite includes one

## 3. Home Page Integration

- [x] 3.1 Modify `apps/web/src/pages/index.astro` to import `DestacadosSection` and `DESTACADOS_SECTION_CONTENT` and render `<DestacadosSection {...DESTACADOS_SECTION_CONTENT} />` immediately after `<ServicesSection />`

## 4. Verification

- [x] 4.1 Run the full `apps/web` test suite plus typecheck (`npm run test` / `npm run typecheck` in `apps/web`) and confirm all tests pass, including the existing linter tests (`no-brand-classes.test.ts`, `icon-catalog.test.ts`) and the design-tokens sync test
- [x] 4.2 Run `npm run build` in `apps/web` and confirm the home page builds with the new section (image imports resolve, no broken assets)

## 5. POST-APPLY UPDATE (client: section background = #006874)

- [x] 5.1 Add token `--color-primary-deep: #006874` to `@theme` in `apps/web/src/styles/globals.css` AND `apps/admin/src/styles/globals.css` (mirror sync test must stay green), and register it in the canonical table `docs/design/style-guide/README.md`; add its assertion to `apps/web/src/styles/__tests__/tokens.test.ts`
- [x] 5.2 Update `src/components/DestacadosSection.astro` to use `bg-primary-deep` instead of `bg-secondary-dark`; update the component test suite (`DestacadosSection.test.ts`) and its snapshot to assert `bg-primary-deep`
- [x] 5.3 Re-run the full `apps/web` suite (`npm run test`), typecheck (`npm run typecheck`) and `npm run build`; run the admin suite (`apps/admin`) to confirm the sync test still passes

## 6. POST-VERIFY UPDATE (home page heading outline in existing e2e specs)

- [x] 6.1 Update OpenSpec scenario "DOM order is preserved" to state the new home outline (1 h1, 2 h2, 3 h3, 12 h4) and reword the landmark assertion so it checks that DestacadosSection introduces no new `<header>` (its outermost element is a `<section>`), instead of asserting a global header count that was inherited from the services-section spec
- [x] 6.2 Update `apps/web/e2e/solution-section.spec.ts` and `apps/web/e2e/services-section.spec.ts`: their "document keeps exactly 1 h1, 2 h2, 2 h3 and 8 h4" test now expects `3` h3 and `12` h4 (DestacadosSection adds its own `<h3>` + 4 `<h4>`), with comments referencing destacados-section spec scenario "DOM order is preserved"
- [x] 6.3 Run the updated e2e specs (`npx playwright test --project=chromium solution-section services-section`) and confirm green; re-run the full `apps/web` unit suite to confirm nothing else regressed