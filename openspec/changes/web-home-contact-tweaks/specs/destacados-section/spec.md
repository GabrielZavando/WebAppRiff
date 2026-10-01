## MODIFIED Requirements

### Requirement: Each DestacadosSection card is a white raised card with image mat, title and CTA
Each card SHALL be an `<article>` carrying a white background token (`bg-white`), a flat-design floating shadow (`shadow-2`) with a hover elevation (`hover:shadow-4`), and a `transition-shadow` utility. The card SHALL contain: (a) an image mat area — a `<div>` with padding (e.g. `p-4`) wrapping the `astro:assets` `<Image>` rendered with `object-contain` and a square aspect; (b) a content area with the `<h4>` title and the "Ver detalles" CTA. The card SHALL NOT contain any price element (no `$` formatted text, no price paragraph). (MODIFIED in `web-home-contact-tweaks`: the per-card CTA text changes from "Cotizar" to "Ver detalles".)

#### Scenario: Card uses white background and elevated shadow tokens
- **WHEN** the DestacadosSection renders a card
- **THEN** the `<article>` carries a class expressing the white background token (e.g. `bg-white`)
- **AND** the `<article>` carries a shadow utility from the flat-design set (e.g. `shadow-2`)
- **AND** the `<article>` carries a hover shadow utility (e.g. `hover:shadow-4`)
- **AND** the `<article>` carries the `transition-shadow` utility

#### Scenario: Card has an image mat area with object-contain
- **WHEN** the DestacadosSection renders a card
- **THEN** the `<article>` contains a `<div>` carrying a padding utility (e.g. `p-4`) that wraps the card's image element
- **AND** the card's image element carries the `object-contain` utility

#### Scenario: Card does NOT render a price
- **WHEN** the DestacadosSection renders a card
- **THEN** the card content does NOT contain any element whose visible text starts with `$` (no price paragraph, no formatted amount)
- **AND** the rendered HTML of the card does NOT contain the substring `$0` or any `$`-prefixed number pattern matching `/\$\d/`

### Requirement: Each DestacadosSection card CTA renders as the outline primary "Ver detalles" button
Each card SHALL render an `<a>` CTA with the `href` attribute set to `/productos/{slug}` (product `slug` prop interpolated) and the visible text "Ver detalles" (verbatim, sentence case — NOT "Cotizar" and NOT "SOLICITAR COTIZACIÓN"). The CTA SHALL follow the design-system outline primary button pattern: `border-2 border-primary text-primary hover:bg-primary hover:text-white font-heading font-semibold uppercase text-xs tracking-wide px-4 py-3 block text-center transition-colors`. The CTA SHALL NOT carry `aria-hidden="true"` or `tabindex="-1"`. (MODIFIED in `web-home-contact-tweaks`: the visible text changes from "Cotizar" to "Ver detalles" — the href already targeted the product detail page `/productos/{slug}`.)

#### Scenario: Each card CTA links to the product slug route
- **WHEN** the DestacadosSection renders a card with `slug="medidor-electromagnetico-fullmag-ha"`
- **THEN** the card contains an `<a>` element whose `href` attribute equals `"/productos/medidor-electromagnetico-fullmag-ha"`

#### Scenario: Each card CTA visible text is "Ver detalles"
- **WHEN** the DestacadosSection renders a card
- **THEN** the card CTA's visible text equals "Ver detalles"
- **AND** the card CTA visible text does NOT equal "Cotizar", "SOLICITAR COTIZACIÓN" or "Cotización"

#### Scenario: Each card CTA follows the outline primary button pattern
- **WHEN** the DestacadosSection renders a card
- **THEN** the card CTA `<a>` carries the `border-2` and `border-primary` classes
- **AND** the `<a>` carries the `text-primary` class
- **AND** the `<a>` carries the `hover:bg-primary` and `hover:text-white` classes
- **AND** the `<a>` carries `font-heading`, `font-semibold`, `uppercase`, `text-xs`, `tracking-wide`, `px-4`, `py-3` utilities
- **AND** the `<a>` does NOT carry `aria-hidden="true"` and does NOT carry `tabindex="-1"`

