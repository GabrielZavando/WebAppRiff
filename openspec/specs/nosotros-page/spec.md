# nosotros-page Specification

## Purpose
Página Nosotros del sitio público: se renderiza únicamente con el chrome compartido (header y footer).
## Requirements
### Requirement: Page renders shared chrome plus the institutional content in main

The site SHALL serve a static page at `/nosotros` that renders the site's shared chrome (Header and Footer, per the standard `Layout.astro`) plus, inside `<main aria-label="Contenido de Nosotros">`, the institutional content described by the requirements below (hero, historia, propuesta de valor, misión/visión, equipo, clientes y CTA final). The page SHALL keep passing `hero={false}` and `showSearch={false}` to `Layout`: no full-bleed hero background image and no global search form. A GET request to `/nosotros` SHALL respond with HTTP 200. (ADDED in `header-scroll-restore` as "Page renders with only the shared header and footer chrome"; REMOVED+re-ADDED in `nosotros-page` — el `<main>` deja de estar vacío y pasa a contener las 6 secciones institucionales.)

#### Scenario: SC-108 — /nosotros responds and renders header and footer

- **WHEN** a GET request is made to `/nosotros`
- **THEN** the server responds with HTTP 200
- **AND** the page contains exactly one `<header>` landmark (the site Header)
- **AND** the page contains the site `<footer>`

#### Scenario: SC-109 — Main content renders the six institutional sections

- **WHEN** the `/nosotros` page renders
- **THEN** the `<main aria-label="Contenido de Nosotros">` slot contains content (it is not empty)
- **AND** the main content includes the six sections: institutional hero, historical timeline, value proposition, mission & vision, team, and clients + closing CTA (SC-201 … SC-206)
- **AND** the global search form is not rendered (`showSearch` false)
- **AND** no hero background image renders (`hero={false}` — no `banner_home.webp` full-bleed shell)

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

### Requirement: Historical timeline renders the four approved milestones under #historia

La sección de línea de tiempo SHALL llevar el `id="historia"` y renderizar exactamente 4 hitos en orden cronológico con el copy verbatim aprobado por el cliente (2026-10-24) — 1979 (título "Nuestro Origen", tone `primary`, badge "AÑO 1979"), 2013 (título "Nace Aguapur Medición", tone `primary`, badge "AÑO 2013"), 2018 (título "El Nacimiento de RIFF", tone `accent`, badge "AÑO 2018") y Diciembre 2024 (título "La Evolución hacia RIFF", tone `dark`, badge "DICIEMBRE 2024") — conservando el diseño y la estructura de tarjetas (badge, `<h3>`, párrafo, nota lateral, marcadores 01..03 + ★ en el último, alternancia de posiciones por índice). Las notas laterales SHALL conservarse ("Hito Clave" 1979, "Hito de Especialización" 2013, "Salto Tecnológico" 2018, "Capacidad Actual" Dic-2024). El resaltado `<strong>` del hito 2024 SHALL apuntar a la subcadena "RIFF". El encabezado de sección y el ancla del hero "CONOCER NUESTRA HISTORIA" (`href="#historia"`) SHALL conservarse sin cambios.

#### Scenario: Timeline renders exactly four milestones in chronological order

- **WHEN** la sección de historia renderiza
- **THEN** existe un elemento con `id="historia"`
- **AND** se renderizan exactamente 4 hitos con los años/badges "AÑO 1979", "AÑO 2013", "AÑO 2018" y "DICIEMBRE 2024"
- **AND** los títulos `<h3>` son, en orden, "Nuestro Origen", "Nace Aguapur Medición", "El Nacimiento de RIFF" y "La Evolución hacia RIFF"
- **AND** ningún hito muestra el texto "Consolidación & Continuidad Familiar" ni el badge "AÑO 2012"

#### Scenario: 1979 milestone renders the approved copy verbatim

- **WHEN** el hito 1979 renderiza
- **THEN** su párrafo contiene, verbatim, el texto aprobado que comienza "En 1979, comienza nuestra historia con la creación de Aguas Purificadas Ltda., fundada por el Sr. Patricio Barrientos Morales."
- **AND** menciona el legado de 2012 ("el legado continuó en 2012 con la siguiente generación: sus hijos")
- **AND** conserva la nota lateral con label "Hito Clave"

#### Scenario: 2013 and 2018 milestones render the approved copy verbatim

