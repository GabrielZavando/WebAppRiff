# whatsapp-float-button Specification

## Purpose
Botón flotante global de WhatsApp del sitio público.
## Requirements
### Requirement: Global floating WhatsApp contact button
Every page of the site SHALL render a floating WhatsApp contact button (`WhatsAppButton.astro`, integrated once in `Layout.astro`): a fixed `<a>` at the bottom-right corner (`fixed bottom-6 right-6 z-20`), icon-only (`simple-icons:whatsapp` via astro-icon, no text label with the number), `target="_blank"` and `rel="noopener noreferrer"`. The number SHALL be provided via the `phone` prop from `Layout.astro`, sourced from the configuration constant `contact.whatsapp` (`+56 9 3752 6162`) in `lib/config/contact.ts` — the component SHALL NOT hardcode the number. The `href` SHALL be derived as `https://wa.me/{digits}` (phone digits only with country code). The button colors SHALL use the design tokens `--color-whatsapp` (#25D366) and `--color-whatsapp-dark` (hover); no raw hex in the component. (MODIFIED in `ui-chrome-uniform` — the number moved from a hardcoded literal to the configuration constant via prop.)

#### Scenario: SC-004 — button links to the configured WhatsApp number
- **GIVEN** `Layout.astro` renders `<WhatsAppButton phone={contact.whatsapp} />` with `contact.whatsapp = '+56 9 3752 6162'`
- **WHEN** the button renders
- **THEN** the `<a>` carries `href="https://wa.me/56937526162"` (digits of the constant)
- **AND** the component source does NOT contain the phone number as a hardcoded literal

#### Scenario: SC-007 — floating WhatsApp button on every page
- **GIVEN** any page of the site (including the 404 fallback and pages without the search bar)
- **WHEN** the Layout renders
- **THEN** a fixed bottom-right floating button links to the configured WhatsApp number (target `_blank`, `rel="noopener noreferrer"`), icon-only
- **AND** it is visible above the page content (≥ `z-10`) and below the sticky header group `z-30` and its mobile menu overlay (`z-20` < `z-30`)

#### Scenario: SC-008 — WhatsApp button accessibility
- **GIVEN** the floating WhatsApp button rendered with the brand token color
- **WHEN** a screen reader or keyboard user reaches it
- **THEN** it is an `<a>` with `aria-label="Contactar por WhatsApp"` and a visible focus state
- **AND** the icon carries `aria-hidden="true"` and there is no text label with the number

