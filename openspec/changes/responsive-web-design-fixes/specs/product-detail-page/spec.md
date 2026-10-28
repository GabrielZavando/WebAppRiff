# product-detail-page Specification

## MODIFIED Requirements

### Requirement: Product detail page layout (mobile-first, user-defined)

The page SHALL render a `<Layout>` with the product title and description as meta tags. The main content SHALL be structured in three sections:

1. **Hero Section**: Image gallery + product info (category, title, description, specifications, CTAs)
2. **Industrial Applications Section**: Static marketing content (3 cards)
3. **Technical Documentation Section**: Downloadable PDFs (if available)

The layout SHALL be mobile-first: single column on mobile, two-column grid on `md+` for the hero section. The product title (`<h1>`) SHALL use a responsive font scale — a reduced base size on mobile (e.g. `text-3xl`) scaling to the large size from `md` (`md:text-5xl`) — instead of a fixed `text-5xl` size at every width, and SHALL apply a word-breaking utility (`break-words` or equivalent) so that long product titles never force horizontal overflow. (MODIFIED in `responsive-web-design-fixes` — el título deja de usar `text-5xl` fijo.)

#### Scenario: Mobile layout
- **WHEN** the viewport is `<768px`
- **THEN** the hero section renders image gallery on top, product info below (single column)
- **AND** the industrial applications section renders cards in a single column

#### Scenario: Desktop layout
- **WHEN** the viewport is `≥768px`
- **THEN** the hero section renders image gallery on the left, product info on the right (two-column grid)
- **AND** the industrial applications section renders cards in a 3-column grid

#### Scenario: El título escala con el viewport
- **WHEN** el viewport es `<768px`
- **THEN** el `<h1>` del producto declara un tamaño base menor que `text-5xl` (por ejemplo `text-3xl`)
- **AND** declara una variante `md:` que recupera el tamaño `text-5xl`

#### Scenario: El título no desborda
- **WHEN** el detalle de producto se renderiza en los viewports `320×568` y `375×667`
- **THEN** el `boundingBox` del `<h1>` queda dentro del `boundingBox` de su columna
- **AND** `document.documentElement.scrollWidth` no supera `document.documentElement.clientWidth + 1`

### Requirement: Product info section

El sistema SHALL render la información del producto en este orden vertical exacto:

1. **Chip de categoría** con el nombre de la categoría resuelto server-side.
2. **Título** (`titulo`) como encabezado `<h1>`.
3. **Descripción breve** (`descripcionBreve`) como párrafo.
4. **Caja de especificaciones** con los `atributos` del producto renderizados como una grilla de pares icono+etiqueta.
5. **Fila de CTAs** con dos botones:
   - "SOLICITAR COTIZACIÓN" → `/cotizacion?producto={slug}` (tratamiento visual primario).
   - "CONTACTAR ASESOR" → `/contacto` (tratamiento visual secundario).

El chip de categoría SHALL omitirse cuando la categoría no se encuentra (p.ej. `sin-categoria`).

(MODIFIED en este change: la CTA "CONTACTAR ASESOR" pasa de `mailto:contacto@somosriff.cl` a navegar a `/contacto`.) (MODIFIED en `responsive-web-design-fixes`: el `<h1>` del título SHALL aplicar una escala tipográfica responsiva y `break-words` para no desbordar en viewports estrechos.)

#### Scenario: Full product info

- **WHEN** el producto tiene `titulo="Medidor Ultrasónico"`, `categoriaId="cat-fluidos"`, `descripcionBreve="..."` y `atributos=[{nombre:"Precisión", valor:"±2%"}]`
- **THEN** el HTML renderizado contiene:
  1. El chip de categoría "MEDICIÓN DE FLUIDOS"
  2. Un `<h1>` con "Medidor Ultrasónico"
  3. El párrafo de descripción breve
  4. Una caja de especificaciones con "Precisión: ±2%"
  5. Dos botones CTA con los href correctos

#### Scenario: Category not found

- **WHEN** el producto tiene `categoriaId="sin-categoria"` y la lista de categorías no la contiene
- **THEN** el chip de categoría se omite
- **AND** el resto de la información se renderiza con normalidad

#### Scenario: Contact advisor CTA uses the somosriff.cl mailto

(MODIFIED en este change: la CTA "CONTACTAR ASESOR" pasa de `mailto:contacto@somosriff.cl` a navegar a `/contacto`. La variante mailto sigue disponible vía la ContactBar del propio `/contacto`.)

- **WHEN** la página de detalle de producto renderiza con un producto
- **THEN** el HTML renderizado contiene un anchor con `href="/contacto"` para la CTA "CONTACTAR ASESOR"
- **AND** el HTML renderizado NO contiene `href="mailto:contacto@somosriff.cl"` ni `href="mailto:contacto@riff.cl"` para esa CTA

#### Scenario: Título largo contenido en su columna

- **WHEN** el producto tiene un `titulo` largo sin espacios (por ejemplo "ElectromagnéticoIndustrialCompacto")
- **AND** la página se renderiza en el viewport `320×568`
- **THEN** el `<h1>` no desborda el ancho de su columna de información
- **AND** el texto queda visible completo dentro del viewport
