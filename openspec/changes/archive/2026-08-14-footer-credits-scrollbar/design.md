## Context

This change touches only the public-site chrome rendered by `apps/web/src/layouts/Layout.astro` on every page. The current state of the affected areas:

- **`Footer.astro`** is a dumb presentational component with a typed `SiteFooterProps` contract. Its four columns are: brand (logo + tagline + social), SERVICIOS, EMPRESA, and the schedule column. Two issues stand in the way of the requested edits:
  1. The schedule column **title is hardcoded** inside `Footer.astro` (line 122) as the literal `"HORARIO TÉCNICO"`. The other two column titles (`SERVICIOS`, `EMPRESA`) come from `SITE_FOOTER_CONTENT.columns[].title`. This asymmetry breaks the "single source of truth" contract and forces a component edit for any title change.
  2. `FooterScheduleEntry.hours` is a single `string`, so a day range can only show one hour block. The client's real schedule has split shifts (morning + afternoon) that no longer fit.
- **`Layout.astro`** renders `<Footer {...SITE_FOOTER_CONTENT} />` at line 103. There is no attribution element below the footer today.
- **`apps/web/src/styles/globals.css`** declares every design token in `@theme {}` and the base `html` / `body` rules in `@layer base`. The site currently uses the user-agent default scrollbar, which is unbranded. The brand navy `#16202E` is already declared as `--color-secondary-dark`, so the requested scrollbar color is achievable without introducing any literal hex.

Constraints:

- Frontend standards forbid raw hex literals outside `@theme` definitions. The requested `#16202E` must be consumed as `var(--color-secondary-dark)`.
- Flat-design strict: radius is `0`, no `rounded*`, no `shadow*` in static chrome.
- All new components must be dumb presentational components with `readonly` props contracts and a separate config constant — the established pattern for every chrome component (`TopHeader`, `Header`, `SearchForm`, `Footer`).
- The footer already has a robust Vitest suite (structural, brand, columns, schedule, bottom bar, flat-design, snapshot). Every requirement change here will break existing expectations; the test update is part of the work, not an afterthought.
- The admin app (`apps/admin`) has a `sync.test.ts` asserting `@theme` parity. Scrollbar rules live in `@layer base` and do NOT participate in `@theme`, so the admin is unaffected.

## Goals / Non-Goals

**Goals:**

- Promote the schedule column title to the typed `SiteFooterProps`/`SITE_FOOTER_CONTENT` config so the component has zero hardcoded copy.
- Let a single day range list multiple hour blocks (split-shift schedule) by widening `FooterScheduleEntry.hours` to `readonly string[]` and rendering N `<dd>` per `<dt>`.
- Replace the `SERVICIOS` placeholder links with the real service offering while keeping `href="#"` (routes remain a future change).
- Add a new dumb `SiteCredits.astro` rendered immediately below `<Footer/>` in `Layout.astro`, attributing the developer with a never-underlined external link animated on hover through design-system tokens only.
- Tint the site scrollbar thumb (and only the thumb) with `--color-secondary-dark` and its hover with `--color-secondary-light`, cross-browser (standard `scrollbar-color` + `::-webkit-scrollbar*`), keeping a transparent track and `border-radius: 0`.
- Every change remains a pure SSG content/chrome edit — no API, no data model, no backend, no Firestore, no new runtime dependencies.

**Non-Goals:**

- No real navigation routes for `SERVICIOS`/`EMPRESA` columns. They keep `href="#"` (deferred to a future change, design.md § Decision 5).
- No removal of the `scheduleNote` ("Soporte 24/7 disponible") — the client did not ask to drop it; it continues to render below the new schedule rows.
- No scrollbar styling in the admin app. The admin is untouched.
- No rebrand of the footer itself: the schedule column keeps the same visual treatment as the other columns (only the title and the `<dl>` shape change).
- No animation libraries. The credits link hover is a Tailwind `transition-colors` only.

## Decisions

### Decision 1 — Consume `#16202E` exclusively as `var(--color-secondary-dark)`

The client asked for scrollbar color `#16202E`. That value already exists as the `--color-secondary-dark` design token, declared in `@theme` of `apps/web/src/styles/globals.css`. Frontend standards (§ "Queda prohibido usar literales hex (`#XXXXXX`) en componentes, páginas o configs") make raw hex literals outside `@theme` a linter regression. Therefore every scrollbar color declaration (thumb, thumb:hover) SHALL use the token form. No new tokens are introduced.

**Alternatives considered:**
- Inline the hex `#16202E` directly in the scrollbar rules. Rejected: violates the no-raw-hex rule and would also need the `#35455E` hover as a second literal, doubling the violation.
- Add a new dedicated token `--color-scrollbar`. Rejected: it would duplicate `--color-secondary-dark`'s value with no semantic gain and would force an admin `sync.test.ts` update to keep `@theme` parity.

### Decision 2 — Promote the schedule column title to a typed prop

