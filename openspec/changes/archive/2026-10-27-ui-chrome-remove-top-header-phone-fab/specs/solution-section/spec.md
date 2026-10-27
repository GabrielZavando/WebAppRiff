# solution-section Specification

## MODIFIED Requirements

### Requirement: SolutionSection integrates into the home page after PanelHome
The `apps/web/src/pages/index.astro` SHALL render `<HeroBanner {...HERO_BANNER_CONTENT} />` followed by `<PanelHome {...PANEL_HOME_CONTENT} />` followed by `<SolutionSection {...SOLUTION_SECTION_CONTENT} />`, all inside the `<Layout>` slot. The SolutionSection SHALL NOT replace any existing component; all three render on the home page in the documented order.

#### Scenario: Home page renders HeroBanner, PanelHome and SolutionSection in order
- **WHEN** a visitor loads `/` (the home page)
- **THEN** the rendered HTML contains the HeroBanner `<section>` (with the hero `<h1>` headline)
- **AND** the rendered HTML contains the PanelHome `<section>` (with the panel `<h2>` headline)
- **AND** the rendered HTML contains the SolutionSection `<section>` (with the section `<h3>` headline and 4 `<h4>` card titles)
- **AND** (POST-APPLY UPDATE) the visible heading outline of the loaded page keeps exactly 1 `<h1>`, 2 `<h2>`, 1 `<h3>` and 4 `<h4>`; the count is performed over visible elements because the Astro Dev Toolbar (present in `astro preview`) appends hidden `<h1>` elements to the DOM that are NOT part of the page content

#### Scenario: DOM order is preserved: hero → panel → solutions
- **WHEN** the home page renders
- **THEN** the rendered HTML keeps the order: `<header>` (site-header), then the SearchForm `<div role="search">`, then the HeroBanner `<section>`, then the PanelHome `<section>`, then the SolutionSection `<section>`
- **AND** no retired top contact bar precedes the header
- **AND** the count of `<header>` elements in the document is still exactly one (no new landmark is introduced)

#### Scenario: SolutionSection does not modify HeroBanner or PanelHome rendered HTML
- **WHEN** the home page renders with all three components
- **THEN** the HeroBanner `<section>` carries the same set of classes and content it would carry when rendered alone
- **AND** the PanelHome `<section>` carries the same set of classes and content it would carry when rendered alone
