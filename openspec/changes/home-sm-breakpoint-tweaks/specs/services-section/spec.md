## REMOVED Requirements

### Requirement: Each ServicesSection card is a horizontal layout (image left, content right) with mobile fallback

**Reason**: El layout horizontal desde `sm` (imagen a `w-2/5` a la izquierda y contenido a `flex-1` a la derecha) comprime la descripción de las tarjetas en el rango de 640–768px. El cliente pidió un layout estrictamente vertical con el orden imagen → título → descripción → CTA desde `sm`, lo que supersede este requisito.

**Migration**: El requisito queda reemplazado por "Each ServicesSection card uses a vertical layout with image, title, description and CTA". El `<article>` deja de declarar `sm:flex-row` y la imagen deja de declarar `sm:w-2/5`; la grilla de 2 columnas desde `sm`, la proporción 5:4 de la imagen, el fondo `bg-secondary`, el borde `border-secondary-light` y el `overflow-hidden` se mantienen sin cambios.

## ADDED Requirements

### Requirement: Each ServicesSection card uses a vertical layout with image, title, description and CTA

Each card SHALL be an `<article>` carrying the flex layout utilities `flex flex-col` at every breakpoint: the image stacks above the content, and the content flows vertically in the order image → title → description → CTA. The card SHALL NOT declare `sm:flex-row` nor any other horizontal orientation variant. The card image SHALL span the full width of the card (`w-full`) and SHALL NOT declare `sm:w-2/5`, while keeping the 5:4 aspect ratio (`aspect-[5/4]`) at every breakpoint. The card SHALL have a `bg-secondary` background, a 1px `border` with the `border-secondary-light` token, and an `overflow-hidden` to clip the image cleanly. The card SHALL NOT apply any `shadow*` utility in its static state (flat design — shadows are reserved for floating layers per the style guide).

#### Scenario: Card is a vertical flex column at every breakpoint

- **WHEN** the ServicesSection renders a card
- **THEN** the `<article>` carries the `flex` utility
- **AND** the `<article>` carries `flex-col`
- **AND** the `<article>` does NOT carry `sm:flex-row` (ni `md:flex-row` u otra variante horizontal)

#### Scenario: Card image spans the full card width and keeps the 5:4 ratio

- **WHEN** the ServicesSection renders a card
- **THEN** the card image element carries `w-full`
- **AND** the card image element carries `aspect-[5/4]`
- **AND** the card image element does NOT carry `sm:w-2/5`

#### Scenario: Card content keeps the order image, title, description and CTA

- **WHEN** the ServicesSection renders a card
- **THEN** dentro del `<article>` el orden del DOM es: imagen, `<h4>` del título, `<p>` de la descripción y CTA `<a>`
- **AND** el título queda por debajo de la imagen
- **AND** la descripción queda por debajo del título
- **AND** el CTA queda por debajo de la descripción

#### Scenario: Card uses bg-secondary and border-secondary-light tokens

- **WHEN** the ServicesSection renders a card
- **THEN** the `<article>` carries a class expressing the navy background token `bg-secondary`
- **AND** the `<article>` carries a class expressing a 1px border with the secondary-light token (e.g. `border border-secondary-light`)

#### Scenario: Card does NOT apply a shadow utility

- **WHEN** the ServicesSection renders a card
- **THEN** the `<article>` opening tag does NOT carry any `shadow-*` utility class (no `shadow-1`, `shadow-2`, `shadow-3`, `shadow-4`, `shadow-5`)

#### Scenario: Card clips overflowing content

- **WHEN** the ServicesSection renders a card
- **THEN** the `<article>` carries the `overflow-hidden` utility so the image's square corners meet the flat card edge cleanly

#### Scenario: Vertical cards render correctly at the sm breakpoint

- **WHEN** la home se carga en el viewport `640×800`
- **THEN** cada tarjeta de "Servicios especializados" muestra la imagen a todo el ancho de la tarjeta, con el título, la descripción y el CTA apilados verticalmente debajo
- **AND** la tarjeta conserva la proporción 5:4 de su imagen
- **AND** el texto de cada tarjeta no desborda su tarjeta ni provoca scroll horizontal
