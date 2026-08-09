## Context

The Riff public site (`apps/web`, Astro 7.1.6 SSG + Tailwind v4 + `astro-icon`/`astro:assets`) currently renders three sections on the home page (`apps/web/src/pages/index.astro`):

1. `HeroBanner` — `<h1>` hero with full-bleed background and two CTAs.
2. `PanelHome` — `<h2>` trust panel overlapping the hero via negative margin.
3. `SolutionSection` — `<h3>` portfolio with 4 vertical solution cards (`sm:grid-cols-2 lg:grid-cols-4`), each with a `bg-primary` Lucide badge, a color image, and a solid "SABER MÁS" CTA.

The client delivered a `ServicesSection.png` mockup in `docs/design/components/` depicting a **fourth** home section that is visually distinct from `SolutionSection`:

- Dark navy background (not the light `bg-bg` of `SolutionSection`).
- Centered header (no eyebrow, no teal underline) — `<h3>` headline + `<p>` description.
- 2×2 grid of **horizontal** cards: grayscale image on the left (~40% width) + content on the right.
- A centered CTA button below the grid labelled "Ver todos los servicios" linking to `/servicios`.

The 4 services shown are different content from the 4 solutions already on the site (e.g. "Medición en Edificios" vs. the existing "Medición de Fluidos"). The 4 service images were already delivered by the client into `apps/web/src/assets/img/`: `edificios.jpg`, `medidores-de-agua.webp`, `planta-tratamiento.webp`, `osmosis-inversa.jpg` (mix of JPEG and WebP — `astro:assets` handles both).

Stakeholders: Riff (client) wants the home page to mirror the delivered mockup; the development team wants the new section to follow the same dumb-component architecture already established by `HeroBanner`/`PanelHome`/`SolutionSection` (types → config → component → test → page).

This design document defines HOW `ServicesSection` is implemented so the spec (requirements/scenarios) and the task list can be derived deterministically.

## Goals / Non-Goals

**Goals:**
- Implement a new dumb presentational Astro component `ServicesSection.astro` that matches the delivered mockup while fully complying with the project design system (flat design, `--radius: 0`, only design-token utilities, Lucide-only icons via `astro-icon`, `astro:assets`-only images).
- Follow the established architectural pattern: types in `lib/types/`, content in `lib/config/`, component in `components/`, tests in `components/__tests__/`, integration only in `pages/index.astro`.
- Preserve the home page heading outline (exactly one `<h1>`, one `<h2>`; the new section contributes one `<h3>` and 4 `<h4>`).
- Make the section fully responsive **mobile-first** (1 column of horizontal/stacked cards on mobile, 2 columns on `md:+`).
- Make the section a drop-in addition after `SolutionSection` — no existing component is modified.
- Make the section fully testable in isolation via `experimental_AstroContainer` (same pattern as `SolutionSection.test.ts`).

**Non-Goals:**
- Build the `/servicios` destination page (the bottom CTA may link to a route that does not exist yet — out of scope for this change; the route is `href="/servicios"` regardless).
- Build per-service detail pages (`/servicios/{slug}`). The `slug` field is part of the contract (reserved for future work) but no per-service route is created by this change.
- Fetch content from a CMS. All copy and image references are hardcoded in `lib/config/services-section.ts` (consistent with `HERO_BANNER_CONTENT`, `PANEL_HOME_CONTENT`, `SOLUTION_SECTION_CONTENT`). The future `contentful-from-cms` change will replace the constant with prop-injected content without touching the component.
- Add new design tokens or modify `globals.css`. The section consumes only tokens already declared in `apps/web/src/styles/globals.css` (and therefore the admin sync test is unaffected).
- Add new icons to the catalog. The only icon used is `lucide:arrow-right`, already present (used by `SolutionSection`, `HeroBanner`).
- Touch the `bg-bg` light background of `SolutionSection`. `ServicesSection` is its own visually distinct dark block.

## Decisions

### Decision 1 — Dumb presentational component (no fetch, no env, no state)
`ServicesSection.astro` receives all content through typed props spread by `apps/web/src/pages/index.astro`. The frontmatter contains only `import`s, the `interface Props extends ServicesSectionProps {}` declaration and the `Astro.props` destructure — no `fetch(`, no `import.meta.env`, no Firestore calls, no reactive state.

