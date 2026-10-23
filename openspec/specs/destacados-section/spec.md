# destacados-section Specification

## Purpose
Sección Destacados del home: bloque plano oscuro (teal/navy) con padding vertical y transición dura de color; header con headline blanco y CTA de acento; grid responsive (mobile-first) de tarjetas blancas elevadas de productos destacados con mat de imagen, título en h4 y CTA outline "Cotizar". Componente presentacional (dumb) que consume solo tokens de diseño canónicos y preserva el outline de headings de la home.
## Requirements

### Requirement: DestacadosSection renders as a flat dark teal section with vertical padding
The `destacados-section` SHALL render a `<section>` as its outermost element carrying vertical padding utilities (`py-16 md:py-24`) and the dark navy background token `bg-secondary-dark` (`--color-secondary-dark: #16202E`). The section SHALL NOT apply negative margin / overlap — it is a flat block with a hard color transition from the deep teal `bg-primary-deep` of `ServicesSection` above (the transition is now teal → navy, both dark, instead of teal → teal as in the archived state). The section SHALL contain a single inner container using the canonical container utilities (`mx-auto px-4 sm:px-6 lg:px-8` and the `max-w-7xl` constraint expressed by the `container` utility). (MODIFIED in `site-favicon-and-bg-swap`: the section background token changes from `bg-primary-deep` (deep teal) to `bg-secondary-dark` (navy) — the token was originally navy for the `services-section` and was swapped as part of the home-page color hierarchy rework; see also the mirrored change in the `services-section` spec. This supersedes the POST-APPLY UPDATE of the original `destacados-section` archive that established `bg-primary-deep` as the section background.)

#### Scenario: Section is the outermost element
- **WHEN** the DestacadosSection renders
- **THEN** the outermost element of the rendered HTML is a `<section>`
- **AND** the `<section>` is NOT nested inside another `<section>` produced by the component itself

#### Scenario: Section carries vertical padding utilities
- **WHEN** the DestacadosSection renders
- **THEN** the `<section>` opening tag carries a class expressing mobile vertical padding (e.g. `py-16`)
- **AND** the `<section>` opening tag carries a class expressing a larger vertical padding at the `md` breakpoint (e.g. `md:py-24`)

#### Scenario: Section uses the dark navy background token
- **WHEN** the DestacadosSection renders
- **THEN** the `<section>` opening tag carries a class expressing the dark navy background token (e.g. `bg-secondary-dark`)
- **AND** the rendered HTML does NOT contain the lighter `bg-bg` utility on the section's outermost element
- **AND** the rendered HTML does NOT contain the `bg-primary-deep` utility on the section's outermost element (the navy is the new background; the deep teal belongs to `ServicesSection` after the swap)

#### Scenario: Section uses the canonical container for inner width
- **WHEN** the DestacadosSection renders
- **THEN** the section contains an inner `<div>` carrying the `container` class (or the equivalent `mx-auto px-4 sm:px-6 lg:px-8` plus `max-w-7xl` constraint)

### Requirement: DestacadosSection renders a header row with white headline and accent CTA
The `destacados-section` SHALL render a header row containing exactly two elements: a `<h3>` headline (the section title, e.g. "Soluciones Destacadas") styled with the white color token (`text-white`) and the heading font token (`font-heading`); and an `<a>` CTA link carrying the solid accent button pattern (background token `bg-accent`, hover darkening `hover:bg-accent-dark`, white text `text-white`, `font-heading font-semibold uppercase text-xs tracking-wide px-6 py-3 transition-colors`). The header row SHALL lay the headline on the left and the CTA on the right at the `sm` breakpoint and above (e.g. `flex flex-col sm:flex-row justify-between items-start sm:items-center`) — the CTA stacks below the headline on mobile. The header SHALL NOT render an eyebrow `<span>` and SHALL NOT render a teal underline `<div>`.

#### Scenario: Headline renders as an h3 with white color and heading font
- **WHEN** the DestacadosSection renders with `headline="Soluciones Destacadas"`
- **THEN** the header contains exactly one `<h3>` element whose visible text equals "Soluciones Destacadas" verbatim
- **AND** the `<h3>` carries a class expressing the white color token (e.g. `text-white`)
- **AND** the `<h3>` carries the `font-heading` utility class
- **AND** the `<h3>` does NOT carry `aria-hidden="true"` or `tabindex="-1"`

