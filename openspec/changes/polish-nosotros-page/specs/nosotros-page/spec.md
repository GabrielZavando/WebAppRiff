# nosotros-page Specification (delta)

## ADDED Requirements

### Requirement: Page background uses the light surface token behind white content cards

La página `/nosotros` SHALL usar el token de fondo de página `bg-surface-muted` como superficie base de las secciones de contenido claras, en lugar de blanco puro. Las secciones `NosotrosTimeline`, `NosotrosValueProp`, `NosotrosIdentity` y `NosotrosTeamGrid` SHALL renderizar sobre `bg-surface-muted`; las tarjetas de contenido (pilares, sectores, hitos y tarjetas de equipo) SHALL conservar `bg-white` cuando el contraste lo requiera, de modo que el fondo grisáceo se distinga sutilmente de las tarjetas blancas. El hero y la banda de clientes conservan sus fondos oscuros de marca.

#### Scenario: SC-213 — Fondo de página grisáceo con tarjetas blancas

- **WHEN** la página `/nosotros` renderiza
- **THEN** las secciones de contenido claras usan el token `bg-surface-muted` y ninguna usa `bg-white` como fondo de sección
- **AND** las tarjetas de contenido conservan `bg-white` (o su token de superficie equivalente) para contrastar con el fondo
- **AND** el fondo no usa literales hex ni valores fuera de los design tokens del proyecto

### Requirement: Timeline markers are uniform and the central rail is removed

La timeline de `/nosotros` SHALL renderizar los cuatro marcadores numéricos (01, 02, 03 y 04) con el mismo color de fondo (`bg-primary-deep`) y texto blanco, sin alternancia de tono entre marcadores pares e impares. La sección NO SHALL renderizar la línea vertical central que atraviesa los marcadores. El marcador de estrella del último hito SHALL conservar su color original `bg-accent` con icono blanco y NO SHALL estar atravesado por ninguna línea vertical. Los marcadores SHALL seguir siendo exclusivos de escritorio (`hidden lg:flex`).

#### Scenario: SC-214 — Marcadores uniformes sin línea central

- **WHEN** la timeline renderiza
- **THEN** los marcadores 01, 02, 03 y 04 comparten la misma clase de fondo `bg-primary-deep` y el mismo color de texto
- **AND** no existe ningún elemento que dibuje una línea vertical central entre tarjetas y marcadores
- **AND** la estrella del último hito conserva el fondo `bg-accent` y el icono blanco
- **AND** los marcadores numéricos y la estrella están ocultos fuera de escritorio (`hidden lg:flex`)

## MODIFIED Requirements

### Requirement: Institutional hero renders the "SOMOS RIFF" headline with two CTAs

La sección hero del `/nosotros` SHALL renderizar el `<h1>` "SOMOS RIFF" (con "RIFF" resaltado en color de marca), el subtítulo "Más de 40 años innovando en la medición, control de fluidos y tratamiento de agua.", el párrafo de presentación institucional (copy verbatim de la referencia), un eyebrow/insignia "IDENTIDAD & TRAYECTORIA CORPORATIVA" con icono decorativo, y dos CTA: "SOLICITAR ASESORÍA TÉCNICA" (→ `/contacto`) y "CONOCER NUESTRA HISTORIA" (→ `#historia`). El fondo del hero SHALL ser `bg-secondary` y SHALL reutilizar exactamente el mismo patrón visual de rejilla técnica del hero de `/representaciones` (rejilla de líneas basada en tokens, decorativa y `aria-hidden`), sin degradados claros ni SVG ad-hoc. La sección SHALL usar tokens del proyecto y una imagen técnica con `alt` no vacío, sin hex literales.

#### Scenario: SC-201 — Hero con h1, copy y CTAs

- **WHEN** la sección hero renderiza
- **THEN** existe exactamente un `<h1>` en la página y su texto contiene "SOMOS" y "RIFF"
- **AND** se renderiza el subtítulo "Más de 40 años innovando en la medición, control de fluidos y tratamiento de agua."
- **AND** se renderiza el eyebrow "IDENTIDAD & TRAYECTORIA CORPORATIVA"
- **AND** existe un ancla cuyo texto visible contiene "SOLICITAR ASESORÍA TÉCNICA" y cuyo `href` es `/contacto`
- **AND** existe un ancla cuyo texto visible contiene "CONOCER NUESTRA HISTORIA" y cuyo `href` es `#historia`

#### Scenario: SC-202 — Imagen técnica del hero con alt no vacío

- **WHEN** la sección hero renderiza
- **THEN** se renderiza una imagen técnica representativa (placeholder local, no una URL externa)
- **AND** la imagen tiene un atributo `alt` no vacío

#### Scenario: Hero shares the representaciones background pattern

- **WHEN** el hero de `/nosotros` renderiza
- **THEN** el contenedor de la sección lleva `bg-secondary`
- **AND** el patrón de rejilla técnica es el mismo que usa `RepresentacionesHero.astro` (misma técnica CSS basada en tokens, sin SVG inline ad-hoc)
- **AND** el patrón es decorativo (`aria-hidden="true"`) y el hero no renderiza el degradado claro `from-secondary via-bg to-secondary`

### Requirement: Sections use the project design tokens (no hex, no rounded)

Los componentes del `/nosotros` SHALL usar exclusivamente las utilities generadas desde los tokens `@theme` del proyecto (`bg-secondary`, `bg-primary-deep`, `bg-accent`, `text-text`, `text-text-2`, `bg-surface-muted`, `bg-white`, `bg-primary-100`, `border-border`, `shadow-1..3`, `font-heading`, `font-body`, …) y SHALL usar el catálogo de iconos Lucide; no SHALL contener literales hex en `class` ni clases `rounded*` (flat design con radio 0). El fondo base de la página SHALL ser `bg-surface-muted`, reservando `bg-white` para las tarjetas y superficies de contenido.

#### Scenario: SC-210 — Sin hex ni rounded*

- **WHEN** los componentes de `/nosotros` renderizan
- **THEN** ninguna `class` contiene un literal hex (`#` seguido de valores hex)
- **AND** ninguna `class` contiene `rounded`
- **AND** los fondos/textos de marca usan tokens (p. ej. el hero usa `bg-secondary`, los CTA naranja usan `bg-accent`)
- **AND** el fondo base de la página usa `bg-surface-muted` y las tarjetas de contenido usan `bg-white`

### Requirement: Sections adapt to mobile, tablet and desktop

Cada sección del `/nosotros` SHALL ser responsive mobile-first: en viewport angosto los grids colapsan a una columna, los badges numéricos y la estrella de la timeline solo aparecen en desktop, la misión/visión se apilan, las tarjetas de equipo pasan de 1 → 2 → 4 columnas y los CTAs del banner final ocupan el ancho disponible en móvil. El carrusel de clientes SHALL mantener una altura estable y recortar el desborde horizontal (viewport con `overflow-hidden`). Ninguna sección SHALL desbordar horizontalmente en viewport angosto.

#### Scenario: SC-211 — Colapsos responsive

- **WHEN** los componentes de `/nosotros` renderizan
- **THEN** los grids de pilares, sectores y equipo declaran columnas base en móvil con incremento en breakpoints mayores (p. ej. `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`)
- **AND** el carrusel de clientes declara un viewport con `overflow-hidden` y no genera scroll horizontal en la página
- **AND** los badges numéricos y la estrella de la timeline están ocultos fuera de desktop (clases `hidden lg:*`)
- **AND** la sección de misión/visión colapsa a una columna en móvil
- **AND** el contenido está contenido en el contenedor de página (sin elementos full-bleed que desborden)
