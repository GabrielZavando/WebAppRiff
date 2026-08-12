## 1. Update Navigation Config

- [x] 1.1 Update `NAVIGATION_ITEMS` in `apps/web/src/lib/config/navigation.ts`: replace Nosotros→Productos (`/productos`), Representaciones→Marcas (`/marcas`)
- [x] 1.2 Update `navigation.test.ts` expectations: labels and hrefs for the 5 items
- [x] 1.3 Run navigation tests → green

## 2. Write Failing Unit Tests (TDD: red)

- [x] 2.1 Update `Header.test.ts` — Scenario: items in order (Inicio, Productos, Servicios, Marcas, Contacto)
- [x] 2.2 Update `Header.test.ts` — Scenario: active underline is 3px (`after:h-[3px]`) with `after:bg-primary`
- [x] 2.3 Update `Header.test.ts` — Scenario: CTA is inside `<nav>` as last item, retains `bg-accent`
- [x] 2.4 Update `Header.test.ts` — Scenario: nav is right-aligned (`ml-auto` or equivalent)
- [x] 2.5 Update `Header.test.ts` — Scenario: logo `<img>` has `width="330"` and `height="134"`
- [x] 2.6 Update `Header.test.ts` — Scenario: mobile overlay is `fixed inset-0 bg-white` with `data-menu-open`
- [x] 2.7 Update `Header.test.ts` — Scenario: toggle button is `fixed` with `z-50` (always visible)
- [x] 2.8 Delete snapshot so it regenerates fresh (no stale assertions)
- [x] 2.9 Run `vitest run` → confirm new tests FAIL (red phase)

## 3. Implement Header.astro (TDD: green)

- [x] 3.1 Update `Header.astro` frontmatter: add `transparent` prop handling (unchanged), keep type imports
- [x] 3.2 Update `<header>`: add `data-menu-open="false"` attribute
- [x] 3.3 Update logo `<a>`: add `h-24 overflow-visible`, change `<Image>` to `width={330}` `height={134}` `class="w-[330px]"`
- [x] 3.4 Move CTA inside `<nav>`: remove `hidden sm:inline-flex`, keep `bg-accent` styling, position as last nav item
- [x] 3.5 Desktop nav: add `ml-auto` for right-alignment
- [x] 3.6 Active underline: change `after:h-0.5` → `after:h-[3px]` (desktop + mobile items)
- [x] 3.7 Mobile overlay: replace `<div id="mobile-nav" hidden>` with `fixed inset-0 bg-white z-40` + `data-menu-open` driven CSS
- [x] 3.8 Mobile nav items: add active state with 3px underline, white background text colors
- [x] 3.9 Toggle button: make `fixed top-6 right-6 z-50`, keep `data-menu-toggle`/`aria-controls`/`aria-expanded`/`aria-label`
- [x] 3.10 Add `<style is:inline>`: CSS for `[data-menu-open]` panel transform + button color adaptation
- [x] 3.11 Update `<script is:inline>`: toggle `data-menu-open` on `<header>`, body scroll lock, toggle ARIA
- [x] 3.12 Run unit tests → all green
- [x] 3.13 Run Typecheck (`astro check && tsc --noEmit`) → no errors

## 4. E2E Tests (Playwright)

- [x] 4.1 Update `site-header.spec.ts` — NAV_ITEMS to [Inicio, Productos, Servicios, Marcas, Contacto]
- [x] 4.2 Update desktop test — CTA is inside nav (last item), right-aligned
- [x] 4.3 Update logo test — `width="330"` and `height="134"`
- [x] 4.4 Update mobile test — fullscreen overlay opens with slide animation, X button visible, CTA in mobile nav
- [x] 4.5 Run Playwright E2E tests → pass

## 5. Snapshot & Regression

- [x] 5.1 Regenerate `Header.test.ts.snap` (delete and re-run)
- [x] 5.2 Verify snapshot does not contain `brand-orange`, `brand-navy`, or `h-0.5` for underline
- [x] 5.3 Run `no-brand-classes.test.ts` → green

## 6. Build Verification

- [x] 6.1 `npm run build` → success
- [x] 6.2 `npm run lint` → no errors
- [x] 6.3 `npm run test` → all pass (516 unit tests)

## 7. Update Canonical Spec

- [x] 7.1 Merge delta spec into `openspec/specs/site-header/spec.md` (post-implementation verification)
- [x] 7.2 Run `openspec validate` → valid