**Alternative considered:** Inline the content directly inside the component frontmatter. **Rejected** because it couples the component to marketing copy, makes it untestable in isolation without the real copy, and diverges from the pattern already proven by `HeroBanner`/`PanelHome`/`SolutionSection`.

### Decision 2 — Three-file architecture (types / config / component)
Mirror `solution-section` exactly:

| Layer | File | Owner |
|---|---|---|
| Contract | `src/lib/types/services-section.ts` | Exports `Service`, `ServicesSectionCta`, `ServicesSectionProps` (all `readonly`). |
| Content | `src/lib/config/services-section.ts` | Exports `SERVICES_DATA` (4 services) and `SERVICES_SECTION_CONTENT: Readonly<ServicesSectionProps>`. Imports the 4 images from `@/assets/img/`. |
| Render | `src/components/ServicesSection.astro` | Imports the types and renders `Astro.props`. |

**Rationale:** A typo in copy is a one-file changeet (`config`); a structural change is a one-file changeset (`component`); a contract change is a one-file changeset (`types`). Same separation proven by `solution-section` (see its `design.md` § Decision 10). All fields are `readonly` so the shared config constant is immutable.

### Decision 3 — Two <h3> sections on the home page (SolutionSection and ServicesSection)
The home page already has a single `<h1>` (HeroBanner) and a single `<h2>` (PanelHome), and `SolutionSection` introduced a single `<h3>`. `ServicesSection` is a **sibling** portfolio section, not a subordinate of `SolutionSection`. It therefore also renders its headline as `<h3>` (not `<h4>`), and its card titles as `<h4>`.

After this change, the home page will have **two** `<h3>` elements (one in `SolutionSection`, one in `ServicesSection`). This is valid HTML5 / WAI-ARIA: an `<h3>` may appear multiple times as long as each is the start of a new subsection at the same logical depth.

**Alternative considered:** Render `ServicesSection`'s headline as `<h4>` to keep exactly one `<h3>` per page. **Rejected** because it would make `ServicesSection`'s cards reach `<h5>`, and more importantly the two sections are siblings, not parent/child — making the new section a child of `SolutionSection` would be semantically wrong.

**Alternative considered:** Promote `ServicesSection` to `<h2>` and demote `PanelHome` to `<h3>`. **Rejected** — would break existing tests of `PanelHome` and changes the documented home outline.

### Decision 4 — No eyebrow, no teal underline (centered header only)
The delivered mockup shows a **centered** header with just the headline and the description — no eyebrow above and no teal underline below. `SolutionSection` instead shows a left-aligned eyebrow + headline + teal underline (a different layout language).

`ServicesSection` follows the mockup literally: a centered `<div class="text-center">` containing the `<h3>` (white, `font-heading`) and the `<p>` description (muted, `max-w-2xl mx-auto` for readability).

**Rationale:** The two sections must read as visually distinct so the visitor perceives them as different content blocks, matching the mockup intent. Reusing `SolutionSection`'s eyebrow+underline would make them feel like the same block duplicated.

