# site-header Specification

## MODIFIED Requirements

### Requirement: Header renders logo at 2× size with overflow
The header SHALL render the Riff logo from `apps/web/src/assets/img/logo-web.png` via `astro:assets` `<Image>`, with explicit intrinsic dimensions `width={330}` and `height={166}` to preserve the 1080×542 (≈1.99:1) aspect ratio at 2× density in the desktop header. The logo SHALL keep `loading="eager"`, the descriptive `logoAlt` fallback, the `h-20 lg:h-24` wrapper with `overflow-visible`, and responsive maximum widths of `max-w-[160px]` below the `sm` breakpoint and `sm:max-w-[240px]` from 640px up. Those caps preserve the previous rendered heights (~80px mobile, ~120px desktop) and therefore the accepted slight overflow of the desktop header box. No import or reference to `logo-web.webp` SHALL remain in `Header.astro`. The header container SHALL use the `--color-secondary` (navy `#1F2D40`) token via the Tailwind utility `bg-secondary` for its background; the gradient utilities `bg-linear-to-r from-secondary to-secondary-light` and the obsolete utilities `bg-brand-navy`, `from-brand-navy`, `to-brand-navy-light` SHALL NOT appear.

#### Scenario: Logo asset and intrinsic dimensions
- **WHEN** `Header.astro` is inspected
- **THEN** it imports `logo-web.png`
- **AND** it renders `<Image>` with `width={330}` and `height={166}`
- **AND** the logo image carries `max-w-[160px]` and `sm:max-w-[240px]`
- **AND** `logo-web.webp` is not referenced

#### Scenario: Logo container uses the solid secondary background
- **WHEN** el site header renders in its default (non-transparent) state
- **THEN** the `<header>` container applies `bg-secondary` (resolving to `#1F2D40`)
- **AND** the container does NOT apply `from-secondary to-secondary-light`

### Requirement: Header accessibility
The site-header SHALL meet accessibility requirements and ensure a single `<header>` landmark per page. The hamburger/X toggle button SHALL remain visible over the fullscreen overlay with a color that contrasts both the navy header and the white overlay. The retired top bar SHALL NOT introduce a second landmark or a contact region.

#### Scenario: Semantic landmarks
- **WHEN** any page renders the Header
- **THEN** exactly one `<header>` element exists in the document
- **AND** no element with `role="region"` and `aria-label="Barra de contacto"` exists
- **AND** the navigation is wrapped in `<nav aria-label="Navegación principal">`

#### Scenario: Interactive element labels
- **WHEN** the Header renders
- **THEN** the logo link has `aria-label="Ir al inicio"`
- **AND** the logo image has a meaningful `alt` (from `logoAlt`)
- **AND** the mobile toggle has an `aria-label` describing its action (switches between "Abrir menú" and "Cerrar menú")
- **AND** the active nav item has `aria-current="page"`

### Requirement: Header box contains the full logo height
The `.site-header` container SHALL include a responsive `padding-bottom` of `pb-10 lg:pb-4`: mobile keeps 80px (`h-20`) + 40px (`pb-10`) = 120px against a ~80.4px rendered logo at the 160px cap (full containment); desktop keeps 96px (`lg:h-24`) + 16px (`lg:pb-4`) = 112px against a ~120.5px rendered logo at the 240px cap — the same slight visual overflow accepted by the client in `ui-chrome-polish`, preserved by keeping the logo wrapper's `overflow-visible` behavior and the previous rendered heights. (MODIFIED in `ui-chrome-remove-top-header-phone-fab` — dimensions updated for the 1080×542 PNG while preserving the old visual footprint.)

#### Scenario: SC-001 — site-header carries pb-10 lg:pb-4
- **WHEN** the site-header renders
- **THEN** the `<header class="site-header">` element carries `pb-10` and `lg:pb-4`
- **AND** the previous `lg:pb-12` value does NOT appear in the header classes
- **AND** on mobile the header box contains the full logo height; on desktop the same slight 2× logo overflow accepted by the client remains
