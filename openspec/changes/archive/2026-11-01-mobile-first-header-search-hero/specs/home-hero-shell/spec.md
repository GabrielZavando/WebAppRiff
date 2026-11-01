## MODIFIED Requirements

### Requirement: The home Layout provides a full-viewport hero shell with the background image and overlay
The Layout used by the home page (mode `hero`) SHALL render a wrapper container spanning at least the full viewport height (`min-h-screen`) with horizontal clipping via `overflow-x: clip` on `<html>` and `<body>` (the Tailwind utility `overflow-x-clip` on the body). It SHALL NOT use `overflow-x: hidden` on `<html>` or `<body>` because a horizontal `hidden` value computes the other axis to `auto` and turns the element into a scrolling ancestor, which breaks the sticky Header + SearchForm group. It SHALL NOT use `overflow-hidden` (both axes) on the wrapper or `<body>` because it disables vertical viewport scrolling, clipping the page content below the fold (e.g. `PanelHome`). The first child SHALL be the imported background image rendered as a full-bleed element (`absolute inset-0 h-full w-full object-cover`) via `astro:assets` `<Picture>` (with AVIF/WebP source variants); the second child SHALL be a full-bleed decorative overlay `<div>` carrying `class="absolute inset-0 bg-secondary/80"` (the `--color-secondary` token #1F2D40 at 0.8 opacity) and `aria-hidden="true"`. A wrapper with `relative z-10` SHALL then contain, in DOM order, `Header`, `SearchForm` and the page slot. The `bg-secondary/80` overlay SHALL NOT be `bg-secondary/60` nor any `bg-black/*`.

#### Scenario: Shell covers full viewport, hosts the overlay and keeps vertical scroll enabled
- **WHEN** the home page renders with the hero shell
- **THEN** the first container carries `min-h-screen` and `overflow-x-clip`
- **AND** the rendered HTML does NOT contain `overflow-x-hidden` on `<html>` or `<body>`
- **AND** the rendered HTML does NOT contain `overflow-hidden` (which would disable vertical scrolling of the page)
- **AND** the rendered HTML contains a `<picture>` element with `<source>` variants including `image/avif` and `image/webp`
- **AND** it contains `class="absolute inset-0 bg-secondary/80"` on a `<div>` with `aria-hidden="true"`
- **AND** the overlay class does NOT contain `bg-secondary/60` nor any `bg-black/`

#### Scenario: Sticky Header + Search group survives horizontal clipping
- **WHEN** the home page is scrolled down
- **THEN** the `header-scroll-shell` wrapper remains pinned at the top of the viewport
- **AND** the computed `overflow-x` of `<html>` and `<body>` is `clip`

#### Scenario: The three header components are inside the z-10 stack
- **WHEN** the home page renders
- **THEN** the `relative z-10` wrapper contains in order: `<header>`, `<div role="search">`, then the hero slot
- **AND** no `role="region"` with `aria-label="Barra de contacto"` is rendered
- **AND** exactly one `<header>` element exists in the document
