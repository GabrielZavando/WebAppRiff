## Context

The home page (`apps/web/src/pages/index.astro`) is an Astro SSG site composed of dumb presentational sections: `HeroBanner`, `PanelHome`, `SolutionSection`, `ServicesSection`. Each section follows the same architecture (see `openspec/specs/services-section/spec.md` and the archived `2026-08-09-services-section` change):

- `src/components/<Name>.astro` — dumb component, receives all data via typed props.
- `src/lib/types/<name>.ts` — prop/entity interfaces (single source for the prop contract).
- `src/lib/config/<name>.ts` — hardcoded `Readonly<Props>` content constant (SSG: content changes require a rebuild anyway; a future `contentful-from-cms` change will replace this).
- `src/components/__tests__/<Name>.test.ts` — Vitest suite using `experimental_AstroContainer`.

The client delivered `docs/design/components/DestacadosSection.png`: a dark section titled "Soluciones Destacadas" with a "EXPLORAR CATÁLOGO COMPLETO" CTA on the header row and a 4-card grid of featured products. Client decisions (2026-08-09): the 4 products are hardcoded (exact titles in order), their images already live in `src/assets/img/`, **no prices are shown**, and each card CTA reads "Cotizar". The section goes right after `ServicesSection`.

## Goals / Non-Goals

**Goals:**
- Add `DestacadosSection` as the 5th home section, visually consistent with the mockup and the existing design tokens.
- Follow the exact dumb-component + config architecture of the sibling sections so the future CMS migration path stays uniform.
- Keep the home page heading outline valid: one `<h1>`, one `<h2>`, three `<h3>` (SolutionSection, ServicesSection, DestacadosSection), 12 `<h4>` (4+4+4).

**Non-Goals:**
- No API/data fetching (`GET /api/v1/products?destacado=true` is future work when the catalog is live; today all content is hardcoded by design for SSG).
- No price rendering or `precio` fields in the types (client decision: no prices on this section).
- No product detail routes (`/productos/{slug}` pages do not exist yet); the card CTA href is a best-effort link to the future slug route.
- No changes to `globals.css` / design tokens, and no new images (the 4 client images already exist).
- No icon usage in this section (the mockup has no icons; keeps the icon-catalog test unaffected).

## Decisions

### Decision 1: Dumb presentational component receiving all data via props
`DestacadosSection.astro` SHALL be a dumb component exactly like `ServicesSection.astro`: no `fetch`, no `import.meta.env`, no state. All content arrives through `DestacadosSectionProps` spread by `index.astro`.
- *Why*: uniform with the sibling sections and the project standard (frontend-standards § SRP — Astro). Testable in isolation via `AstroContainer`.
- *Alternative rejected*: fetching `GET /api/v1/products?destacado=true&limit=4` in the frontmatter — the backend/BFF catalog API is not wired to the SSG site yet (the `/productos` page is still a placeholder) and would break the dumb-component contract.

### Decision 2: Hardcoded content constant in `lib/config/destacados-section.ts`
Export `DESTACADOS_SECTION_CONTENT: Readonly<DestacadosSectionProps>` with `headline: 'Soluciones Destacadas'`, `ctaText: 'EXPLORAR CATÁLOGO COMPLETO'`, `ctaHref: '/productos'` and `FEATURED_PRODUCTS: readonly FeaturedProduct[]` with the 4 products in the exact client order and titles:
1. "Antiincrustante Bimaks 420 para Ósmosis Inversa (Agua Salobre)" → `antiincrustante-Bimaks.png`
2. "Flujómetro Universal" → `flujometro-multiproposito.webp`
3. "Medidor Ultrasónico Doppler Portátil Fullsonic (No Invasivo)" → `FULLSONIC-DOPPLER-CONTABLE.webp` (note: the real file extension is `.webp`, not `.wep`)
4. "MWN – MEDIDOR INDUSTRIAL PARA AGUA FRÍA LIMPIA – MEDIDOR TIPO WOLTMAN" → `MWN-DN50.webp`
- *Why*: identical pattern to `SOLUTION_SECTION_CONTENT` and `SERVICES_SECTION_CONTENT`; SSG makes hardcoding the norm until the CMS change lands.
- *Alternative rejected*: sourcing from the API — same reason as Decision 1.

### Decision 3: FeaturedProduct type without price fields
`FeaturedProduct` SHALL carry `id`, `titulo`, `slug`, `imagen: ImageMetadata`, `imagenAlt`. No `precio` field — the client explicitly stated the section shows no prices.
- *Why*: YAGNI — adding `precio` unused would violate "never implement more than the task asks" and mislead future readers.
- *Trade-off*: when the CMS/API migration lands, `FeaturedProduct` will gain the `precio` (`{valor, visible}`) and gallery fields; that is a future delta spec, not this change.