- **WHEN** los hitos 2013 y 2018 renderizan
- **THEN** el hito 2013 contiene el texto que comienza "En 2013, Ruby Barrientos Periale, la única hija del Sr. Patricio Barrientos, junto a su esposo Felipe Román Araya, fundó Aguapur Medición."
- **AND** el hito 2018 contiene el texto que comienza "En 2018, RIFF nace como una línea de negocio dentro de Aguapur Medición, enfocada en la fabricación y comercialización de flujómetros."
- **AND** conservan sus notas laterales "Hito de Especialización" y "Salto Tecnológico" respectivamente

#### Scenario: December 2024 milestone renders the approved copy with the RIFF highlight and a two-item list

- **WHEN** el hito Diciembre 2024 renderiza
- **THEN** su párrafo contiene, verbatim, el texto aprobado que comienza "En diciembre de 2024, damos un paso significativo en nuestra trayectoria con la transformación de Aguapur Medición en RIFF." y termina exactamente en "expandimos nuestra oferta para incluir:"
- **AND** el párrafo va seguido de una lista con viñetas de exactamente 2 ítems: "Equipos y Suministros para Tratamiento de Agua." y "Desarrollo de Productos Químicos."
- **AND** el párrafo posterior "En RIFF, contamos con un equipo de profesionales con más de 30 años..." SHALL NOT aparecer en el timeline (se reubica en la sección de propuesta de valor)
- **AND** la subcadena "RIFF" del párrafo se renderiza dentro de un `<strong>` (tarjeta oscura con resaltado, igual que el diseño anterior)
- **AND** conserva la nota lateral con label "Capacidad Actual"

#### Scenario: Timeline structure, markers and anchor are preserved

- **WHEN** la sección de historia renderiza con los nuevos hitos
- **THEN** el ancla del hero "CONOCER NUESTRA HISTORIA" sigue apuntando a `href="#historia"`
- **AND** los marcadores numéricos de escritorio son 01, 02, 03 y la estrella (★/lucide:star) en el último hito
- **AND** las tarjetas conservan sus tonos (`primary`, `primary`, `accent`, `dark`), la alternancia de posiciones por índice y el encabezado de sección sin cambios

### Requirement: Value proposition renders four pillars and four industry sectors

La sección de propuesta de valor SHALL renderizar el encabezado con el título "¿Qué nos define?" (renombrado desde "Nuestra Propuesta de Valor") y como párrafo introductorio el cuerpo verbatim "En RIFF, contamos con un equipo de profesionales con más de 30 años de experiencia en la industria. Esto nos permite ofrecer a nuestros clientes las mejores soluciones técnicas, respaldadas por equipos y materiales de empresas líderes globales, representadas en exclusiva por nosotros en Chile. Nuestra calidad nos ha permitido captar y mantener como clientes a una parte importante de las principales compañías industriales del país, incluidas las de los sectores minero, alimenticio y rural. Estas industrias se benefician constantemente de la durabilidad, eficiencia y calidad de los productos que suministramos, así como de nuestro servicio de postventa, que forma parte integral de nuestra propuesta de valor." (reemplaza al intro anterior "Más de tres décadas acumuladas de know-how hidrométrico…"); los 4 pilares — Durabilidad Extrema, Precisión Certificada, Eficiencia Hídrica, Servicio In-Situ — cada uno con icono Lucide decorativo, título, descripción y nota al pie de la referencia; y el bloque "Presencia Sólida en Industrias Críticas" con las 4 tarjetas de sector — Gran Minería & Pulpa, Alimentos & Bebidas, Redes Rurales (APR), Edificación & Inmobiliario — cada una con número "SECTOR 0x", descripción verbatim e icono Lucide decorativo.

#### Scenario: SC-204 — 4 pilares y 4 sectores

- **WHEN** la sección de propuesta de valor renderiza
- **THEN** se renderizan los títulos "Durabilidad Extrema", "Precisión Certificada", "Eficiencia Hídrica" y "Servicio In-Situ"
- **AND** cada pilar muestra su descripción de la referencia (p. ej. "Componentes de fundición dúctil…")
- **AND** se renderizan los títulos "Gran Minería & Pulpa", "Alimentos & Bebidas", "Redes Rurales (APR)" y "Edificación & Inmobiliario"
- **AND** las tarjetas de sector muestran los sellos "SECTOR 01" … "SECTOR 04" y su descripción verbatim
- **AND** los iconos de pilares y sectores se resuelven vía el set Lucide (`lucide:`) y son decorativos (`aria-hidden="true"`)

#### Scenario: Renamed section header with the relocated intro paragraph

