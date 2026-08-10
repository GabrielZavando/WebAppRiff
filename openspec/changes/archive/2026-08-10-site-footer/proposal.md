# Proposal — Site Footer

## Why

The public site currently ends abruptly after the last section (`NosotrosTeamSection`) because `Layout.astro` closes the document right after the `<slot />`. The client provided a new design (`docs/design/components/Footer.png`) showing the site footer with brand identity, service/company navigation, technical schedule and a copyright bar. Footers are a trust signal and the natural closing of every page; the mockup also establishes the dark navy `bg-secondary-dark` footer language for the whole site. Because the footer is shared chrome (not a section of the home page), it belongs in `Layout.astro` so every route (`/`, `/nosotros`, `/servicios`, `/contacto`, `/cotizacion`, `/productos/*`) gets it without per-page wiring.

## What Changes

- New dumb presentational Astro component `Footer.astro` for the public site (`apps/web`), rendered inside `Layout.astro` immediately after the `<slot />` (present on every page).
- New typed props contract in `apps/web/src/lib/types/footer.ts`: `FooterLink`, `FooterColumn`, `FooterScheduleEntry`, `FooterColumnSection` and `SiteFooterProps` — all fields `readonly`, no `any`; social links reuse the existing `SocialLink` type from `@/lib/types/top-header` (same Lucide icon map as `TopHeader`).
- New hardcoded content constant `SITE_FOOTER_CONTENT` in `apps/web/src/lib/config/footer.ts` following the `Footer.png` mockup: brand tagline ("Innovación tecnológica en la gestión de fluidos desde 1979."), two link columns (SERVICIOS ×4, EMPRESA ×4 — placeholder `href="#"` per client decision), technical schedule (Lun–Jue 09:00–18:00, Vie 09:00–17:00) with 24/7 support note, copyright line ("© 2024 RIFF SPA. TODOS LOS DERECHOS RESERVADOS.") and location ("SANTIAGO, CHILE").
- The footer brand block reuses the existing header logo image (`@/assets/img/logo-web.webp`) via `astro:assets` `<Image>` (client decision: image, not the "RIFF SPA" text of the mockup).
- Full-bleed dark layout: `<footer class="bg-secondary-dark">` spans the full viewport width; content lives in the canonical `container` utility. Main zone = responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`): brand column + SERVICIOS + EMPRESA + HORARIO TÉCNICO. Bottom zone separated by a 1px `border-t border-white/10` divider: copyright left, location + scroll-to-top square teal button (`bg-primary`, `lucide:arrow-up`) right.
- Scroll-to-top interaction: inline client script (`<script is:inline>`, same pattern as `Header.astro`) with `data-scroll-top` buttons calling `window.scrollTo({ top: 0, behavior: 'smooth' })`; the button stays a `<button>` (not an anchor) since it performs a page action, not navigation.
- Unit tests (Vitest + `experimental_AstroContainer`) for types, config content and component rendering (structure, brand block, columns/links, schedule, copyright bar, scroll-to-top button, flat-design token usage, dumb-component contract) plus a snapshot; test helpers in `apps/web/src/components/__tests__/helpers/footer-test-utils.ts`.
- The home page (`pages/index.astro`) is NOT modified — the footer renders globally via the layout.

## Capabilities

### New Capabilities
- `site-footer`: Global footer of the public site rendered by `Layout.astro` on every page — dark navy full-bleed shell (`bg-secondary-dark`), brand column (logo image + tagline + social icons shared with `TopHeader`), two link columns (SERVICIOS, EMPRESA) with placeholder `href="#"`, technical schedule column with 24/7 support note, and a copyright bar with location and a scroll-to-top teal button; strictly flat design (no `rounded*`, no `shadow*`).

### Modified Capabilities
<!-- None: the footer is brand-new shared chrome; no existing spec-level behavior changes (Header, TopHeader, SearchForm are untouched). -->

## Impact

- **Code (frontend — Astro SSG, `apps/web`)**:
  - New files: `src/lib/types/footer.ts`, `src/lib/config/footer.ts`, `src/components/Footer.astro`, `src/lib/config/__tests__/footer.test.ts`, `src/components/__tests__/Footer.test.ts`, `src/components/__tests__/helpers/footer-test-utils.ts`.
  - Modified file: `src/layouts/Layout.astro` (imports `Footer` + `SITE_FOOTER_CONTENT`/`getFooterProps` and renders `<Footer />` after the `<slot />`).
- **Assets**: Reuses `apps/web/src/assets/img/logo-web.webp` (already consumed by `Header.astro`). No new assets.
- **API**: None — content is hardcoded SSG config; social URLs come from the same env-driven `getContactInfo()` already used by `TopHeader` (`PRIMARY_PHONE`, `SOCIAL_*_URL`). No `docs/api-spec.yml` changes.
- **Data model**: None — no Firestore entities involved.
- **Dependencies**: None new (`astro:assets` `<Image>`, `astro-icon` + `@iconify-json/lucide` already wired; Lucide icons used are already in the icon catalog: `facebook`, `twitter`, `instagram`, `linkedin`, `arrow-up`, `clock`).
- **Design tokens**: `bg-secondary-dark`, `text-white`, `text-primary`, `text-muted`, `text-white/80`, `border-white/10`, `font-heading`, `font-body`; strict flat design (no `rounded*`, no `shadow*` in static state).
- **Accessibility**: The footer is `<footer>` (landmark); column headings are `<h3>`/`<p>` labels (NOT `<h2>` — global chrome must not compete with the page heading outline; the layout's per-page `<h1>`/`<h2>` hierarchy is preserved); social links carry `aria-label` + `target="_blank"` + `rel="noopener noreferrer"`; the scroll-to-top button has `aria-label="Volver arriba"`; decorative icons are `aria-hidden="true"`.
- **Tests**: New Vitest suite (`Footer.test.ts` + config tests). The flat-design linter test (`no-brand-classes.test.ts`) and the icon-catalog test continue to pass because the component only uses catalog icons and design-system utilities.
- **Build output**: Adds global footer markup to every statically generated page.