#### Scenario: Header CTA links to the cta href with the solid accent pattern
- **WHEN** the DestacadosSection renders with `ctaHref="/productos"` and `ctaText="EXPLORAR CATÁLOGO COMPLETO"`
- **THEN** the header contains an `<a>` element whose `href` attribute equals `"/productos"`
- **AND** the `<a>` visible text equals "EXPLORAR CATÁLOGO COMPLETO" verbatim
- **AND** the `<a>` carries the `bg-accent` class
- **AND** the `<a>` carries the `hover:bg-accent-dark` class
- **AND** the `<a>` carries the `text-white` class
- **AND** the `<a>` carries `font-heading`, `font-semibold`, `uppercase`, `text-xs`, `tracking-wide`, `px-6`, `py-3` utilities

#### Scenario: Header row places CTA on the right at the sm breakpoint
- **WHEN** the DestacadosSection renders
- **THEN** the header row wrapper carries flex utilities (`flex`) with `flex-col` as the mobile default
- **AND** the header row wrapper carries `sm:flex-row` and `justify-between` at the `sm` breakpoint

#### Scenario: Header does NOT render an eyebrow or underline
- **WHEN** the DestacadosSection renders
- **THEN** the header does NOT contain any element whose visible text matches an eyebrow-style uppercase label other than the headline and CTA texts
- **AND** the header does NOT contain a `<div>` carrying both a short horizontal bar utility (e.g. `h-1` and `w-16`) and the teal `bg-primary` background token

### Requirement: La sección muestra los productos destacados del backend con tope visual de 8

La página home (`apps/web/src/pages/index.astro`) SHALL obtener los productos
destacados del backend en el frontmatter durante `astro build` vía la función
`getFeaturedProducts()` de `apps/web/src/lib/api/products.ts`, que consulta
`GET /api/v1/products?destacado=true` (catálogo público: el backend fuerza
`publicado: true` para peticiones anónimas, por lo que no se envía el parámetro
`publicado`). El fetch SHALL seguir el patrón build-time existente de
`getPublicProducts()`: cache a nivel de módulo, degradación a lista vacía si la
API no está disponible (el build NUNCA falla por la sección de destacados) y
respeto de la política fail-fast (`REQUIRE_API=true`, error `SC-env-04`) cuando
está activa.

El frontend SHALL acotar la visualización a un máximo de 8 productos: la lista
recibida del backend SHALL cortarse con un `slice(0, 8)` (o equivalente) en el
frontmatter de la página ANTES de pasar los props a `DestacadosSection`. El
orden de render SHALL ser el orden en que el backend devuelve la lista
(`creadoEn DESC` por defecto, sin reordenado en el frontend). El componente
`DestacadosSection` sigue siendo dumb y NUNCA hace fetch; el límite de 8 es un
límite visual (render) que se aplica aunque el backend devuelva 9 o más
destacados.

#### Scenario: La página obtiene los destacados vía la API con el filtro del backend

- **WHEN** `apps/web/src/pages/index.astro` renderiza el frontmatter en build
- **THEN** los productos pasados a `DestacadosSection` provienen de los que el
  backend marca con la propiedad `destacado: true` (filtro server-side
  `destacado=true` del endpoint)
- **AND** el fetch no reordena la lista: el orden de render es el del backend
- **AND** `DestacadosSection.astro` NO contiene la cadena `fetch(` (sigue dumb)

#### Scenario: El backend devuelve más de 8 destacados y el frontend corta a 8

- **WHEN** `getFeaturedProducts()` retorna 9 o más productos destacados
- **THEN** la home renderiza exactamente 8 tarjetas en `DestacadosSection`
- **AND** las 8 tarjetas son los primeros 8 elementos del array del backend
  (orden `creadoEn DESC` del API), descartando el resto

#### Scenario: El backend devuelve 5 a 8 destacados y todos se renderizan

- **WHEN** `getFeaturedProducts()` retorna N productos con 5 ≤ N ≤ 8
- **THEN** la home renderiza exactamente N tarjetas (ninguna se corta)

#### Scenario: El backend no devuelve destacados y la sección degrada a grid vacía

- **WHEN** `getFeaturedProducts()` retorna 0 productos destacados
- **THEN** la home renderiza la sección con su header (headline + CTA) intacto
- **AND** el grid de tarjetas queda vacío (0 `<article>`) sin llegar a fallar

#### Scenario: La API no disponible en build degrada sin romper el build

- **WHEN** `astro build` corre con la API de productos inalcanzable y
  `REQUIRE_API` no está activado