- **WHEN** la sección de propuesta de valor renderiza en `/nosotros`
- **THEN** el `<h2>` de la sección muestra exactamente "¿Qué nos define?"
- **AND** el párrafo introductorio es el cuerpo verbatim que comienza "En RIFF, contamos con un equipo de profesionales con más de 30 años de experiencia en la industria."
- **AND** el intro anterior "Más de tres décadas acumuladas de know-how hidrométrico…" ya no se renderiza
- **AND** ese párrafo no aparece en ninguna tarjeta del timeline (vive exclusivamente en esta sección)

### Requirement: Mission and vision render as two adjacent blocks

La sección de identidad corporativa SHALL renderizar dos bloques lado a lado (apilados en móvil): **MISIÓN** (eyebrow "PRINCIPIO FUNDAMENTAL", cita "Suministrar soluciones integrales…", párrafo complementario y nota "Compromiso inquebrantable con la trazabilidad y la honestidad técnica.") y **VISIÓN** (eyebrow "PROYECCIÓN DE FUTURO", cita "Ser líderes en el suministro de equipos…", párrafo complementario y nota "Sostenibilidad hídrica como pilar de ingeniería hacia 2030."), con el copy verbatim, un bloque sobre fondo claro y el otro sobre fondo oscuro (tokens del proyecto) e iconos Lucide decorativos.

#### Scenario: SC-205 — Bloques de misión y visión

- **WHEN** la sección de identidad corporativa renderiza
- **THEN** existen los encabezados "MISIÓN" y "VISIÓN"
- **AND** el bloque de Misión muestra la cita que comienza "Suministrar soluciones integrales" y la nota "Compromiso inquebrantable con la trazabilidad y la honestidad técnica."
- **AND** el bloque de Visión muestra la cita que comienza "Ser líderes en el suministro de equipos" y la nota "Sostenibilidad hídrica como pilar de ingeniería hacia 2030."
- **AND** los eyebrows "PRINCIPIO FUNDAMENTAL" y "PROYECCIÓN DE FUTURO" están presentes

### Requirement: Team section renders the eight team member cards

La sección de equipo SHALL renderizar el encabezado "Equipo RIFF — Liderazgo & Experiencia" con su copy verbatim y el badge de acreditación "+100 años de experiencia combinada en terreno", y exactamente 8 tarjetas en el orden canónico definido por `TEAM_MEMBERS` de la capability `team-roster`: Ruby Barrientos, Felipe Román, Patricio Barrientos, Francisco Mehech, Eric Pérez, Loredana Quiroga, Francys Padra y Melany Bravo.

Cada tarjeta SHALL renderizar únicamente: la foto del integrante en proporción 3:4 (asset local 900x1200, vía `astro:assets`, con `alt` descriptivo no vacío), mostrada en color natural (sin filtro `grayscale`), el nombre como `<h3>`, el cargo exacto como texto visible y la descripción exacta del roster. La tarjeta NO SHALL renderizar badge de área, ni pie de tarjeta, ni icono decorativo de pie. El grid SHALL mantener el comportamiento responsive de 1 columna en móvil, 2 desde `sm` y 4 desde `lg`.

#### Scenario: SC-206 — Ocho tarjetas de equipo

- **WHEN** la sección de equipo renderiza
- **THEN** se renderizan exactamente 8 tarjetas
- **AND** los nombres en orden son Ruby Barrientos, Felipe Román, Patricio Barrientos, Francisco Mehech, Eric Pérez, Loredana Quiroga, Francys Padra y Melany Bravo
- **AND** cada tarjeta muestra el cargo exacto del roster (p. ej. "Directora · Gerenta Comercial" y "Gerente de Operaciones")
- **AND** cada tarjeta muestra la descripción exacta definida en `team-roster`
- **AND** cada tarjeta renderiza una imagen con `alt` no vacío

#### Scenario: Card is simplified to photo, name, role and description

- **WHEN** cada tarjeta renderiza
- **THEN** la tarjeta contiene la foto, el nombre, el cargo y la descripción
- **AND** la tarjeta no contiene badge de área sobre la foto
- **AND** la tarjeta no contiene pie de tarjeta ni icono Lucide de pie
- **AND** la tarjeta no renderiza los campos `area`, `areaTone`, `footerLabel` ni `footerIcon`

#### Scenario: Portrait keeps the delivered 3:4 proportion

