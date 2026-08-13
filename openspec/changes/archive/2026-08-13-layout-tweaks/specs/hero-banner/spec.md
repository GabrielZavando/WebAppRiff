## MODIFIED Requirements

### Requirement: HeroBanner layout is responsive across viewports
The `hero-banner` SHALL scale its typography and spacing based on the viewport: smaller on mobile (< 768px) and larger on desktop (>= 768px), with the CTA container switching between stacked and inline layouts at the `sm` breakpoint. The content wrapper inside the section SHALL use asymmetric responsive vertical padding: a reduced top padding on mobile/tablet (`pt-4` mobile, `md:pt-8`) so the title, subtitle and CTAs sit higher and remain visible in the initial viewport, a larger desktop top padding (`lg:pt-24`) that lowers the content block within the full-height banner per the client's final review, and a preserved bottom padding (`pb-16` mobile, `md:pb-24`, `lg:pb-32`) that maintains spacing before the overlapping PanelHome.

#### Scenario: Mobile uses small typography and stacked CTAs
- **WHEN** the HeroBanner renders on a viewport < 768px
- **THEN** the `<h1>` carries a class constraining its size to `text-5xl` (or the equivalent base size at mobile)
- **AND** the CTA container uses `flex-col` layout so each CTA occupies a full row

#### Scenario: Desktop uses large typography and inline CTAs
- **WHEN** the HeroBanner renders on a viewport >= 768px
- **THEN** the `<h1>` carries a responsive class scaling up to `md:text-7xl`
- **AND** the CTA container uses `sm:flex-row` layout so the CTAs sit side by side

#### Scenario: Section content box uses asymmetric vertical padding with reduced top
- **WHEN** the HeroBanner renders
- **THEN** the content wrapper inside the section carries `pt-4` (reduced top padding on mobile)
- **AND** the wrapper carries `md:pt-8` and `lg:pt-24` (reduced top on mobile/tablet, larger top on desktop lowering the content)
- **AND** the wrapper carries `pb-16` (bottom padding on mobile)
- **AND** the wrapper carries `md:pb-24` and `lg:pb-32` (scaling bottom padding up on larger viewports)
- **AND** the wrapper does NOT carry a symmetric `py-*` utility (padding is split into `pt-*`/`pb-*`)
