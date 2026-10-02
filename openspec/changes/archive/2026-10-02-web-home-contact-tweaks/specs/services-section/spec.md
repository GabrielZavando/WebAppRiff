## MODIFIED Requirements

### Requirement: Each ServicesSection card CTA renders as the design-system solid primary button
Each card SHALL render an `<a>` CTA whose `href` is derived from the service's `slug` as `/servicios#{slug}` (e.g. `slug="medicion-industrial"` → `href="/servicios#medicion-industrial"`), targeting the corresponding service card anchor on the /servicios page. The CTA SHALL follow the design-system solid primary button pattern (same as `SolutionSection`'s "SABER MÁS" and `HeroBanner`'s "VER SERVICIOS" CTAs): a teal background token (`bg-primary`), hover darkening (`hover:bg-primary-dark`), white text (`text-white`), `inline-flex items-center gap-1`, `font-heading font-semibold uppercase`, `text-xs tracking-wide`, `px-6 py-3`, and `transition-colors`. The card CTA's visible text SHALL be "Ver detalles" (provided by the service's `ctaLabel` prop value). The CTA SHALL contain a decorative `lucide:arrow-right` icon with `aria-hidden="true"`; the link's accessible name is its visible text. The CTA SHALL NOT be a plain text link without background (e.g. only `text-accent` or `text-primary` without `bg-primary`). (MODIFIED in `web-home-contact-tweaks`: the per-card `href` was a generic `/servicios`; it now targets the service anchor `/servicios#{slug}` for smooth-scroll deep links. The `href` field is no longer part of the `Service` contract — the CTA target derives from the existing `slug` field.)

#### Scenario: Each card CTA links to the service anchor
- **WHEN** the ServicesSection renders a card with `slug="medicion-industrial"`
- **THEN** the card contains an `<a>` element whose `href` attribute equals `"/servicios#medicion-industrial"`

#### Scenario: Each card CTA visible text is "Ver detalles"
- **WHEN** the ServicesSection renders a card with `ctaLabel="Ver detalles"`
- **THEN** the card CTA's visible text includes "Ver detalles"
- **AND** the card CTA visible text does NOT equal "Ver todos los servicios" (the bottom CTA label is distinct)

#### Scenario: Each card CTA follows the solid primary button pattern
- **WHEN** the ServicesSection renders a card
- **THEN** the card CTA `<a>` carries the `bg-primary` class
- **AND** the `<a>` carries the `hover:bg-primary-dark` class
- **AND** the `<a>` carries the `text-white` class
- **AND** the `<a>` carries the `inline-flex` class
- **AND** the `<a>` carries `px-6` and `py-3` padding utilities
- **AND** the `<a>` carries `font-heading`, `font-semibold`, `uppercase`, `text-xs`, `tracking-wide` utilities
- **AND** the `<a>` does NOT carry only a text color token without a background (e.g. NOT a `<a class="text-accent ...">` link, NOT a `<a class="text-primary ...">` link)

#### Scenario: Each card CTA includes a decorative arrow icon with aria-hidden
- **WHEN** the ServicesSection renders a card
- **THEN** the card CTA `<a>` contains an `<svg>` rendered by `astro-icon` from `lucide:arrow-right`
- **AND** the arrow `<svg>` carries `aria-hidden="true"`
- **AND** the `<a>` element itself does NOT carry `aria-hidden="true"` or `tabindex="-1"`

### Requirement: ServicesSection content is configured via a hardcoded constant
The `services-section` content SHALL come from the `SERVICES_SECTION_CONTENT` constant in `lib/config/services-section.ts`, exported as `Readonly<ServicesSectionProps>`, containing exactly 4 services and the section header copy + the `cta` block. The 4 services SHALL be, in render order: "Medición en Edificios", "Medición Industrial", "Obras y Proyectos", "Tratamiento de Agua y Desalinización". Each service SHALL carry a `slug`, `title`, `description`, `image` (imported from `apps/web/src/assets/img/`), `imageAlt` and (POST-APPLY UPDATE) a `ctaLabel` equal to `"Ver detalles"`. The `slug` SHALL be the single source for the card CTA target (`/servicios#{slug}`); the `Service` type SHALL NOT carry an `href` field (MODIFIED in `web-home-contact-tweaks`: the redundant `href: '/servicios'` field is removed — the CTA target derives from `slug`). The `cta` block SHALL be `{ label: "Ver todos los servicios", href: "/servicios" }`. The images SHALL be imported as: `edificios.jpg` for "Medición en Edificios", `medidores-de-agua.webp` for "Medición Industrial", `planta-tratamiento.webp` for "Obras y Proyectos", `osmosis-inversa.jpg` for "Tratamiento de Agua y Desalinización".

#### Scenario: SERVICES_SECTION_CONTENT exposes the full set of props
- **WHEN** `SERVICES_SECTION_CONTENT` is imported from `lib/config/services-section`
- **THEN** it has the shape `{ readonly headline: string; readonly description: string; readonly services: readonly Service[]; readonly cta: ServicesSectionCta }`
- **AND** `headline` and `description` are non-empty strings
- **AND** `services` has length exactly 4
- **AND** `cta` has non-empty `label` and `href` strings

#### Scenario: Services carry the expected titles in render order
- **WHEN** `SERVICES_DATA` (or `SERVICES_SECTION_CONTENT.services`) is inspected
- **THEN** the titles in render order are exactly: "Medición en Edificios", "Medición Industrial", "Obras y Proyectos", "Tratamiento de Agua y Desalinización"

#### Scenario: Services carry the expected descriptions in render order
- **WHEN** `SERVICES_DATA` is inspected
- **THEN** the descriptions in render order are exactly: "Instalación y recambio de medidores de agua caliente en comunidades.", "Instalación y puesta en marcha de sistemas de medición de caudal.", "Desarrollo de infraestructura para sistemas de medición y control.", "Diseño y optimización de plantas de tratamiento con tecnología de vanguardia."

#### Scenario: Each service carries a kebab-case slug used as the CTA anchor target
- **WHEN** `SERVICES_DATA` is inspected
- **THEN** every element carries a `slug` matching the kebab-case pattern (lowercase letters and hyphens only)
- **AND** the slugs in render order are exactly: `medicion-en-edificios`, `medicion-industrial`, `obras-y-proyectos`, `tratamiento-de-agua`
- **AND** every element does NOT expose an `href` property (the CTA target derives from `slug`)

#### Scenario: Each service carries the "Ver detalles" card CTA label
- **WHEN** `SERVICES_DATA` is inspected
- **THEN** every element's `ctaLabel` equals `"Ver detalles"` (POST-APPLY UPDATE: per-card CTAs are distinct from the bottom "Ver todos los servicios" CTA)

#### Scenario: Each service carries a non-empty descriptive imageAlt
- **WHEN** `SERVICES_DATA` is inspected
- **THEN** each element's `imageAlt` is a non-empty string describing the image content (not the title)

#### Scenario: Services import the correct image for each card
- **WHEN** `SERVICES_DATA` is inspected
- **THEN** the service at index 0 ("Medición en Edificios") imports the `edificios.jpg` image
- **AND** the service at index 1 ("Medición Industrial") imports the `medidores-de-agua.webp` image
- **AND** the service at index 2 ("Obras y Proyectos") imports the `planta-tratamiento.webp` image
- **AND** the service at index 3 ("Tratamiento de Agua y Desalinización") imports the `osmosis-inversa.jpg` image

#### Scenario: The cta block carries "Ver todos los servicios" and /servicios
- **WHEN** `SERVICES_SECTION_CONTENT.cta` is inspected
- **THEN** `cta.label` equals `"Ver todos los servicios"`
- **AND** `cta.href` equals `"/servicios"`