- **THEN** `getFeaturedProducts()` loggea un warn y retorna `[]`
- **AND** el build termina OK y la sección renderiza con grid vacía

#### Scenario: La política fail-fast del catálogo se respeta

- **WHEN** el build corre con `REQUIRE_API=true` y la API no disponible
- **THEN** `getFeaturedProducts()` rechaza con el error `SC-env-04`
  (fail-fast del catálogo, misma política que `getPublicProducts()`)

### Requirement: Los productos destacados del backend se mapean al modelo de tarjeta de la sección

La página home SHALL mapear cada `ProductoCardApi` destacado del backend al
contrato de tarjeta de la sección (`FeaturedProduct`): `id` desde `id`,
`titulo` desde `titulo`, `slug` desde `slug`, `imageUrl` desde la primera
entrada de la galería (`galeria[0].url`, URL pública de Firebase Storage) y
`imagenAlt` desde `galeria[0].alt` con fallback al `titulo` del producto cuando
la galería no define alt o `galeria` está vacía (`imageUrl: ''` → placeholder
de imagen ausente). El mapeo SHALL ser puro y determinista. El modelo NO SHALL
exponer campos de precio y NO SHALL depender de assets locales de
`assets/img/`.

#### Scenario: Cada destacado se mapea campo a campo

- **WHEN** el backend retorna un destacado con `titulo="Medidor Electromagnético
  Fullmag HA"`, `slug="medidor-electromagnetico-fullmag-ha"` y
  `galeria=[{ url: "https://storage.googleapis.com/…/fullmag.webp", alt: "Foto
  del medidor Fullmag HA sobre fondo blanco" }]`
- **THEN** la tarjeta correspondiente recibe `titulo="Medidor Electromagnético
  Fullmag HA"`, `slug="medidor-electromagnetico-fullmag-ha"`,
  `imageUrl="https://storage.googleapis.com/…/fullmag.webp"` y
  `imagenAlt="Foto del medidor Fullmag HA sobre fondo blanco"`

#### Scenario: Producto sin galería degrada a placeholder sin alt especulativo

- **WHEN** el backend retorna un destacado con `galeria=[]`
- **THEN** la tarjeta recibe `imageUrl=""` y `imagenAlt` igual al `titulo`
- **AND** el área de imagen de la tarjeta muestra el estado de imagen ausente

#### Scenario: El modelo de tarjeta no expone precios ni assets locales

- **WHEN** se inspecciona el modelo de tarjeta derivado de un destacado
- **THEN** no expone `precio`, `price`, `precioVisible` ni `priceVisible`
- **AND** no referencia ningún path de `assets/img/` (solo URLs remotas de Storage)

### Requirement: DestacadosSection renders a responsive card grid of featured products (mobile-first)

The `destacados-section` SHALL render a grid of `products` cards sized responsively mobile-first: 1 column on mobile (`< 640px`), 2 columns at the `sm` breakpoint (`>= 640px`) and 4 columns at the `lg` breakpoint (`>= 1024px`). The grid container SHALL carry the Tailwind utility classes `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` and a consistent gap utility (`gap-6 md:gap-8`). The grid SHALL render exactly N `<article>` cards, where N equals the length of the `products` prop (N ≤ 8 tras el slice de la home). Con N ≥ 5 el flujo grid SHALL acomodar los productos de sobra en una segunda fila automáticamente (4 columnas por fila en desktop, 2 en tablet, 1 en móvil) SIN romper la estética de tarjeta blanca elevada ni requerir clases condicionales (las mismas clases de grilla válidas para N=4, N=5…N=8).

#### Scenario: Card grid uses responsive column classes (mobile-first)

- **WHEN** the DestacadosSection renders with 4 products
- **THEN** the rendered card grid container carries `grid-cols-1` (mobile default)
- **AND** the rendered card grid container carries `sm:grid-cols-2` (two columns at the `sm` breakpoint)
- **AND** the rendered card grid container carries `lg:grid-cols-4` (four columns at the `lg` breakpoint)
- **AND** the rendered card grid container carries a gap utility (e.g. `gap-6 md:gap-8`)

#### Scenario: Grid renders exactly N cards matching the products prop length

- **WHEN** the DestacadosSection renders with `products` of length N (N de 0 a 8)
- **THEN** the card grid contains exactly N `<article>` elements
- **AND** each `<article>` contains the image, title and CTA elements described in the per-card requirements

#### Scenario: Grid fluye a segunda fila con 5 a 8 productos (desktop 4 cols)

