# panel-home Specification

## MODIFIED Requirements

### Requirement: PanelHome integrates into the home page after the HeroBanner
The `apps/web/src/pages/index.astro` SHALL render `<HeroBanner {...HERO_BANNER_CONTENT} />` followed by `<PanelHome {...PANEL_HOME_CONTENT} />` inside its `<Layout>` slot. The PanelHome SHALL NOT replace the HeroBanner; both render on the home page.

#### Scenario: Home page renders both HeroBanner and PanelHome
- **WHEN** a visitor loads `/` (the home page)
- **THEN** the rendered HTML contains the HeroBanner `<section>` (with the hero headline, subtitle and CTAs)
- **AND** the rendered HTML contains the PanelHome `<section>` (with the panel headline, description, CTA and 4 stats)

#### Scenario: PanelHome renders after the HeroBanner in the DOM
- **WHEN** the home page renders
- **THEN** the rendered HTML keeps the order: `<header>` (site-header), then the SearchForm `<div role="search">`, then the HeroBanner `<section>`, then the PanelHome `<section>`
- **AND** no retired top contact bar precedes the header
- **AND** the count of `<header>` elements in the document is still exactly one (no new landmark is introduced)