`Footer.astro` hardcodes `"HORARIO TÉCNICO"` while `SERVICIOS`/`EMPRESA` come from config. To restore symmetry (single source of truth for every column title) and to support the requested rename to "Horario de Atención", a new `scheduleTitle: string` field is added to `SiteFooterProps` and `SITE_FOOTER_CONTENT.scheduleTitle = 'Horario de Atención'`. The component renders `{scheduleTitle}` with the existing `uppercase` class, so the visible text becomes "HORARIO DE ATENCIÓN" — consistent with "SERVICIOS" and "EMPRESA". The hardcoded literal disappears from the component source.

**Alternatives considered:**
- Edit the literal in `Footer.astro` from `"HORARIO TÉCNICO"` to `"Horario de Atención"`. Rejected: leaves the title as a component-owned string, perpetuating the asymmetry and forcing another component edit for the next copy change.
- Add `scheduleTitle` only to `SiteFooterProps` but keep the value hardcoded in the component. Rejected: a prop with a permanent hardcoded value is dead weight and breaks the "component has no hardcoded copy" rule.

### Decision 3 — `FooterScheduleEntry.hours` becomes `readonly string[]`

The client's schedule has two hour blocks per day range:
- Lunes a Jueves: `9:00 a 13:00 hrs.` and `14:00 a 18:00 hrs.`
- Viernes: `9:00 a 13:00 hrs.` and `14:00 a 17:00 hrs.`

Modeling options:
- **(Chosen)** `hours: readonly string[]` — one `<dt>` per day range, followed by N `<dd>` blocks. HTML `<dl>` semantics explicitly allow multiple `<dd>` per `<dt>`, so the markup stays valid. Minimal type widening; the config simply lists the blocks per day. The component's `<dl>` loop becomes an inner `entry.hours.map(...)`.
- Concatenate the blocks into a single `string` with a separator like `" y "` or `"<br/>"`. Rejected: it would require either an unsafe `set:html` (a flat-design + dumb-component red flag) or visually awkward line wrapping; it also hides the structured nature of the data and prevents per-block styling.
- Split each block into its own `FooterScheduleEntry` (six rows of `<dt>/<dd>`). Rejected: it would duplicate the day-range label ("Lunes a Jueves" twice, "Viernes" twice), which is both visually redundant and semantically weaker than one `<dt>` with multiple `<dd>`.

The component layout for the schedule `<dl>` will continue to put the day range on the left (white, semibold) and the hour blocks on the right (muted); the inner map simply stacks the `<dd>` blocks vertically in that right column. The exact Tailwind layout (flex column for the `<dd>` group, gap between blocks) will be settled during implementation but always within tokens.

### Decision 4 — `SiteCredits` is a separate dumb component, not a footer extension

The client wants a *thin full-width strip **below** the footer*. Adding it inside `Footer.astro` would mix two responsibilities (the site footer chrome vs. developer attribution) and would break the footer's existing structural contract ("outermost element is `<footer>`" — both the test asserting `<footer>` is first and the snapshot). It would also force every footer test to be rewritten to ignore or accommodate the credits.

Instead, a new dumb component `SiteCredits.astro` is rendered in `Layout.astro` directly after `<Footer/>`. It has its own typed props contract (`SiteCreditsProps`), its own config constant (`SITE_CREDITS_CONTENT`), and its own test suite. The footer component, its tests, and its snapshot remain targeted to the footer concerns only; the credits strip is independently testable and replaceable.

**Alternatives considered:**
- Inline the credits markup directly inside `Layout.astro`. Rejected: layout files should orchestrate, not render chrome; embedding markup in the layout also makes the credits hard to unit-test and duplicates the "config + dumb component" pattern inconsistently.
- Add a second section inside `Footer.astro`. Rejected: see above — mixes responsibility and breaks the footer's structural tests.

### Decision 5 — Credits link hover uses `text-primary` → `text-primary-light` with `transition-colors`

The client requested "animate ligeramente en hover" (a subtle hover animation) using the design system. The most on-brand, low-cost animation is a color shift between existing teal tokens: `text-primary` (`#41B3C4`) at rest → `text-primary-light` (`#D2EEF2`) on hover, via Tailwind `transition-colors duration-200`. This is a minimal, tasteful feedback signal that stays inside the design-system vocabulary and respects `prefers-reduced-motion` (a color transition is non-motion and not disturbing, but can still be disabled via `motion-safe`/`motion-reduce` variants if desired).

The link is never underlined: the anchor's class list carries `no-underline` and no `hover:underline`. The anchor carries `target="_blank"` + `rel="noopener noreferrer"` (security parity with the footer's social links) and an `aria-label` announcing the external navigation, e.g. `"Gabriel Zavando — sitio web externo (abre en nueva pestaña)"`.

The strip background uses `bg-secondary` (`#1F2D40`), one step above the footer's `bg-secondary-dark` (`#16202E`), so the two chrome areas visually separate without introducing a new color. The label text uses `text-muted`, and the strip itself has a thin vertical padding (`py-2`).

