## Context

The public site (`apps/web`, Astro 7.1.6 SSG, Tailwind v4, `astro-icon` with the Lucide set) renders its chrome — `TopHeader`, `Header`, `SearchForm` — in `apps/web/src/layouts/Layout.astro`. The document currently closes right after the `<slot />`, so every page ends without a footer. The client delivered `docs/design/components/Footer.png` (2026-08-10) showing: a dark navy full-bleed footer, a 4-column main zone (brand + SERVICIOS + EMPRESA + HORARIO TÉCNICO), a divider, and a bottom bar with copyright, "SANTIAGO, CHILE" and a square teal scroll-to-top button.

Established project conventions that constrain this design:

- **Dumb presentational components**: every section (`HeroBanner`, `ServicesSection`, `NosotrosTeamSection`, …) is a component that only renders props; content lives in `lib/config/*.ts` constants; types live in `lib/types/*.ts` (all `readonly`, no `any`). See `apps/web/src/lib/config/nosotros-team-section.ts` and `apps/web/src/components/__tests__/helpers/*-test-utils.ts`.
- **Single design-token vocabulary**: only Tailwind v4 utilities generated from `@theme {}` in `apps/web/src/styles/globals.css`; no hex literals, no `brand-*`, no `rounded*` (radius 0, flat design), `shadow*` reserved for floating layers only.
- **Shared contact/social config**: `apps/web/src/lib/config/contact.ts` reads `PRIMARY_PHONE` + `SOCIAL_*_URL` env vars into `ContactInfo`; `apps/web/src/lib/types/top-header.ts` provides `SocialLink` + `getSocialLinks()` filtering empty URLs, and `TopHeader.astro` maps `SocialNetworkName` → Lucide icon. The footer reuses this exact machinery so social icons stay consistent site-wide.
- **Existing tests**: `apps/web/src/components/__tests__/no-brand-classes.test.ts` scans every `.astro` in `components/` and `pages/` for `brand-*` classes; `Layout.astro` has its own Vitest suite that must keep passing.

## Goals / Non-Goals

**Goals:**

- Render a footer matching `Footer.png` on **every** page via `Layout.astro` (client decision, "todas las páginas").
- Keep the component dumb: content comes from `SITE_FOOTER_CONTENT` in `lib/config/footer.ts`, typed by `SiteFooterProps`.
- Reuse the header logo image (`logo-web.webp`) for the brand block (client decision, image over "RIFF SPA" text).
- Reuse the existing `SocialLink` type + Lucide icon map from `TopHeader` for the social icons (client decision).
- Respect strict flat design: no `rounded*`, no `shadow*`; only design-system tokens.
- Full test coverage: types, config, component tests + snapshot; keep `no-brand-classes.test.ts` and layout tests green.

**Non-Goals:**

- No real link destinations: SERVICIOS/EMPRESA columns use placeholder `href="#"` (client decision). Wiring real routes is a future change.
- No dynamic data fetching: the footer is pure SSG; social URLs come from env vars at build time via `getContactInfo()`.
- No changes to `Header`, `TopHeader`, `SearchForm`, or the page heading outline.
- No new assets, no new dependencies, no API/data-model changes.

## Decisions

### D1 — Placement: `Layout.astro` after `<slot />` (global chrome)

The footer is shared chrome, not a home-only section. Rendering it in `Layout.astro` after the `<slot />` gives every route the closing landmark with zero per-page wiring, mirroring how `TopHeader`/`Header`/`SearchForm` are already declared there.

- Alternative considered: render from `pages/index.astro` only — rejected (footer is a trust/global element; mockup is part of the site shell).

### D2 — Footer is a `<footer>` landmark with heading-level discipline

Outermost element is `<footer>`; column headings are NOT `<h2>` to preserve the per-page heading outline (each page owns exactly one `<h1>`; sections own `<h2>`/`<h3>`). Column titles are `<p>` labels powered by `font-heading` + `text-primary` + `uppercase` (the mockup shows labels, not structured headings).

- Alternative considered: `<h2>`/`<h3>` column titles — rejected (would break the heading outline on every page and confuse assistive tech).

### D3 — Brand block: reuse header logo image, not mockup text

`Footer.png` shows "RIFF SPA" as text, but the client chose the header logo image (`logo-web.webp`) for consistency of brand identity across chrome. Rendered via `astro:assets` `<Image>` with `alt` from props (fallback "Riff") and `loading="lazy"` (footer is below the fold on every page).

- Alternative considered: typographic "RIFF SPA" Montserrat bold — rejected by client decision; also duplicates branding that the logo asset already owns.

### D4 — Social icons: shared `SocialLink` + TopHeader icon map