- **WHEN** the DestacadosSection renders con 8 productos en un viewport `lg` (≥ 1024px)
- **THEN** la grilla coloca 4 tarjetas en la primera fila y 4 en la segunda, automáticamente
- **AND** las tarjetas de la segunda fila tienen la misma estética (misma clase `article`, misma estructura de image mat + h4 + CTA) que las de la primera
- **AND** no se renderiza ninguna regla condicional de fila en el HTML: la grilla fluye por la auto-placement de CSS Grid (las únicas clases de grilla son `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` con `gap-6 md:gap-8`)

#### Scenario: Grid fluye a dos filas con 8 productos (tablet 2 cols)

- **WHEN** the DestacadosSection renders con 8 productos en un viewport `sm` (≥ 640px y < 1024px)
- **THEN** la grilla coloca 2 tarjetas por fila en 4 filas automáticamente
- **AND** en mobile (< 640px) la grilla apila 1 tarjeta por fila en 8 filas sin overflow horizontal

### Requirement: Each DestacadosSection card is a white raised card with image mat, title and CTA

Each card SHALL be an `<article>` carrying a white background token (`bg-white`), a flat-design floating shadow (`shadow-2`) with a hover elevation (`hover:shadow-4`), and a `transition-shadow` utility. The card SHALL contain: (a) an image mat area — a `<div>` with padding (e.g. `p-4`) wrapping the card's image element with `object-contain` and a square aspect; (b) a content area with the `<h4>` title and the "Ver detalles" CTA. The card SHALL NOT contain any price element (no `$` formatted text, no price paragraph).

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

### Requirement: Each DestacadosSection card image is a lazy-loaded remote Storage image, object-contain, with a descriptive alt

Each card SHALL contain a `<img>` element (NOT processed by `astro:assets` — la imagen del producto del panel es una URL pública remota de Firebase Storage que el pipeline local no hash-ea) carrying: `loading="lazy"` (la sección está bajo el primer fold); un atributo `alt` descriptivo NO vacío igual al `imagenAlt` prop del producto (derivado de `galeria[0].alt` con fallback al `titulo`); y `object-contain` con aspecto cuadrado (e.g. `aspect-square`) para que los shots de producto no se recorten. La `src` SHALL ser la URL remota del modelo (`imageUrl`, p. ej. `https://storage.googleapis.com/...`) y NO SHALL usar un recurso estático local `apps/web/src/assets/img/...`. La imagen NO SHALL llevar ninguna utility `rounded-*` (flat design). Cuando `imageUrl` está vacía el "mat" SHALL renderizarse vacío (sin `<img>` y sin svg placeholder), reservando el aspecto cuadrado para no romper la altura de la tarjeta.

#### Scenario: Each card image uses lazy loading

- **WHEN** the DestacadosSection renders a card con producto con `imageUrl` no vacía
- **THEN** the card's image element carries `loading="lazy"`

#### Scenario: Each card image carries a non-empty descriptive alt

- **WHEN** the DestacadosSection renders una tarjeta con `imagenAlt="Bidón azul de antiincrustante Bimaks 420 para ósmosis inversa"`
- **THEN** the card's image element carries an `alt` attribute equal to the `imagenAlt` prop value
- **AND** the `alt` value is non-empty

#### Scenario: La imagen hace referencia a la URL remota de Storage (no a un asset local)

- **WHEN** the DestacadosSection renders una tarjeta con producto con `galeria[0].url` pública de Firebase Storage
- **THEN** el `<img>` lleva una `src` `https://` de Storage igual al `imageUrl` del modelo
- **AND** el `<img>` NO lleva una `src` que resuelva a un path `apps/web/src/assets/img/...` ni un path hash `/_astro/...`

#### Scenario: El mat de imagen queda reservado cuando el producto no tiene imagen

- **WHEN** the DestacadosSection renders una tarjeta con `imageUrl=""`
- **THEN** el mat de imagen renderiza el `<div>` con padding (e.g. `p-4`) con el aspecto cuadrado
- **AND** el mat NO renderiza ningún `<img>` ni ningún `<svg>` de placeholder

### Requirement: Each DestacadosSection card title renders as an h4
Each card SHALL render its product title as an `<h4>` element (subordinate to the section `<h3>`), carrying the `font-heading` utility and the navy text token (`text-secondary`), with a text clamp (e.g. `line-clamp-3`) and a minimum height reservation (e.g. `min-h-[4.5rem]`) so cards stay equal-height. The `<h4>` visible text SHALL equal the product's `titulo` prop value verbatim.

