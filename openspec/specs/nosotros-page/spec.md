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

La sección hero del `/nosotros` SHALL renderizar el `<h1>` "SOMOS RIFF" (con "RIFF" resaltado en color de marca), el subtítulo "Más de 40 años innovando en la medición, control de fluidos y tratamiento de agua.", el párrafo de presentación institucional (copy verbatim de la referencia), un eyebrow/insignia "IDENTIDAD & TRAYECTORIA CORPORATIVA" con icono decorativo, y dos CTA: "SOLICITAR ASESORÍA TÉCNICA" (→ `/contacto`) y "CONOCER NUESTRA HISTORIA" (→ `#historia`). La sección SHALL usar un fondo oscuro con tokens del proyecto y una imagen técnica con `alt` no vacío, sin hex literales.

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

### Requirement: Historical timeline renders the five milestones under #historia

La sección de línea de tiempo SHALL llevar el `id="historia"` y renderizar los 5 hitos de la referencia en orden cronológico — 1979 (Fundación: Aguas Purificadas Ltda.), 2012 (Consolidación & Continuidad Familiar), 2013 (Nace Aguapur Medición), 2018 (Surgimiento de la Línea RIFF), Diciembre 2024 (Evolución Integral: RIFF SpA) — con su copy verbatim (título, párrafo y nota lateral "Hito Clave"/"Evolución Estratégica"/"Hito de Especialización"/"Salto Tecnológico"/"Capacidad Actual"), y un encabezado de sección con título y párrafo introductorio.

#### Scenario: SC-203 — Timeline con 5 hitos y ancla #historia

- **WHEN** la sección de historia renderiza
- **THEN** existe un elemento con `id="historia"`
- **AND** se renderizan los 5 hitos con sus años "1979", "2012", "2013", "2018" y "DICIEMBRE 2024"
- **AND** cada hito muestra su título y párrafo de la referencia (p. ej. "Fundación: Aguas Purificadas Ltda." y "Surgimiento de la Línea RIFF")
- **AND** el ancla del hero "CONOCER NUESTRA HISTORIA" apunta a este elemento (`href="#historia"`)

### Requirement: Value proposition renders four pillars and four industry sectors

La sección de propuesta de valor SHALL renderizar el encabezado ("Nuestra Propuesta de Valor" + copy verbatim), los 4 pilares — Durabilidad Extrema, Precisión Certificada, Eficiencia Hídrica, Servicio In-Situ — cada uno con icono Lucide decorativo, título, descripción y nota al pie de la referencia; y el bloque "Presencia Sólida en Industrias Críticas" con las 4 tarjetas de sector — Gran Minería & Pulpa, Alimentos & Bebidas, Redes Rurales (APR), Edificación & Inmobiliario — cada una con número "SECTOR 0x", descripción verbatim e icono Lucide decorativo.

#### Scenario: SC-204 — 4 pilares y 4 sectores

- **WHEN** la sección de propuesta de valor renderiza
- **THEN** se renderizan los títulos "Durabilidad Extrema", "Precisión Certificada", "Eficiencia Hídrica" y "Servicio In-Situ"
- **AND** cada pilar muestra su descripción de la referencia (p. ej. "Componentes de fundición dúctil…")
- **AND** se renderizan los títulos "Gran Minería & Pulpa", "Alimentos & Bebidas", "Redes Rurales (APR)" y "Edificación & Inmobiliario"
- **AND** las tarjetas de sector muestran los sellos "SECTOR 01" … "SECTOR 04" y su descripción verbatim
- **AND** los iconos de pilares y sectores se resuelven vía el set Lucide (`lucide:`) y son decorativos (`aria-hidden="true"`)

### Requirement: Mission and vision render as two adjacent blocks

La sección de identidad corporativa SHALL renderizar dos bloques lado a lado (apilados en móvil): **MISIÓN** (eyebrow "PRINCIPIO FUNDAMENTAL", cita "Suministrar soluciones integrales…", párrafo complementario y nota "Compromiso inquebrantable con la trazabilidad y la honestidad técnica.") y **VISIÓN** (eyebrow "PROYECCIÓN DE FUTURO", cita "Ser líderes en el suministro de equipos…", párrafo complementario y nota "Sostenibilidad hídrica como pilar de ingeniería hacia 2030."), con el copy verbatim, un bloque sobre fondo claro y el otro sobre fondo oscuro (tokens del proyecto) e iconos Lucide decorativos.

