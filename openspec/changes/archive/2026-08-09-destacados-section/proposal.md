## Why

The home page (`apps/web/src/pages/index.astro`) currently composes four sections — `HeroBanner`, `PanelHome`, `SolutionSection` and `ServicesSection` — but does not showcase the catalog's featured products ("destacados"). The client delivered a `DestacadosSection.png` mockup (in `docs/design/components/`) showing a fifth home section with a dark background, a headline, a "EXPLORAR CATÁLOGO COMPLETO" CTA on the header row, and a responsive 4-card grid of featured products (image, title, "Cotizar" CTA — no prices). Adding this section surfaces the flagship products on the home page and gives visitors a direct conversion path to the quote flow.

## What Changes

- Add a new dumb presentational Astro component `DestacadosSection.astro` that renders a dark section with a header row (white `<h3>` headline + orange accent CTA "EXPLORAR CATÁLOGO COMPLETO" linking to `/productos`) and a responsive grid of `products` cards (1/2/4 columns).
- Each product card SHALL render the product image (via `astro:assets`), the product title as `<h4>`, and a "Cotizar" link CTA (outline primary button pattern). **No prices are rendered** anywhere in the section.
- Add the matching TypeScript types (`FeaturedProduct`, `DestacadosSectionProps`) in `src/lib/types/destacados-section.ts`.
- Add the hardcoded content constant `DESTACADOS_SECTION_CONTENT` (and the `FEATURED_PRODUCTS` array of 4 products) in `src/lib/config/destacados-section.ts`, importing the 4 images already present in `src/assets/img/` (`antiincrustante-Bimaks.png`, `flujometro-multiproposito.webp`, `FULLSONIC-DOPPLER-CONTABLE.webp`, `MWN-DN50.webp`).
- Add a Vitest + `experimental_AstroContainer` test suite `src/components/__tests__/DestacadosSection.test.ts` covering structure, header, card grid, card content, CTAs, heading outline, design tokens, dumb-component contract and a snapshot.
- Modify `apps/web/src/pages/index.astro` to import and render `<DestacadosSection {...DESTACADOS_SECTION_CONTENT} />` immediately after `<ServicesSection />`.

No existing component is modified; the change is purely additive on the home page.

## Capabilities

### New Capabilities
- `destacados-section`: A home page section presenting 4 featured catalog products ("Soluciones Destacadas") as a responsive 1/2/4-column grid of cards (image + title + "Cotizar" CTA, no prices), with a header row CTA "EXPLORAR CATÁLOGO COMPLETO" linking to `/productos`.

### Modified Capabilities
<!-- None. This is a brand new section; no existing spec-level behavior changes. -->

## Impact

- **Code (frontend — Astro SSG, `apps/web`)**:
  - New files: `src/lib/types/destacados-section.ts`, `src/lib/config/destacados-section.ts`, `src/components/DestacadosSection.astro`, `src/components/__tests__/DestacadosSection.test.ts`.
  - Modified file: `src/pages/index.astro` (adds one import and one rendered component after `<ServicesSection />`).
- **Assets**: Consumes 4 already-present images in `src/assets/img/` (`antiincrustante-Bimaks.png`, `flujometro-multiproposito.webp`, `FULLSONIC-DOPPLER-CONTABLE.webp`, `MWN-DN50.webp`) via `astro:assets`. No new image upload required.
- **APIs**: None. The section is fully static (SSG). Product detail pages (`/productos/{slug}`) do not exist yet and are out of scope; the "Cotizar" CTAs link to `/productos/{slug}` as the future detail route base (same trade-off as `SolutionSection`'s `href`).
- **Dependencies**: None. Reuses existing Astro, Tailwind v4, `astro-icon` + `@iconify-json/lucide` (already wired with Lucide) and `astro:assets` (sharp).
- **Design system**: Consumes tokens declared in `apps/web/src/styles/globals.css` (`bg-primary-deep`, `bg-white`, `text-white`, `text-secondary`, `bg-accent`, `hover:bg-accent-dark`, `border-primary`, `text-primary`, `hover:bg-primary`, `font-heading`, `shadow-2`, `hover:shadow-4`). (POST-APPLY UPDATE on 2026-08-09: a new token `--color-primary-deep: #006874` is ADDED to `@theme` in BOTH `apps/web/src/styles/globals.css` (with its assertion in `apps/web/src/styles/__tests__/tokens.test.ts`) and `apps/admin/src/styles/globals.css` (the admin mirror keeps `sync.test.ts` green), plus the canonical table in `docs/design/style-guide/README.md`. This is the only token addition; all other consumed tokens were already declared.)
- **Accessibility**: Adds one `<h3>` (sibling to SolutionSection/ServicesSection `<h3>`s) and 4 `<h4>` card titles, preserving the home page heading outline (still exactly one `<h1>` and one `<h2>`). All card images are `loading="lazy"` with descriptive `alt`. The header CTA and card CTAs are real links with visible text (no `aria-hidden` on links).
- **Tests**: New Vitest suite. The flat-design linter test (`no-brand-classes.test.ts`) and the icon-catalog test (`icon-catalog.test.ts`) continue to pass because the component uses no icons (no Lucide icons needed for this section) and only design-system utilities.
- **Build output**: Adds one more statically generated section to `/`; no new routes.