#### Scenario: Each card title renders as an h4 with the secondary color token
- **WHEN** the DestacadosSection renders a card with `titulo="Flujómetro Universal"`
- **THEN** the card contains an `<h4>` element whose visible text equals "Flujómetro Universal" verbatim
- **AND** the `<h4>` carries a class expressing the navy secondary color token (e.g. `text-secondary`)
- **AND** the `<h4>` carries the `font-heading` utility class

#### Scenario: Long product titles render fully and clamp after three lines
- **WHEN** the DestacadosSection renders a card with `titulo="MWN – MEDIDOR INDUSTRIAL PARA AGUA FRÍA LIMPIA – MEDIDOR TIPO WOLTMAN"`
- **THEN** the card `<h4>` visible text starts with "MWN – MEDIDOR INDUSTRIAL PARA AGUA FRÍA LIMPIA – MEDIDOR TIPO WOLTMAN" verbatim
- **AND** the `<h4>` carries the `line-clamp-3` utility

### Requirement: Each DestacadosSection card CTA renders as the outline primary "Cotizar" button
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

### Requirement: DestacadosSection is a dumb presentational component
The `destacados-section` SHALL be a dumb component: it SHALL NOT perform any data fetching (no `fetch`, no Firestore calls), SHALL NOT read `import.meta.env` directly, and SHALL NOT hold reactive state. All data (`headline`, `ctaText`, `ctaHref`, `products` array) SHALL be received through typed props spread by the consuming page (`apps/web/src/pages/index.astro`).

#### Scenario: Component renders in isolation with all required props
- **WHEN** the DestacadosSection is rendered via `AstroContainer.renderToString` with a complete `DestacadosSectionProps` object containing 4 products
- **THEN** the rendered HTML contains the header row (headline + CTA), exactly 4 cards, and no price text
- **AND** the rendered HTML references the `headline`, `ctaText`, and product `titulo` texts provided in the props

#### Scenario: Component frontmatter contains no import.meta.env or fetch access
- **WHEN** the source file `apps/web/src/components/DestacadosSection.astro` is inspected
- **THEN** the frontmatter (between `---` fences) does NOT contain the literal string `import.meta.env`
- **AND** the frontmatter does NOT contain the literal string `fetch(`

### Requirement: DestacadosSection consumes only canonical design tokens
The `destacados-section` SHALL consume design tokens declared in `apps/web/src/styles/globals.css` (`bg-primary-deep`, `bg-white`, `text-white`, `text-secondary`, `bg-accent`, `hover:bg-accent-dark`, `border-primary`, `text-primary`, `hover:bg-primary`, `font-heading`, `shadow-2`, `hover:shadow-4`) (POST-APPLY UPDATE: `bg-primary-deep` replaces `bg-secondary-dark` as the section background). The component SHALL NOT use literal hex color values (e.g. `#41B3C4`, `#16202E`) anywhere in its markup or class attributes. The component SHALL NOT use the deprecated `brand-*` tokens (e.g. `bg-brand-teal`, `text-brand-navy`). The component SHALL NOT use any `rounded-*` utility (flat design — `--radius: 0`).

#### Scenario: No literal hex color values in the rendered HTML
- **WHEN** the DestacadosSection renders
- **THEN** the rendered HTML does NOT contain any substring matching the regex `/#[0-9a-fA-F]{3,8}/`

#### Scenario: No deprecated brand-* tokens in the rendered HTML
- **WHEN** the DestacadosSection renders
- **THEN** the rendered HTML does NOT contain any substring matching the regex `/brand-(teal|navy|orange|gray)/`

#### Scenario: No rounded-* utilities in the rendered HTML
- **WHEN** the DestacadosSection renders
- **THEN** the rendered HTML does NOT contain any substring matching the regex `/rounded\b/` (the flat-design rule — `--radius: 0`)

### Requirement: DestacadosSection preserves the home page heading outline
The `destacados-section` SHALL render its headline as `<h3>` (NOT `<h1>` and NOT `<h2>`), since the home page already has a single `<h1>` (owned by HeroBanner) and a single `<h2>` (owned by PanelHome). Each product title SHALL be rendered as `<h4>`, subordinate to the section `<h3>`. The component SHALL NOT introduce any new `<h1>` or `<h2>` elements. After this change, the home page SHALL contain exactly three `<h3>` elements: one owned by `SolutionSection`, one owned by `ServicesSection` and one owned by `DestacadosSection` (sibling portfolio sections).

