## Why

The current home page (`apps/web/src/pages/index.astro`) composes three sections — `HeroBanner`, `PanelHome` and `SolutionSection` — but does not surface Riff's specialized technical services (building metering, industrial metering, civil works, water treatment). The client delivered a `ServicesSection.png` mockup (in `docs/design/components/`) showing a fourth home section with a dark navy background, a centered header, a 2×2 grid of horizontal service cards with grayscale imagery, and a bottom CTA. Adding this section closes the gap between the marketing mockup and the live site and gives visitors a clear entry point to the future `/servicios` page.

## What Changes

- Add a new dumb presentational Astro component `ServicesSection.astro` that renders a centered header (`<h3>` headline + `<p>` description), a responsive 2×2 grid of 4 horizontal service cards (image left, content right on `sm:+`), and a centered bottom CTA button linking to `/servicios`.
- Add the matching TypeScript types (`Service`, `ServicesSectionCta`, `ServicesSectionProps`) in `src/lib/types/services-section.ts`.
- Add the hardcoded content constant `SERVICES_SECTION_CONTENT` (and the `SERVICES_DATA` array of 4 services) in `src/lib/config/services-section.ts`, importing 4 images already delivered by the client into `src/assets/img/` (`edificios.jpg`, `medidores-de-agua.webp`, `planta-tratamiento.webp`, `osmosis-inversa.jpg`).
- Add a Vitest + `experimental_AstroContainer` test suite `src/components/__tests__/ServicesSection.test.ts` covering structure, header, card grid, card layout, content, CTAs, heading outline, design tokens, dumb-component contract and a snapshot.
- Modify `apps/web/src/pages/index.astro` to import and render `<ServicesSection {...SERVICES_SECTION_CONTENT} />` immediately after `<SolutionSection />`.

No existing component is modified; the change is purely additive on the home page.

## Capabilities

### New Capabilities
- `services-section`: A home page section presenting 4 specialized technical services (Medición en Edificios, Medición Industrial, Obras y Proyectos, Tratamiento de Agua y Desalinización) as a 2×2 grid of horizontal cards with grayscale imagery, design-system solid CTAs, and a bottom "Ver todos los servicios" CTA linking to `/servicios`.

### Modified Capabilities
<!-- None. This is a brand new section; no existing spec-level behavior changes. -->

## Impact

- **Code (frontend — Astro SSG, `apps/web`)**:
  - New files: `src/lib/types/services-section.ts`, `src/lib/config/services-section.ts`, `src/components/ServicesSection.astro`, `src/components/__tests__/ServicesSection.test.ts`.
  - Modified file: `src/pages/index.astro` (adds one import and one rendered component at the end of the `<Layout>` slot).
- **Assets**: Consumes 4 already-present images in `src/assets/img/` (`edificios.jpg`, `medidores-de-agua.webp`, `planta-tratamiento.webp`, `osmosis-inversa.jpg`) via `astro:assets`. No new image upload required.
- **APIs**: None. The section is fully static (SSG); CTAs link to `/servicios`, a page that does not exist yet and is out of scope for this change.
- **Dependencies**: None. Reuses existing Astro 7.1.6, Tailwind v4, `astro-icon` + `@iconify-json/lucide` and `astro:assets` (sharp) already wired for `SolutionSection`.
- **Design system**: Consumes only tokens already declared in `apps/web/src/styles/globals.css` (`bg-secondary-dark`, `bg-secondary`, `border-secondary-light`, `text-primary`, `text-muted`, `text-white`, `bg-primary`, `text-accent`, `font-heading`). No token additions; no `globals.css` change; the admin sync test is unaffected.
- **Accessibility**: Adds one `<h3>` (subordinate to PanelHome's `<h2>`) and 4 `<h4>` card titles, preserving the home page heading outline (still exactly one `<h1>` and one `<h2>`). All card images are `loading="lazy"` with descriptive `alt`; arrow icons are `aria-hidden="true"`.
- **Tests**: New Vitest suite. The flat-design linter test (`no-brand-classes.test.ts`) and the icon-catalog test (`icon-catalog.test.ts`) continue to pass because the component only uses `lucide:arrow-right` (already in the catalog) and only design-system utilities.
- **Build output**: Adds one more statically generated section to `/`; no new routes.