### Requirement: DestacadosSection content is configured via a hardcoded constant
The `destacados-section` content SHALL come from the `DESTACADOS_SECTION_CONTENT` constant in `lib/config/destacados-section.ts`, exported as `Readonly<DestacadosSectionProps>`, containing exactly 4 products and the section header copy. The header SHALL be `headline: "Soluciones Destacadas"`, `ctaText: "EXPLORAR CATÁLOGO COMPLETO"`, `ctaHref: "/productos"`. The 4 products SHALL be, in render order: (1) "Antiincrustante Bimaks 420 para Ósmosis Inversa (Agua Salobre)"; (2) "Medidor Electromagnético Fullmag HA"; (3) "Medidor Ultrasónico Doppler Portátil Fullsonic (No Invasivo)"; (4) "Medidor de Flujo Riff Turbine Pro". Each product SHALL carry an `id`, `titulo`, `slug`, `imagen` (imported from `apps/web/src/assets/img/`) and a non-empty descriptive `imagenAlt`. The `slug` values SHALL match the published catalog slugs exactly: `antiincrustante-bimaks-420-para-osmosis-inversa-agua-salobre`, `medidor-electromagnetico-fullmag-ha`, `medidor-ultrasonico-doppler-portatil-fullsonic-no-invasivo`, `medidor-de-flujo-riff-turbine-pro` (MODIFIED in `web-home-contact-tweaks`: the two existing featured products kept their slugs aligned to the live catalog, and the two non-published products — "Flujómetro Universal" and "MWN – MEDIDOR INDUSTRIAL PARA AGUA FRÍA LIMPIA – MEDIDOR TIPO WOLTMAN" — were replaced by published products; the images for the replacements are provisional, reusing the freed local assets `flujometro-multiproposito.webp` and `MWN-DN50.webp` pending the client's real product photos). The config SHALL NOT include price fields.

#### Scenario: DESTADOS_SECTION_CONTENT exposes the full set of props
- **WHEN** `DESTADOS_SECTION_CONTENT` is imported from `lib/config/destacados-section`
- **THEN** it has the shape `{ readonly headline: string; readonly ctaText: string; readonly ctaHref: string; readonly products: readonly FeaturedProduct[] }`
- **AND** `headline` equals `"Soluciones Destacadas"`
- **AND** `ctaText` equals `"EXPLORAR CATÁLOGO COMPLETO"`
- **AND** `ctaHref` equals `"/productos"`
- **AND** `products` has length exactly 4

#### Scenario: Products carry the expected titles in render order
- **WHEN** `FEATURED_PRODUCTS` (or `DESTACADOS_SECTION_CONTENT.products`) is inspected
- **THEN** the titles in render order are exactly: "Antiincrustante Bimaks 420 para Ósmosis Inversa (Agua Salobre)", "Medidor Electromagnético Fullmag HA", "Medidor Ultrasónico Doppler Portátil Fullsonic (No Invasivo)", "Medidor de Flujo Riff Turbine Pro"

#### Scenario: Products carry the catalog-aligned kebab-case slugs in render order
- **WHEN** `FEATURED_PRODUCTS` is inspected
- **THEN** the slugs in render order are exactly: `antiincrustante-bimaks-420-para-osmosis-inversa-agua-salobre`, `medidor-electromagnetico-fullmag-ha`, `medidor-ultrasonico-doppler-portatil-fullsonic-no-invasivo`, `medidor-de-flujo-riff-turbine-pro`

#### Scenario: Products import the correct image for each card
- **WHEN** `FEATURED_PRODUCTS` is inspected
- **THEN** the product at index 0 ("Antiincrustante Bimaks 420 para Ósmosis Inversa (Agua Salobre)") imports the `antiincrustante-Bimaks.png` image
- **AND** the product at index 1 ("Medidor Electromagnético Fullmag HA") imports the `flujometro-multiproposito.webp` image (provisional, pending the client's real product photo)
- **AND** the product at index 2 ("Medidor Ultrasónico Doppler Portátil Fullsonic (No Invasivo)") imports the `FULLSONIC-DOPPLER-CONTABLE.webp` image
- **AND** the product at index 3 ("Medidor de Flujo Riff Turbine Pro") imports the `MWN-DN50.webp` image (provisional, pending the client's real product photo)

#### Scenario: Each product carries a non-empty descriptive imageAlt
- **WHEN** `FEATURED_PRODUCTS` is inspected
- **THEN** each element's `imagenAlt` is a non-empty string describing the image content (not the title)

#### Scenario: Each product carries a kebab-case slug
- **WHEN** `FEATURED_PRODUCTS` is inspected
- **THEN** each element's `slug` matches the kebab-case pattern (lowercase letters, digits and hyphens only)

#### Scenario: No product carries a price field
- **WHEN** `FEATURED_PRODUCTS` is inspected
- **THEN** no element exposes a `precio`, `price`, `precioVisible` or `priceVisible` property (the section deliberately shows no prices)