#### Scenario: Heading counts after rendering the section in isolation
- **WHEN** the DestacadosSection renders in isolation (no other components present)
- **THEN** the rendered HTML contains exactly one `<h3>` (the section headline)
- **AND** the rendered HTML contains exactly N `<h4>` elements, where N equals the length of `products` prop
- **AND** the rendered HTML contains zero `<h1>` elements
- **AND** the rendered HTML contains zero `<h2>` elements

#### Scenario: Headline is reachable via assistive technology (not aria-hidden)
- **WHEN** the DestacadosSection renders
- **THEN** the `<h3>` headline element does NOT carry `aria-hidden="true"`
- **AND** the `<h3>` headline element does NOT carry `tabindex="-1"`

### Requirement: DestacadosSection renders no icons

La sección SHALL NO renderizar ningún icono: el mockup de "Soluciones
Destacadas" no tiene iconos, por lo que el componente NO SHALL importar ni usar
`astro-icon` ni iconos de ningún set, y el HTML renderizado NO SHALL contener
ningún `<svg>` de icono. (El placeholder de imagen ausente de la grilla del
catálogo usa `lucide:image-off`; en esta sección el estado de imagen ausente
SHALL implementarse SIN icono, p. ej. un mat vacío, para no introducir
`astro-icon` — ver design.md § Decision 5).

#### Scenario: La sección no renderiza iconos

- **WHEN** DestacadosSection renderiza
- **THEN** el HTML renderizado NO contiene ningún `<svg>` (sin `lucide:` ni
  otro set de iconos)

### Requirement: DestacadosSection integrates into the home page after ServicesSection

The `apps/web/src/pages/index.astro` SHALL render, in order inside the `<Layout>` slot: `<HeroBanner {...HERO_BANNER_CONTENT} />`, then `<PanelHome {...PANEL_HOME_CONTENT} />`, then `<SolutionSection {...SOLUTION_SECTION_CONTENT} />`, then `<ServicesSection {...SERVICES_SECTION_CONTENT} />`, then `<DestacadosSection products={featured} ... />`, donde `featured` son los productos destacados del backend mapeados y cortados a 8 en el frontmatter (headlines, `ctaText`, `ctaHref` siguen viniendo de la copia `DESTACADOS_SECTION_CONTENT` del config). The `DestacadosSection` SHALL NOT replace any existing component; all five render on the home page in the documented order. El outline de headings es dinámico: la página SHALL contener exactamente 1 `<h1>`, 2 `<h2>`, 3 `<h3>` y `8 + N` `<h4>`, donde N es la cantidad de destacados visibles (0 ≤ N ≤ 8) y el base 8 corresponde a PilaresSection/NosotrosTeamSection.

#### Scenario: Home page renders DestacadosSection after ServicesSection

- **WHEN** a visitor loads `/` (the home page)
- **THEN** the rendered HTML contains the DestacadosSection `<section>` (with the "Soluciones Destacadas" `<h3>` headline y hasta 8 `<h4>` de producto)
- **AND** the DestacadosSection `<section>` appears in the DOM AFTER the ServicesSection `<section>`
- **AND** no price text (no `$-prefixed` numbers) appears inside the DestacadosSection `<section>`

#### Scenario: DOM order is preserved: hero → panel → solutions → services → destacados

- **WHEN** the home page renders
- **THEN** the rendered HTML keeps the existing order: the HeroBanner `<section>`, then the PanelHome `<section>`, then the SolutionSection `<section>`, then the ServicesSection `<section>`, then the DestacadosSection `<section>`
- **AND** the page outline is exactly 1 `<h1>`, 2 `<h2>`, 3 `<h3>` and `8 + N` `<h4>` (con N destacados visibles; por defecto N=0 en un build sin backend)
- **AND** the DestacadosSection introduces no new content landmark: its outermost element is a `<section>` and the component emits no `<header>` element (the page keeps the pre-existing headers owned by the Layout/Header components)

#### Scenario: DestacadosSection does not modify the other sections' rendered HTML

- **WHEN** the home page renders with all five components
- **THEN** the HeroBanner `<section>` carries the same set of classes and content it would carry when rendered alone
- **AND** the PanelHome `<section>` carries the same set of classes and content it would carry when rendered alone
- **AND** the SolutionSection `<section>` carries the same set of classes and content it would carry when rendered alone
- **AND** the ServicesSection `<section>` carries the same set of classes and content it would carry when rendered alone