#### Scenario: SC-205 — Bloques de misión y visión

- **WHEN** la sección de identidad corporativa renderiza
- **THEN** existen los encabezados "MISIÓN" y "VISIÓN"
- **AND** el bloque de Misión muestra la cita que comienza "Suministrar soluciones integrales" y la nota "Compromiso inquebrantable con la trazabilidad y la honestidad técnica."
- **AND** el bloque de Visión muestra la cita que comienza "Ser líderes en el suministro de equipos" y la nota "Sostenibilidad hídrica como pilar de ingeniería hacia 2030."
- **AND** los eyebrows "PRINCIPIO FUNDAMENTAL" y "PROYECCIÓN DE FUTURO" están presentes

### Requirement: Team section renders the four leadership cards

La sección de equipo SHALL renderizar el encabezado ("Equipo RIFF — Liderazgo & Experiencia" + copy verbatim y badge "+100 años de experiencia combinada en terreno") y exactamente 4 tarjetas de liderazgo — Steven Marks (Gerente General), Lara Smith (Jefe de Proyectos de Ingeniería), John Doe (Dirección Comercial y Representaciones), Felipe Román (Gerencia de Operaciones y Medición) — cada una con retrato (placeholder local), área ("Dirección"/"Ingeniería"/"Comercial"/"Operaciones"), descripción verbatim y pie con icono Lucide decorativo ("Gestión Corporativa"/"Cálculo & Comisionamiento"/"Alianzas Globales"/"Metrología & Faena").

#### Scenario: SC-206 — Cuatro tarjetas de equipo

- **WHEN** la sección de equipo renderiza
- **THEN** se renderizan las tarjetas de Steven Marks, Lara Smith, John Doe y Felipe Román (4 en total)
- **AND** cada tarjeta muestra el nombre, el cargo y la descripción de la referencia
- **AND** cada tarjeta renderiza una imagen con `alt` no vacío
- **AND** los pies de tarjeta muestran "Gestión Corporativa", "Cálculo & Comisionamiento", "Alianzas Globales" y "Metrología & Faena"

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

Los componentes del `/nosotros` SHALL usar exclusivamente las utilities generadas desde los tokens `@theme` del proyecto (`bg-secondary`, `bg-primary-deep`, `bg-accent`, `text-text`, `text-text-2`, `bg-bg`, `bg-white`, `bg-primary-100`, `border-border`, `shadow-1..3`, `font-heading`, `font-body`, …) y SHALL usar el catálogo de iconos Lucide; no SHALL contener literales hex en `class` ni clases `rounded*` (flat design con radio 0).

#### Scenario: SC-210 — Sin hex ni rounded*

- **WHEN** los componentes de `/nosotros` renderizan
- **THEN** ninguna `class` contiene un literal hex (`#` seguido de valores hex)
- **AND** ninguna `class` contiene `rounded`
- **AND** los fondos/textos de marca usan tokens (p. ej. el hero usa `bg-secondary`, los CTA naranja usan `bg-accent`)

### Requirement: Sections adapt to mobile, tablet and desktop

Cada sección del `/nosotros` SHALL ser responsive mobile-first: en viewport angosto los grids colapsan a una columna, la línea central y los badges numéricos de la timeline solo aparecen en desktop, la misión/visión se apilan, las tarjetas de equipo pasan de 1 → 2 → 4 columnas y los CTAs del banner final ocupan el ancho disponible en móvil. El carrusel de clientes SHALL mantener una altura estable y recortar el desborde horizontal (viewport con `overflow-hidden`). Ninguna sección SHALL desbordar horizontalmente en viewport angosto.

#### Scenario: SC-211 — Colapsos responsive

- **WHEN** los componentes de `/nosotros` renderizan
- **THEN** los grids de pilares, sectores y equipo declaran columnas base en móvil con incremento en breakpoints mayores (p. ej. `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`)
- **AND** el carrusel de clientes declara un viewport con `overflow-hidden` y no genera scroll horizontal en la página
- **AND** la línea central de la timeline y sus badges numéricos están ocultos fuera de desktop (clases `hidden lg:*`)
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
