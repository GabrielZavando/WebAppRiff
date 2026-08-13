## MODIFIED Requirements

### Requirement: PanelHome sits 8px below the HeroBanner on desktop (no overlap) via positive margin-top
The `panel-home` outermost `<section>` SHALL carry a `margin-top` and `position: relative` with a positive `z-index` (e.g. `z-10`). On desktop (`lg` >= 1024px) the section SHALL carry `lg:mt-2` (a positive 8px margin-top, so the panel starts 8px below the banner's bottom edge — no overlap). On smaller viewports the panel SHALL keep a small 8px overlap at `-mt-2 md:-mt-2` (negative margin-top, per the client's earlier review of the mobile/tablet look). The separation/gap SHALL be purely visual (CSS) and SHALL NOT modify the HeroBanner component or its rendered HTML. This refines the previously archived requirement (which targeted ~50% overlap with `-mt-16 md:-mt-24 lg:-mt-32`) down through ~25%, ~10%, a minimal `~4px` overlap, a 24px overlap, a 16px overlap, a 16px GAP, an 8px GAP and an 8px OVERLAP, to a final 8px GAP below the banner on desktop (`lg:mt-2`) per client review ("dejarlo en 8px" — adjusted from overlap to gap after confirming a positive margin seats the panel lower, not higher).

#### Scenario: Panel section carries a desktop margin-top that separates it from the banner (8px gap)
- **WHEN** the PanelHome renders
- **THEN** the outermost `<section>` carries `-mt-2` and `md:-mt-2` (mobile/tablet keep a small 8px overlap)
- **AND** the `<section>` carries `lg:mt-2` (8px gap below the banner on desktop, no overlap)
- **AND** the `<section>` carries a `relative` positioning class
- **AND** the `<section>` carries a positive z-index class (e.g. `z-10`)

#### Scenario: PanelHome is rendered after the HeroBanner in the DOM
- **WHEN** the home page `/` renders
- **THEN** the rendered HTML contains the HeroBanner `<section>` followed by the PanelHome `<section>`
- **AND** the PanelHome `<section>` appears exactly once in the document

#### Scenario: HeroBanner HTML is not modified by the PanelHome
- **WHEN** the home page `/` renders with both HeroBanner and PanelHome
- **THEN** the HeroBanner `<section>` carries the same set of classes it would carry when rendered alone
- **AND** the HeroBanner headline, subtitle and CTAs render with the same text and classes as in the `banner-home` change

## ADDED Requirements

### Requirement: PanelHome reduces its inner padding on desktop
The `panel-home` left half (`<div>` carrying `bg-primary`) SHALL use reduced inner padding on desktop: `lg:p-12` (48px) instead of the larger `lg:p-16` (64px) used previously, so the panel reads tighter on large screens. The mobile/tablet padding (`p-8 md:p-12`) is unchanged. The right half SHALL keep `p-8 md:p-12` (already 48px at desktop).

#### Scenario: Left half uses reduced desktop padding lg:p-12
- **WHEN** the PanelHome renders the left (bg-primary) half
- **THEN** the left half `<div>` carries `lg:p-12`
- **AND** the left half `<div>` does NOT carry `lg:p-16`
