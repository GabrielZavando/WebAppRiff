# site-footer Specification

## MODIFIED Requirements

### Requirement: Scroll-to-top script navigates smoothly to the top
The site SHALL bind the scroll-to-top click handling via document-level event delegation (module `lib/scroll/createScrollTopButton.ts`, initialized by `Layout.astro`) that persists across View Transitions: a click on any element carrying the `data-scroll-top` attribute — or on a descendant of it — SHALL scroll the window to the top with `behavior: 'smooth'`. The `site-footer` SHALL keep rendering the button markup unchanged (`data-scroll-top`, `aria-label="Volver arriba"`, `bg-primary`, `text-white`, `lucide:arrow-up`) and SHALL NOT ship its own inline click-binding script. (MODIFIED in `header-scroll-restore`.)

#### Scenario: SC-105 — Scroll-top button renders unchanged
- **WHEN** the footer renders
- **THEN** the bottom bar contains a `<button>` carrying the `data-scroll-top` attribute
- **AND** the button carries the `bg-primary` and `text-white` classes
- **AND** the button carries `aria-label="Volver arriba"`
- **AND** the button contains a `lucide:arrow-up` icon rendered as an `<svg>`
- **AND** the footer source does NOT contain an inline `<script>` binding `[data-scroll-top]` (the binding lives in `lib/scroll/createScrollTopButton.ts`)

#### Scenario: SC-106 — Delegated click scrolls smoothly to the top
- **WHEN** the user clicks the `[data-scroll-top]` button (or a descendant of it)
- **THEN** the window scrolls to `top: 0` with `behavior: 'smooth'`