### Decision 5 — Dark section background: `bg-secondary-dark` (#16202E)
The mockup uses a dark navy background. The closest design-token match is `--color-secondary-dark` (#16202E). The section will use `bg-secondary-dark` on the outer `<section>`.

**Alternatives considered:**
- `bg-secondary` (#1F2D40): too light, the section would not stand out from a dark hero. **Rejected.**
- A new custom token (e.g. `--color-dark-bg`): not needed; `--color-secondary-dark` already exists. **Rejected** — would require syncing `globals.css` on both apps and add no value.
- A vertical gradient `from-secondary-dark to-secondary`: the mockup looks like a flat solid color, and gradients complicate the design-token linter. **Rejected.**

### Decision 6 — Card background `bg-secondary`, border `border-secondary-light`
Each card sits on `bg-secondary` (#1F2D40), slightly lighter than the `bg-secondary-dark` section, so cards visually separate from the section without needing a shadow (flat design — shadows are reserved for floating layers per the style guide). A 1px `border-secondary-light` (#35445E) clearly delimits each card edge.

**Rationale:** Reuses only existing tokens; no new shadow utility on a base component (consistent with the flat-design rule that base components do NOT apply `shadow*` in their static state).

### Decision 7 — Horizontal card layout (image left, content right) with mobile-first fallback
The mockup shows each card as a **horizontal** flex row: image on the left (~40% width), content on the right (~60%). For mobile-first responsive behavior:

- `flex flex-col` by default (mobile): the image stacks on top of the content (full width, square aspect) so the card is legible on a narrow screen.
- `sm:flex-row` at ≥640px: the card becomes the horizontal layout from the mockup (image `w-2/5`, content `flex-1`).

**Alternative considered:** Always horizontal (`flex-row`) even on mobile. **Rejected** — at 320–375px the image would be ~130–150px wide, too small to be useful, and the content would be cramped.

### Decision 8 — Full-color images (POST-APPLY UPDATE: grayscale filter removed)
The mockup showed **black-and-white / grayscale** service imagery, so the first apply shipped the Tailwind `grayscale` utility on the `<Image>` element. **POST-APPLY UPDATE (client request, 2026-08-09):** the service photos SHALL display in their **original full colors** — the `grayscale` utility is NOT applied. The client's actual photo set (`edificios.jpg`, `medidores-de-agua.webp`, `planta-tratamiento.webp`, `osmosis-inversa.jpg`) reads better in color on the dark cards, and this also increases visual distinction between ServicesSection and the light SolutionSection (color photos on dark cards vs. color photos on light cards).

**Rationale:** Removing a single utility class keeps the source assets intact and requires no pipeline change; `astro:assets` still produces optimized WebP/AVIF variants.

**Alternative considered:** Pre-convert images to grayscale with `sharp`/`vips`. **Rejected** — adds build pipeline complexity and a second set of assets; also contradicted by the POST-APPLY client request for full color.

### Decision 9 — Card CTA follows the design system (solid primary button), NOT the mockup's text link
The mockup shows the card CTA as an orange text link ("VER DETALLES"). Per the project standards (`docs/frontend-standards.md`, `docs/design/style-guide/README.md`) and the precedent set by `SolutionSection` (which was migrated from a text link to a solid button in a POST-APPLY UPDATE), the card CTA in `ServicesSection` SHALL be a **solid primary button**, identical in pattern to `SolutionSection`'s "SABER MÁS":

```
inline-flex items-center gap-1 bg-primary hover:bg-primary-dark text-white
font-heading font-semibold uppercase text-xs tracking-wide px-6 py-3
transition-colors
```

**POST-APPLY UPDATE (client request, 2026-08-09):** the card CTA's visible text is **"Ver detalles"** (the mockup's label), carried per-service as `ctaLabel` in the contract, distinct from the bottom CTA label "Ver todos los servicios". Every per-card CTA links to `/servicios`.

**Sub-decision 9a (superseded):** ~Per-card CTA label is the same as the bottom CTA — "Ver todos los servicios" — and every per-card CTA links to `/servicios`.~ This was the original MVP decision; the POST-APPLY client request replaced the per-card label with "Ver detalles" while keeping the bottom CTA label as "Ver todos los servicios". The destination (`/servicios` for all CTAs) is unchanged; per-service detail pages are still future work.

**Alternative considered (original):** Give each card its own CTA label. **Rejected** — the mockup shows a generic "VER DETALLES" but the design system mandates the solid-button pattern. The client subsequently resolved the label question by requesting "Ver detalles" for the cards.

### Decision 10 — Bottom CTA is a larger solid primary button, centered
A single centered CTA below the 4 cards says "Ver todos los servicios" and links to `/servicios`. It uses the same `bg-primary`/`text-white`/`hover:bg-primary-dark` palette but a slightly larger size (`px-8 py-4 text-sm`) than the per-card CTAs (`px-6 py-3 text-xs`) to visually anchor the section's primary action and provide clear hierarchy.

**Alternative considered:** No bottom CTA — let the 4 per-card CTAs carry the navigation. **Rejected** because the client's mockup explicitly includes the bottom CTA, and it gives visitors a clear "see everything" path without picking a specific card.

### Decision 11 — `Service` type does NOT include an `icon` field
Unlike `Solution` (which has `icon: SolutionIconName` for the `bg-primary` badge icon), `Service` has no `icon` field — the mockup does not show a badge icon on each card, and Decision 9 specifies the CTA carries only the `lucide:arrow-right` decorative arrow. Avoiding the `icon` field removes the need for a `ServiceIconName` closed-union type entirely. Adding a per-card Lucide icon later is a single-file addition to `Service` (and a new closed union if needed).

**Alternative considered:** Add `icon?: ServiceIconName` now for future-proofing. **Rejected** — YAGNI; the spec/test step would have to assert "no badge renders" and the optional field adds no value in this MVP.

### Decision 12 — Only `lucide:arrow-right` icon used
Both per-card CTAs and the bottom CTA include the same `lucide:arrow-right` decorative arrow icon already used by `SolutionSection`. The arrow `<svg>` carries `aria-hidden="true"`; the link's accessible name is its visible label. No new icon is added to the catalog (the `icon-catalog.test.ts` constraint is satisfied).

### Decision 13 — Images loaded with `loading="lazy"`
The entire `ServicesSection` sits below the initial fold (after HeroBanner, PanelHome and SolutionSection), so all 4 card images use `loading="lazy"`. The bottom CTA has no image.

### Decision 14 — No negative margin / overlap with the section above
Unlike `PanelHome` (which overlaps the hero via `-mt-*`), `ServicesSection` is a flat block with `py-16 md:py-24` vertical padding on a `bg-secondary-dark` background. There is a hard color transition between `SolutionSection`'s light `bg-bg` and the new dark section, which is intentional and matches the mockup.

### Decision 15 — Page integration: append after `<SolutionSection />`
`apps/web/src/pages/index.astro` will render, in order: `<HeroBanner>`, `<PanelHome>`, `<SolutionSection>`, `<ServicesSection>`. No reordering of existing components. The new import is added at the bottom of the frontmatter import block, and the new component is added at the bottom of the `<Layout>` slot.

### Decision 16 — Image formats (JPEG + WebP) both supported
Two of the 4 service images are JPEG (`edificios.jpg`, `osmosis-inversa.jpg`) and two are WebP (`medidores-de-agua.webp`, `planta-tratamiento.webp`). `astro:assets` with `sharp` accepts both as `ImageMetadata` imports and produces optimized WebP/AVIF variants at build time. No special handling is required; the imports in `lib/config/services-section.ts` are identical in shape to `solution-section.ts`.

## Risks / Trade-offs

- **Two `<h3>` on the home page** → Mitigated by Decision 3 (sibling sections are valid HTML5; the heading outline test asserts per-component counts in isolation, not document-wide). If a stricter "exactly one `<h3>` per page" rule is later desired, the page-level test — not the component test — should enforce it.
- **Full-color photos on dark cards may reduce text separation** → The teal `h4` (#41B3C4) on `bg-secondary` (#1F2D40) still passes WCAG AA (4.6:1, verified in e2e); the color photos sit in their own `w-2/5` column with `overflow-hidden`, so no contrast regression. Mitigated by e2e contrast test.
- **Two of the source images are JPEG (larger than WebP)** → `astro:assets`/`sharp` re-encodes them to WebP/AVIF at build time; the final payload is WebP-class. No mitigation needed.
- **`/servicios` does not exist yet** → The bottom CTA and the 4 per-card CTAs link to a 404 until the future `servicios-page` change ships. This is an accepted trade-off — the section ships the visual contract now; the destination page is tracked separately. No mock navigation workaround is built into the component.
- **Per-card CTAs ("Ver detalles") share the destination with the bottom CTA ("Ver todos los servicios")** → POST-APPLY UPDATE: labels are now distinct (per-card "Ver detalles" vs. bottom "Ver todos los servicios"), addressing the original "5 identical links" concern; the destination remains `/servicios` for all. Per-service detail routes will differentiate hrefs in a future change.

## Migration Plan

This is a purely additive frontend change; there is no database migration, no API change, no environment variable change.

**Deployment:**
1. Merge the change to `main`.
2. Coolify detects the change and rebuilds the Astro static site (`apps/web`).
3. The new `/` HTML includes the `ServicesSection` block; the static assets for the 4 full-color images are produced by `astro:assets` during build (POST-APPLY UPDATE: no grayscale filter; images ship in original colors).
4. The `/servicios` link returns 404 until the future `servicios-page` change is shipped — the team is aware.

**Rollback:**
- Coolify redeploy of the previous image (1-click via UI/CLI) reverts the home page to the 3-section version. No data lost; no schema to revert.

**Open Questions:**
- None material. The four content texts, the four images and the CTA labels ("Ver detalles" per card, "Ver todos los servicios" bottom) are confirmed by the client.
