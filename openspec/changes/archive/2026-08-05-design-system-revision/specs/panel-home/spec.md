# panel-home Specification — delta for design-system-revision

## MODIFIED Requirements

### Requirement: PanelHome renders the left half with eyebrow, headline, description and a navy CTA over a teal background
The `panel-home` SHALL render its left half as a `<div>` (or equivalent) carrying the `bg-primary` class (resolving to `--color-primary` `#41B3C4`), containing an eyebrow `<span>` (uppercase, not a heading), a headline `<h2>`, a description `<p>` and a single CTA `<a href="/contacto">` styled with `bg-secondary text-white` (resolving to navy `#1F2D40`). The eyebrow SHALL NOT be rendered as a heading element (`<h1>`–`<h6>`). The obsolete utilities `bg-brand-teal` and `bg-brand-navy`, and references to `--color-brand-teal` / `--color-brand-navy`, SHALL NOT appear anywhere in the panel.

#### Scenario: Left half uses primary (not brand-teal)
- **WHEN** the PanelHome renders
- **THEN** the left half `<div>` carries `bg-primary` (computing to `rgb(65, 179, 196)`)
- **AND** its class string does NOT contain `bg-brand-teal`

#### Scenario: CTA uses secondary (not brand-navy)
- **WHEN** the PanelHome renders the `/contacto` CTA
- **THEN** the CTA `<a>` carries `bg-secondary text-white` (computing to `rgb(31, 45, 64)`)
- **AND** its class string does NOT contain `bg-brand-navy`

### Requirement: PanelHome renders the right half with a 2×2 grid of four statistics over a white background
The `panel-home` SHALL render its right half as a `<div>` (or equivalent) carrying the `bg-white` class, containing exactly four stat cells laid out in a `grid-cols-2` grid (2 rows × 2 columns). Each stat cell SHALL render the `value` as a large bold paragraph (with class `text-secondary` instead of the obsolete `text-brand-navy`) and the `label` as a small uppercase paragraph below it. The grid SHALL keep `grid-cols-2` across all viewports (mobile and desktop).

#### Scenario: Stat value uses secondary (not brand-navy)
- **WHEN** the PanelHome renders a stat cell
- **THEN** the value `<p>` carries `text-secondary` (resolving to `#1F2D40`)
- **AND** its class string does NOT contain `text-brand-navy`

### Requirement: PanelHome meets WCAG AA contrast between white text and the teal background
The `panel-home` SHALL meet WCAG AA contrast requirements between white text (`#FFFFFF`) and the teal background of the left half (now `--color-primary` `#41B3C4`):

- The headline `<h2>` (bold, fontsize ≥ 18pt) SHALL meet WCAG AA Large (contrast ratio ≥ 3:1) against the teal background.
- The description `<p>` SHALL meet WCAG AA Normal (contrast ratio ≥ 4.5:1) against the teal background. The opacity MAY be adjusted (e.g. `text-white/90` or solid `text-white`) to meet the threshold, OR — if the primary token `#41B3C4` cannot meet AA Normal even with solid white text — the background of the left half SHALL fall back to `--color-primary-darker` (`#227E8E`, ratio ≈ 3.95:1 to white) only when the AA Large fallback is required for text body.

The `test.skip()` calls in `apps/web/e2e/panel-home.spec.ts` for tasks 4.13 and 4.14 of the archived `panel-home` change SHALL be removed; the corresponding tests SHALL pass with the new tokens.

#### Scenario: h2 white text meets WCAG AA Large on teal background
- **WHEN** the Playwright E2E test 4.13 runs against the rendered PanelHome
- **THEN** the computed `color` (expected `rgb(255, 255, 255)`) and `background-color` (expected to resolve from `--color-primary` `#41B3C4`) of the `<h2>` are read via `getComputedStyle`
- **AND** the WCAG contrast ratio between them is ≥ 3.0
- **AND** the test runs (not `test.skip()`ed)

#### Scenario: description <p> meets WCAG AA Normal on teal background
- **WHEN** the Playwright E2E test 4.14 runs against the rendered PanelHome
- **THEN** the computed `color` and `background-color` of the description `<p>` are read via `getComputedStyle`
- **AND** the WCAG contrast ratio is ≥ 4.5
- **OR** if the primary token `#41B3C4` with solid white text does not reach 4.5:1, the left half background is overridden locally to `--color-primary-darker` `#227E8E` and the test passes
- **AND** the test runs (not `test.skip()`ed)

#### Scenario: panel-home spec file contains no test.skip for 4.13/4.14
- **WHEN** the source of `apps/web/e2e/panel-home.spec.ts` is inspected
- **THEN** no `test.skip()` call exists for the tests named "WCAG AA Large contrast: h2 white text on teal background (4.13)" nor "WCAG AA Normal contrast: description <p> on teal; verify and adjust if failing (4.14)"
- **AND** the tests are defined with a regular `test(...)` call and execute in CI