**Alternatives considered:**
- `bg-secondary-dark` for the strip too. Rejected: the strip would merge visually with the footer, defeating the "below the footer" intent.
- A literal `#XXXXXX` for the hover color. Rejected: violates the no-raw-hex rule; `text-primary-light` is already the right token.
- An opacity or transform animation. Rejected: more visually noisy than a color change and riskier for reduced-motion users; the client asked for "slightly", and color is the lightest option.
- Opening in the same tab (no `target="_blank"`). Rejected: it would navigate the user away from the site; the explicit ask is an external attribution link.

### Decision 6 — Scrollbar uses both standard `scrollbar-color` and `::-webkit-scrollbar*`

Cross-browser parity:
- Firefox supports the standard `scrollbar-color: <thumb> <track>` property on the scroller element.
- Chromium and Safari ignore `scrollbar-color` for the legacy appearance and instead honor the `::-webkit-scrollbar`, `::-webkit-scrollbar-track` and `::-webkit-scrollbar-thumb` pseudo-elements.

Both are declared to avoid the user-agent default reappearing on any major browser. Only the thumb and thumb:hover carry the brand color; the track stays `transparent`, so the scrollbar reads as a discrete brand accent rather than a full dark bar. The thumb declares `border-radius: 0` to honor the project's radius-0 flat-design rule, and `::-webkit-scrollbar` declares a bounded `width`/`height` of `12px` (within the spec's `8–16px` band) — small enough not to dominate, large enough to grab. The rules live in `@layer base` of `apps/web/src/styles/globals.css`, next to the existing `html` / `body` rules.

**Alternatives considered:**
- Use only `::-webkit-scrollbar*`. Rejected: Firefox would fall back to the default grey scrollbar, leaving the site half-branded on Firefox.
- Use only `scrollbar-color`. Rejected: Chromium/Safari's support is uneven; the pseudo-elements are still the reliable cross-browser-coverage tool.
- Tint the track too. Rejected by the user (decision recorded in the plan): they want only the thumb + thumb:hover colored.
- Scope the rules to `body` instead of `html`. Rejected: the document scroller is typically the `html` element; scoping to `body` can miss the viewport scrollbar in some layouts.

### Decision 7 — TDD sequence preserves existing tests, then updates them

The footer has many existing tests pinning the current schedule shape (single-string hours, two-`<dd>` schedule count, the `HORARIO TÉCNICO` literal, the old SERVICIOS labels). The TDD cycle for each task will:

1. Update the test (config test, type test, or component test) to express the NEW expected behavior first — the test fails (`red`).
2. Implement the minimum change to pass (`green`).
3. Refactor if needed.
4. Update the snapshot once at the end — `pnpm vitest -u` on the affected snapshot file — rather than mid-cycle, so the snapshot truly reflects the final intended markup.

The scrollbar and credits areas are net-new, so their tests are pure additions (`red` first).

## Risks / Trade-offs

- **Scrollbar visibility on dark sections.** The thumb is `--color-secondary-dark` (`#16202E`), a dark navy. Against the dark navy footer (`bg-secondary-dark`) the thumb will momentarily blend with the footer as it scrolls past it. *Mitigation:* the thumb:hover lifts to `--color-secondary-light`, and the transparent track keeps the rest of the page (light `--color-bg`) as the dominant backdrop. The risk is acceptable for a public catalog site and matches the user's explicit choice of color.
- **`FooterScheduleEntry.hours` widening is a breaking type change.** Any consumer that built a `FooterScheduleEntry` with `hours: 'string'` will fail to typecheck. *Mitigation:* the only consumer is `SITE_FOOTER_CONTENT` and the test mocks; both are updated in the same change. There is no external API surface (SSG content).
- **Snapshot churn.** Updating the footer schedule shape and title will invalidate the stored snapshot in `Footer.test.ts.snap`. *Mitigation:* the snapshot is updated last, with `pnpm vitest -u`, after the structural tests already encode the new expectations declaratively; the snapshot remains a regression guard, not the primary assertion.
- **Cross-browser scrollbar divergence.** `scrollbar-color` and `::-webkit-scrollbar*` are not pixel-identical (Firefox's `scrollbar-color` cannot set a thumb radius or a thumb:hover color). *Mitigation:* the spec only sets the thumb color and a transparent track; both are expressible in both syntaxes. The `::-webkit-scrollbar-thumb:hover` lift to `--color-secondary-light` is a progressive enhancement (Firefox users get a solid thumb without a hover lift, still on-brand).
- **Reduced motion.** A color transition is not a motion and is generally safe under `prefers-reduced-motion`. *Mitigation:* the implementation will scope the credits hover transition under `motion-safe` if the project's reduced-motion tests demand it (it currently only asserts transitions on the `header-scroll` styles; the credits transition is shorter than 200ms and color-only).

## Migration Plan

This is a pure chrome/SSG change with no migration surface:

1. Merge the change; the CI runs Vitest, lint, typecheck and the (updated) snapshot.
2. The next site build emits pages with the new footer copy, the new credits strip, and the tinted scrollbar.
3. Rollback, if ever needed, is a single `git revert` — no database, no API version, no env var, no infrastructure change.

## Open Questions

None outstanding. The four design decisions that needed user input were resolved before the plan (schedule title handling, hours structure, credits component placement, scrollbar scope) and are encoded as decisions above.