### Decision 4: Card CTA "Cotizar" uses the outline primary button pattern
Each card CTA is an `<a href={`/productos/${slug}`}>` with the design-system outline button pattern: `border-2 border-primary text-primary hover:bg-primary hover:text-white font-heading font-semibold uppercase text-xs tracking-wide px-4 py-3 block text-center transition-colors`. The header CTA uses the solid accent pattern: `bg-accent hover:bg-accent-dark text-white font-heading font-semibold uppercase text-xs tracking-wide px-6 py-3 transition-colors`.
- *Why*: the mockup shows an outline/teal CTA on cards and a filled CTA on the header row; both patterns already exist in the design system (`HeroBanner` uses solid accent + outline variants; `SolutionSection`/`ServicesSection` use solid primary). Different visual weight (outline card vs solid header) preserves the mockup hierarchy.
- *Alternative rejected*: solid primary (`bg-primary`) on cards — would compete visually with the header accent CTA and deviate from the mockup.

### Decision 5: Image presentation — white padded background, `object-contain`
Card layout mirrors the mockup: image on a white padded container (`p-4` white area) using `aspect-square object-contain`, then a white content area with `<h4>` + CTA. Whole `<article>` is `bg-white shadow-2 hover:shadow-4 transition-shadow`.
- *Why*: product photos are product shots (not 4:3 landscape marketing photos like `SolutionSection`), so `object-contain` on a white mat avoids cropping the product; `shadow-2 → hover:shadow-4` is the flat-design-approved floating-layer treatment already used by `SolutionSection`.
- *Alternative rejected*: `aspect-[4/3] object-cover` (SolutionSection style) — would crop product shots and clash with the mockup's white product mat.

### Decision 6: Section background and layout follow the mockup's dark teal band
`<section class="py-16 md:py-24 bg-primary-deep">` with the canonical `container mx-auto px-4 sm:px-6 lg:px-8`; header row is `flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12` (title left, CTA right on `sm+`); card grid is `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8`.
(POST-APPLY UPDATE on 2026-08-09: the client specified the background color must be `#006874` — a deep teal NOT present in the original token set. Since literal hex is prohibited in components (frontend-standards § Design Tokens), a new token `--color-primary-deep: #006874` was added to BOTH `apps/web/src/styles/globals.css` and `apps/admin/src/styles/globals.css` (the admin mirror is enforced by `apps/admin/src/styles/__tests__/sync.test.ts`), and to the canonical `docs/design/style-guide/README.md` table. The section therefore uses `bg-primary-deep`, NOT `bg-secondary-dark`.)
- *Why*: matches the mockup (dark teal band with a hard color transition between the light `bg-bg` ServicesSection above and the footer below) and mirrors `ServicesSection`'s dark-flat-section treatment with the shared container token. The teal family (`primary-*`) is Riff's brand color; the deep teal is the dark anchor of that family.
- *Alternative rejected*: reusing `bg-secondary-dark` (navy, ServicesSection) — the client explicitly requested `#006874`, and navy would flatten the visual distinction between the services section and the featured section.
- *Alternative rejected*: hardcoding `#006874` as an inline style/arbitrary value in the component — violates the canonical-tokens rule (no literal hex in components) and would break the admin sync/parity guarantees.

### Decision 7: Heading hierarchy — `<h3>` section + `<h4>` per card
Section headline SHALL be `<h3 class="... text-white font-heading ...">` (sibling to SolutionSection/ServicesSection `<h3>`s); each product title SHALL be `<h4>` (line-clamped, `text-secondary` on white card). No eyebrow, no underline (mockup shows neither).
- *Why*: preserves the strict heading outline (frontend-standards + design.md sibling decisions): exactly one `<h1>` (HeroBanner) and one `<h2>` (PanelHome) remain; `<h3>` count grows to 3.
- *Alternative rejected*: `<h2>` — would break the outline (PanelHome owns the only `<h2>`).

## Risks / Trade-offs

- [Card titles are long (e.g. MWN title is uppercase + hyphenated)] → Mitigation: `line-clamp-3` + `min-h` reservation so cards stay equal-height and the CTA aligns across the row; the full verbatim title is preserved in the config (client-specified copy).
- [`FULLSONIC-DOPPLER-CONTABLE.webp` extension typo risk (`wep` vs `webp`)] → Mitigation: config imports the actual file `FULLSONIC-DOPPLER-CONTABLE.webp` that exists in `src/assets/img/` (verified); a broken import fails at build time (Astro), so the test suite + build guard the path.
- [`/productos/{slug}` routes do not exist yet — "Cotizar" links may 404] → Mitigation: accepted for this change (same trade-off as `SolutionSection`'s generic `/soluciones` href); the slug field is already part of the contract so the link target only needs the future route, no type change. The header CTA links to the existing `/productos` placeholder page.
- [Hardcoded content diverges from the future catalog API] → Mitigation: the dumb-component contract means the CMS/API migration only replaces the config constants, never the component (documented migration path in Decision 1/2).

## Migration Plan

- Additive change: deploy is a normal SSG rebuild of `apps/web`; no database, API or token changes.
- Rollback: revert the `index.astro` diff (remove import + render) or redeploy the previous container image; no data migration involved.