- **WHEN** la foto de cada integrante renderiza
- **THEN** el contenedor de la foto declara una proporción 3:4 (`aspect-[3/4]`)
- **AND** la imagen se renderiza con `object-cover`
- **AND** la imagen declara `loading="lazy"`

#### Scenario: Portrait is shown in full color

- **WHEN** la foto de cada integrante renderiza en `/nosotros`
- **THEN** la imagen NO declara el filtro `grayscale`
- **AND** la foto conserva sus colores naturales

#### Scenario: Section header and accreditation badge are preserved

- **WHEN** la sección de equipo renderiza
- **THEN** existe el `<h2>` "Equipo RIFF — Liderazgo & Experiencia"
- **AND** existe el badge "+100 años de experiencia combinada en terreno" con un icono Lucide decorativo
- **AND** el subtítulo "Profesionales comprometidos con la precisión y el servicio técnico en terreno." está presente

#### Scenario: Grid remains responsive 1 -> 2 -> 4

- **WHEN** el grid de tarjetas renderiza
- **THEN** el contenedor declara `grid-cols-1`, `sm:grid-cols-2` y `lg:grid-cols-4`
- **AND** aplica un gap uniforme entre tarjetas
- **AND** no se genera scroll horizontal en viewport angosto

### Requirement: Clients carousel and closing CTA banner

La sección final SHALL renderizar el encabezado ("Quienes Han Confiado en Nosotros" + copy verbatim) y, en lugar de la grilla estática de ocho nombres, un carrusel con los 41 logos de clientes (regido por el requirement "Clients logo carousel scrolls infinitely and pauses on hover"); no SHALL renderizar los ocho nombres en texto ni sus bajadas de sector. Además SHALL renderizar el banner de cierre "¿Listo para optimizar la medición y el flujo de su operación?" con su copy y dos CTA: "SOLICITAR ASESORÍA TÉCNICA" (→ `/contacto`) y el teléfono "+56 2 29079067" como enlace `tel:` (fuente única `getContactInfo()`).

#### Scenario: SC-207 — Carrusel de logos y banner de cierre

- **WHEN** la sección de clientes renderiza
- **THEN** el bloque de clientes contiene un carrusel con los 41 logos (no una grilla de nombres en texto)
- **AND** no se renderizan las bajadas de sector de los ocho clientes anteriores
- **AND** cada logo renderiza una imagen con `alt` no vacío
- **AND** existe el título "¿Listo para optimizar la medición y el flujo de su operación?"
- **AND** existe un ancla "SOLICITAR ASESORÍA TÉCNICA" con `href="/contacto"`
- **AND** existe un enlace `tel:+56229079067` con el texto visible "+56 2 29079067"

### Requirement: Clients logo carousel scrolls infinitely and pauses on hover

El bloque de clientes del `/nosotros` SHALL renderizar un carrusel horizontal infinito con los 41 logos de clientes ordenados alfabéticamente por nombre de empresa (orden definido en el array de configuración). Cada logo SHALL mostrarse completo, sin recorte ni distorsión, con una altura uniforme y un ancho proporcional a su relación de aspecto intrínseca; la celda blanca que lo contiene SHALL ajustar su ancho al logo, SHALL tener fondo blanco y SHALL incluir padding alrededor del logo. En escritorio (viewport ≥ 768 px) la celda SHALL medir 120 px de alto incluyendo el padding. El carrusel SHALL desplazarse automáticamente de derecha a izquierda de forma continua y lenta, con una duración de 120 segundos por ciclo completo declarada como constante de configuración. La animación SHALL implementarse únicamente con CSS (`@keyframes` + `animation-play-state`), sin JavaScript. Al hacer hover sobre el carrusel, la animación SHALL pausarse y, al retirar el cursor, SHALL reanudarse. Al hacer hover sobre un logo, el logo completo SHALL escalar ligeramente (≈1.05) sin recortarse y desbordando su caja de imagen, mientras la celda blanca conserva su tamaño, mediante composición por GPU (`scale3d`/`translateZ(0)`/`will-change: transform`), no mediante la propiedad `scale` estándar. Con `prefers-reduced-motion: reduce`, la animación SHALL quedar detenida, mostrando los logos estáticos.

#### Scenario: Desplazamiento infinito continuo

- **WHEN** la página `/nosotros` se carga con movimiento normal
- **THEN** el carrusel muestra los 41 logos y se desplaza automáticamente de derecha a izquierda
- **AND** al completar un ciclo el contenido se repite sin salto visible (loop continuo)
- **AND** la duración del ciclo completo es 120 s, definida como constante en configuración

