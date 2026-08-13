## ADDED Requirements

### Requirement: PanelHome renders with a static elevation shadow on its main grid
The `panel-home` main grid element (`<div class="grid grid-cols-1 lg:grid-cols-2">`, the element that wraps the teal + white halves) SHALL apply a static `box-shadow` with the value `0 10px 30px rgba(22, 32, 46, 0.3)` (the same elevation used by the compact scroll header shell), visible at all times regardless of scroll position. The shadow value SHALL resolve from the global CSS token `--shadow-scroll-shell` (promoted to `globals.css` `@theme`), which the `.header-scroll-shell` rule SHALL also consume. This is a documented exception to the flat-design rule that otherwise forbids `shadow*` on base components in their static state.

> **Note (post-apply):** The shadow lives on the inner grid (not the outermost `<section>`) so it hugs the visible teal+white card. Putting it on the full-width `<section>` would cast a shadow across the entire viewport (incorrect visual). Putting it on the `.container` wrapper would also be incorrect because the card occupies only the container's interior. The main grid is the element that exactly bounds the visible panel.

#### Scenario: Main grid carries the static elevation shadow
- **WHEN** the PanelHome renders
- **THEN** the main `grid grid-cols-1 lg:grid-cols-2` element computes a `box-shadow` equal to `0 10px 30px rgba(22, 32, 46, 0.3)` (not `none`)
- **AND** the `box-shadow` is present regardless of scroll position (no `data-scrolled` dependency)

#### Scenario: Shadow token is global and reused by the header shell
- **WHEN** `globals.css` `@theme` is inspected
- **THEN** it declares a token `--shadow-scroll-shell: 0 10px 30px rgba(22, 32, 46, 0.3)`
- **AND** `header-scroll.css` `.header-scroll-shell` consumes `var(--shadow-scroll-shell)` (no local duplicate definition)

#### Scenario: Flat-design exception is documented
- **WHEN** `docs/design/style-guide/README.md` is inspected
- **THEN** the flat-design section notes that `PanelHome` (specifically its main grid element) is the documented exception that applies `--shadow-scroll-shell` as elevation over the overlapping HeroBanner

### Requirement: PanelHome animates the four stat numbers from 0 to their value on first visibility
The `panel-home` SHALL animate each stat value from `0` to its target numeric value when the user scrolls down and the panel first enters the viewport, using an `IntersectionObserver` that fires the animation exactly once (it SHALL NOT replay on subsequent re-entries). During the animation the numeric portion counts up while the `+` suffix SHALL remain visible at all times (e.g. `0+`, `1+`, … `40+`). The target numeric value SHALL come from the `numericValue: number` field of `PanelStat` (values `40`, `30000`, `5`, `9`), while the formatted display (`value`, e.g. `30.000+`) remains the SSR/no-JS fallback. The animation SHALL respect `prefers-reduced-motion: reduce` by skipping the count-up and showing the final value immediately.

#### Scenario: Stat cells expose a numeric target via data attributes
- **WHEN** the PanelHome renders
- **THEN** each stat value `<p>` carries a `data-stat-value` attribute and a `data-target` attribute equal to its `numericValue` (`40`, `30000`, `5`, `9`)
- **AND** the rendered visible text of each stat value is the `value` string (`40+`, `30.000+`, `5+`, `9+`) as a no-JS fallback

#### Scenario: Numbers count up from 0 to target once when scrolled into view
- **WHEN** the page is scrolled down so the PanelHome enters the viewport
- **THEN** each stat number animates from `0` up to its `data-target` value
- **AND** the `+` suffix is present throughout the animation
- **AND** the animation does NOT replay if the panel leaves and re-enters the viewport

#### Scenario: Reduced motion shows final value without animation
- **WHEN** the environment reports `prefers-reduced-motion: reduce`
- **THEN** the stat values render as their final `value` strings (`40+`, `30.000+`, `5+`, `9+`) with no count-up animation

#### Scenario: numericValue is part of the PanelStat contract
- **WHEN** `PanelStat` / `PANEL_HOME_CONTENT` is inspected
- **THEN** every `stats` element has a `numericValue` number equal to the integer target of its `value` (`40`, `30000`, `5`, `9` respectively)

### Requirement: PanelHome adorns the stats grid with a plus-shaped divider cross via gap-px
The `panel-home` right-half stats grid SHALL render a decorative `+` (plus) sign that divides the 2×2 stats layout into four quadrants: a vertical 1px line at the horizontal centre (between the two columns) and a horizontal 1px line at the vertical centre (between the two rows), both in the primary colour (`--color-primary`, `#41B3C4`).

The divider SHALL reach the actual top, bottom, left and right edges of the white half of the panel. Because the wrapper carries `background-color: var(--color-primary)` and the cells carry `bg-white`, with the grid configured as `grid-cols-2 grid-rows-2 gap-px h-full w-full`, the 1px gap between cells exposes the primary colour as the divider lines.

The wrapper SHALL be a `relative` element that stretches to the full height of the white half (`flex-1` inside a `flex flex-col` `bg-white` parent that is itself stretched by `align-items: stretch` on the main `lg:grid-cols-2` grid). Padding SHALL live on the cells, not on the wrapper, so nothing limits the divider lines from reaching the actual edges of the white half.

Because the divider is rendered via CSS Grid gaps (not as separate DOM elements), no `aria-hidden` attribute is needed: assistive technologies do not read grid gaps and the four stat `<p>` elements remain unmodified in text and accessible order.

#### Scenario: Stats grid container is relative and stretches to the white half height
- **WHEN** the PanelHome renders the right half
- **THEN** the 2×2 stats grid is wrapped in a `relative` container (`stats-grid-wrap`)
- **AND** that container stretches to the full height of the white half (via `flex-1` + `flex flex-col` chain anchored to the main grid's `align-items: stretch`)
- **AND** the grid uses `grid-cols-2 grid-rows-2 gap-px h-full w-full` so the cells tile the wrapper edge-to-edge

#### Scenario: Divider colour resolves from the primary token
- **WHEN** the divider is inspected
- **THEN** the wrapper's `background-color` resolves from `--color-primary` (`rgb(65, 179, 196)`)
- **AND** the cells' `background-color` resolves to white (`rgb(255, 255, 255)`)
- **AND** the 1px gap exposes the primary colour as the divider lines
- **AND** no raw hex literal appears in the component source for the divider colour

#### Scenario: Divider lines reach the actual edges of the white half
- **WHEN** the rendered panel is measured
- **THEN** the leftmost cell starts at the wrapper's left edge (X ≈ 0, within 1px)
- **AND** the rightmost cell ends at the wrapper's right edge (within 1px)
- **AND** the topmost cell starts at the wrapper's top edge (Y ≈ 0, within 1px)
- **AND** the bottommost cell ends at the wrapper's bottom edge (within 1px)
- **AND** both the horizontal and vertical divider lines therefore span the full width and height of the white half

#### Scenario: Divider does not impact accessibility
- **WHEN** the rendered DOM is inspected by assistive technologies
- **THEN** the four stat `<p>` values and labels remain unmodified in text and accessible order
- **AND** because the divider is rendered via CSS Grid gaps (no separate DOM elements), no `aria-hidden` attribute is required: gaps are not exposed to the accessibility tree