The footer consumes the same `SocialLink[]` / `getSocialLinks()` from `@/lib/types/top-header.ts` and the same `SocialNetworkName → lucide:*` map (`facebook`, `twitter`, `instagram`, `linkedin`) that `TopHeader.astro` uses. Icons render only for configured URLs (empty URLs filtered), placed in the brand column under the tagline. Single source of truth for social presence; the icon-catalog test stays green.

- Alternative considered: a new `FooterSocial` type duplicating `SocialLink` — rejected (ISP: reuse the narrower existing contract).

### D5 — Link columns: placeholder `href="#"` (client decision)

SERVICIOS (4 items) and EMPRESA (4 items) render as `<a href="#">` — clickable, keyboard-focusable placeholders that a future navigation change will point at real routes.

- Alternative considered: real routes — rejected (page set is not finalized; client chose `#`).
- Alternative considered: plain `<span>`s — rejected (client chose clickable links and the mockup implies link affordance).

### D6 — Scroll-to-top: `<button data-scroll-top>` + inline client script

The bottom bar has a square `bg-primary` button with `lucide:arrow-up`. It performs a page action (scroll), not navigation, so it is a `<button type="button">` (`aria-label="Volver arriba"`), wired by an `<script is:inline>` in the component file (same pattern as `Header.astro`'s mobile menu toggle): `window.scrollTo({ top: 0, behavior: 'smooth' })`.

- Alternative considered: `<a href="#">` — rejected (`#` jumps without smooth control and pollutes URL; a button is semantically correct for a page action).
- Reduced motion: `behavior: 'smooth'` is a progressive enhancement; browsers honoring `prefers-reduced-motion` perform an instant jump. No extra CSS needed.

### D7 — Full-bleed dark shell + canonical container (client decision)

`<footer class="bg-secondary-dark">` spans full viewport width; the main zone content sits in `<div class="container">` (the canonical `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` utility), with `py-16` / `md:py-24` vertical rhythm consistent with `ServicesSection`/`NosotrosTeamSection`.

- Alternative considered: everything inside a constrained box (not full-bleed) — rejected by client decision; full-bleed dark chromium matches `Header`'s gradient shell pattern.

### D8 — Responsive columns: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`

Mobile-first: 1 column stacking brand, SERVICIOS, EMPRESA, HORARIO TÉCNICO; `md` splits 2×2; `lg` goes full 4 columns per the mockup. Gap `gap-10` (matches the wide mockup gutters) and `lg:gap-8` fine-tuning if needed — the spec asserts `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` + a gap utility.

### D9 — Column link styling for dark background

Links are `text-white/80 hover:text-white transition-colors` with a `flex items-center gap-2` layout and a small `lucide:arrow-right` chevron only on hover (`opacity-0 group-hover:opacity-100`) to keep the mockup's quiet look while giving affordance. Decorative icons are `aria-hidden="true"`.

- Alternative considered: links with always-visible chevrons — rejected (mockup shows plain text links).

### D10 — Schedule column: definition-list markup

HORARIO TÉCNICO renders each entry as a `flex justify-between` row: day range label (`text-white` semibold) + hours (`text-muted`). The 24/7 support note renders as a `lucide:clock` icon + `text-primary` text. Semantic: `<dl>` with `<dt>`/`<dd>` pairs for the schedule rows.

- Alternative considered: plain `<p>` rows — rejected (`<dl>` gives assistive tech the label/value pairing for free).

### D11 — Test strategy

Follows the established per-section pattern:

- `lib/types/__tests__/footer.test.ts` — type-level contract assertions (readonly, union members).
- `lib/config/__tests__/footer.test.ts` — content shape: tagline, 2 columns, 4 links each, 2 schedule entries, copyright/location strings, all links `href="#"`.
- `components/__tests__/Footer.test.ts` + `helpers/footer-test-utils.ts` — `AstroContainer` renders; helpers extract `footer` tag, link columns, schedule rows, social icons, scroll button.
- Snapshot test for the stable, purely visual footer markup (consistent with other sections).
- The existing `no-brand-classes.test.ts` and icon-catalog tests cover regression for tokens/icons automatically.

## Risks / Trade-offs

- [Placeholder `href="#"` anchors may be shipped to production like that] → Mitigation: the spec explicitly marks them as placeholders; config keeps every href in one file (`lib/config/footer.ts`) so wiring real routes later is a one-file change.
- [Global footer affects every page; a careless heading could break the outline] → Mitigation: column titles are `<p>`, asserted by tests (no `h2`/`h3` in footer output).
- [Social icon map duplicated between `TopHeader` and `Footer`] → Mitigation: both consume the same `SocialLink`/`getSocialLinks()` and the same 4-entry map constant; a future change can hoist the map to shared config.
- [`<Image>` with `logo-web.webp` adds a second asset variant of the logo (header + footer)] → Mitigation: same imported asset, `astro:assets` dedupes the optimized output; negligible build cost.
- [Inline script conflicts with Astro's script bundling rules] → Mitigation: `is:inline` pattern already proven in `Header.astro`.