#### Scenario: Logos completos con ancho proporcional

- **WHEN** el carrusel renderiza los logos de clientes
- **THEN** cada logo se muestra completo, sin recorte ni distorsión
- **AND** todos los logos comparten la misma altura
- **AND** el ancho de cada logo y de su celda es proporcional a la relación de aspecto del asset
- **AND** cada celda tiene fondo blanco y padding alrededor del logo
- **AND** en escritorio (viewport ≥ 768 px) cada celda mide 120 px de alto incluyendo el padding

#### Scenario: Pausa y reanudación al hover

- **WHEN** el usuario posa el cursor sobre el carrusel
- **THEN** la animación se pausa (`animation-play-state: paused`)
- **AND** al retirar el cursor la animación se reanuda automáticamente

#### Scenario: Escala del logo con aceleración por GPU

- **WHEN** el usuario posa el cursor sobre un logo
- **THEN** el logo completo escala ligeramente (≈1.05)
- **AND** el logo ampliado no se recorta y desborda su caja de imagen, mientras la celda blanca conserva su tamaño
- **AND** el efecto usa `scale3d`/`translateZ(0)`/`will-change: transform` (composición GPU), no la propiedad `scale` estándar

#### Scenario: Movimiento reducido

- **WHEN** el usuario tiene `prefers-reduced-motion: reduce`
- **THEN** el carrusel no se desplaza (animación detenida)
- **AND** los logos siguen visibles y legibles

#### Scenario: Accesibilidad del track duplicado

- **WHEN** el carrusel renderiza la copia duplicada usada para el loop continuo
- **THEN** la copia duplicada tiene `aria-hidden="true"`
- **AND** cada logo tiene `alt` no vacío con el nombre de la empresa

### Requirement: Page CTAs and internal navigation use real routes and in-page anchors

Los CTAs del `/nosotros` SHALL apuntar a rutas/ankras reales y funcionales: los CTAs de asesoría SHALL usar `href="/contacto"` (ruta real, **nunca** `#contacto`), el CTA "CONOCER NUESTRA HISTORIA" SHALL usar `href="#historia"` con un destino `id="historia"` existente en la misma página, y el salto de ancla SHALL aprovechar el smooth scroll global del sitio (no se añade un script propio de smooth scroll por página).

#### Scenario: SC-208 — CTAs a /contacto y ancla #historia funcional

- **WHEN** la página renderiza
- **THEN** ningún enlace usa `href="#contacto"`
- **AND** todos los CTAs de asesoría usan `href="/contacto"`
- **AND** existe el ancla `href="#historia"` y existe el elemento destino `id="historia"`
- **AND** la página no incluye un `<script>` propio de smooth scroll

### Requirement: Icons use the project's unique Lucide set

Los iconos del `/nosotros` SHALL resolverse exclusivamente vía el set único Lucide del proyecto (`<Icon name="lucide:…" />`); SHALL renderizarse como decorativos (`aria-hidden="true"`) y la página SHALL contener ninguna referencia a sets obsoletos (`material-symbols`, `logos`).

#### Scenario: SC-209 — Set Lucide, sin Material Symbols

- **WHEN** la página renderiza
- **THEN** el markup contiene referencias a iconos `lucide:` (p. ej. `lucide:phone`, `lucide:arrow-right` y los iconos de secciones)
- **AND** el markup no contiene `material-symbols` ni `material-symbols-outlined`
- **AND** los iconos decorativos llevan `aria-hidden="true"`

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

### Requirement: Page preserves accessibility invariants

El `/nosotros` SHALL mantener: un único `<h1>` por página (el del hero), encabezados de sección como `<h2>` y títulos de tarjetas como `<h3>`/`<h4>` (jerarquía sin saltos), el `<main>` con `aria-label` no vacío, imágenes con `alt` no vacío y los elementos decorativos (SVG de fondo, iconos) con `aria-hidden="true"`. El `<Layout>` seguirá aportando el `<header>` y `<footer>` del sitio (un solo landmark de header, SC-108).

#### Scenario: SC-212 — Jerarquía, landmarks y alt

- **WHEN** la página renderiza
- **THEN** existe exactamente un `<h1>` (en el hero)
- **AND** las secciones usan `<h2>` y las tarjetas `<h3>`/`<h4>`
- **AND** el `<main>` tiene un `aria-label` no vacío
- **AND** toda `<img>`/`<Image>` de la página tiene `alt` no vacío

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
