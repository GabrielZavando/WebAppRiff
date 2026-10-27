# services-section Specification

## MODIFIED Requirements

### Requirement: ServicesSection integrates into the home page after SolutionSection
The `apps/web/src/pages/index.astro` SHALL render, in order inside the `<Layout>` slot: `<HeroBanner {...HERO_BANNER_CONTENT} />`, then `<PanelHome {...PANEL_HOME_CONTENT} />`, then `<SolutionSection {...SOLUTION_SECTION_CONTENT} />`, then `<ServicesSection {...SERVICES_SECTION_CONTENT} />`. The `ServicesSection` SHALL NOT replace any existing component; all four render on the home page in the documented order.

#### Scenario: Home page renders HeroBanner, PanelHome, SolutionSection and ServicesSection in order
- **WHEN** a visitor loads `/` (the home page)
- **THEN** the rendered HTML contains the HeroBanner `<section>` (with the hero `<h1>` headline)
- **AND** the rendered HTML contains the PanelHome `<section>` (with the panel `<h2>` headline)
- **AND** the rendered HTML contains the SolutionSection `<section>` (with the solution `<h3>` headline and its 4 `<h4>` card titles)
- **AND** the rendered HTML contains the ServicesSection `<section>` (with the services `<h3>` headline and its 4 `<h4>` card titles)
- **AND** the ServicesSection `<section>` appears in the DOM AFTER the SolutionSection `<section>`

#### Scenario: DOM order is preserved: hero → panel → solutions → services
- **WHEN** the home page renders
- **THEN** the rendered HTML keeps the order: `<header>` (site-header), then the SearchForm `<div role="search">`, then the HeroBanner `<section>`, then the PanelHome `<section>`, then the SolutionSection `<section>`, then the ServicesSection `<section>`
- **AND** no retired top contact bar precedes the header
- **AND** the count of `<header>` elements in the document is still exactly one (no new landmark is introduced)
- **AND** (POST-APPLY UPDATE) the visible heading outline of the loaded page keeps exactly 1 `<h1>`, 2 `<h2>`, 2 `<h3>` and 8 `<h4>`; the count is performed over visible elements because the Astro Dev Toolbar (present in `astro preview`) appends hidden `<h1>` elements to the DOM that are NOT part of the page content (this supersedes the previous 1/2/1/4 outline declared by the archived `solution-section` change: ServicesSection adds one `<h3>` and 4 `<h4>` as a sibling portfolio section)

#### Scenario: ServicesSection does not modify HeroBanner, PanelHome or SolutionSection rendered HTML
- **WHEN** the home page renders with all four components
- **THEN** the HeroBanner `<section>` carries the same set of classes and content it would carry when rendered alone
- **AND** the PanelHome `<section>` carries the same set of classes and content it would carry when rendered alone
- **AND** the SolutionSection `<section>` carries the same set of classes and content it would carry when rendered alone
