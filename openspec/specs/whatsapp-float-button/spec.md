# whatsapp-float-button Specification

## Purpose
TBD - created by archiving change ui-chrome-polish. Update Purpose after archive.
## Requirements
### Requirement: Global floating WhatsApp contact button
Every page of the site SHALL render a floating WhatsApp contact button (`WhatsAppButton.astro`, integrated once in `Layout.astro`): a fixed `<a>` at the bottom-right corner (`fixed bottom-6 right-6 z-20`), icon-only (`simple-icons:whatsapp` via astro-icon, no text label with the number), linking to `https://wa.me/56937526162` (phone +56 9 3752 6162, digits only with country code) with `target="_blank"` and `rel="noopener noreferrer"`. The button colors SHALL use the design tokens `--color-whatsapp` (#25D366) and `--color-whatsapp-dark` (hover) declared in both apps' `globals.css` (design-tokens parity); no raw hex in the component. The icon-set exception (Lucide provides no WhatsApp brand icon) SHALL be documented in `docs/design/style-guide/README.md`, mirroring the existing `simple-icons:x` precedent. The `z-20` value places the button above page content (≤ `z-10`) and below the sticky header group (`z-30`) and its mobile menu overlay (adversarial review finding, 2026-10-04). (ADDED in `ui-chrome-polish`.)

#### Scenario: SC-007 — floating WhatsApp button on every page
- **GIVEN** any page of the site (including the 404 fallback and pages without the search bar)
- **WHEN** the Layout renders
- **THEN** a fixed bottom-right floating button links to `https://wa.me/56937526162` (target `_blank`, `rel="noopener noreferrer"`), icon-only
- **AND** it is visible above the page content (≥ `z-10`) and below the sticky header group `z-30` and its mobile menu overlay (`z-20` < `z-30`)
- **AND** it persists across client-side navigations (layout markup, no extra JS)

#### Scenario: SC-008 — WhatsApp button accessibility
- **GIVEN** the floating WhatsApp button rendered with the brand token color
- **WHEN** a screen reader or keyboard user reaches it
- **THEN** it is an `<a>` with `aria-label="Contactar por WhatsApp"` and a visible focus state
- **AND** the icon carries `aria-hidden="true"` and there is no text label with the number

