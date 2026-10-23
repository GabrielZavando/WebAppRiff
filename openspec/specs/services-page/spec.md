# services-page Specification

## Purpose
Página de servicios del sitio: hero con headline y palabra destacada y tarjetas de servicio con número, sector, título, imagen, bullets, tags y CTA al contacto.
## Requirements
### Requirement: ServicesHero renders headline with highlighted word and subtitle
The services-hero SHALL render a headline from the `headline` prop with the `highlightedWord` substring wrapped in a `<span class="text-accent">`, plus a `subtitle` rendered as a subordinate paragraph, following the same split logic as HeroBanner/ContactHero via `splitHeadline()`.

#### Scenario: Headline renders with highlighted span
- **WHEN** the ServicesHero renders with `headline="Servicios Especializados en Precisión y Control"` and `highlightedWord="Precisión"`
- **THEN** the rendered HTML contains the full headline text
- **AND** the substring "Precisión" is wrapped in a `<span class="text-accent">`

#### Scenario: Subtitle rendered
- **WHEN** the ServicesHero renders with `subtitle` non-empty
- **THEN** a subtitle element is rendered containing the `subtitle` text

#### Scenario: Highlight absent when word not found
- **WHEN** the ServicesHero renders with `highlightedWord` empty or not present in `headline`
- **THEN** no `<span class="text-accent">` is rendered
- **AND** the full `headline` is rendered as plain text

#### Scenario: Hero section is transparent over the home banner image
- **WHEN** the ServicesHero renders
- **THEN** the section carries NO `bg-secondary-dark` class and NO own background class (it is transparent, overlaying the `Layout` banner image)
- **AND** the headline carries `text-white`
- **AND** no `rounded*` or `shadow*` classes appear in the static markup

### Requirement: ServicesSectionHeading renders a consistent section header
El componente de encabezado de sección SHALL renderizar un marcador cuadrado con el tono indicado (`primary` o `accent`), un eyebrow en mayúsculas, un `<h2>` con el headline y un párrafo de introducción, separados del contenido por un borde inferior. El componente SHALL ser reutilizable por ambas secciones y SHALL NOT usar `rounded-*` ni `shadow-*` en estado estático.

#### Scenario: Encabezado con marcador primario
- **WHEN** `ServiciosSectionHeading` renderiza con `markerTone="primary"`, `eyebrow="LÍNEA DE EQUIPAMIENTO & TECNOLOGÍA"` y `headline="Nuestras Soluciones — Portafolio Técnico"`
- **THEN** el marcador cuadrado lleva `bg-primary`
- **AND** el eyebrow se renderiza en mayúsculas con `text-primary`
- **AND** el headline se renderiza como `<h2>`
- **AND** la introducción se renderiza como `<p>`

#### Scenario: Encabezado con marcador de acento
- **WHEN** `ServiciosSectionHeading` renderiza con `markerTone="accent"` y `headline="Servicios Especializados en Terreno"`
- **THEN** el marcador cuadrado lleva `bg-accent`
- **AND** el headline se renderiza como `<h2>`

#### Scenario: Sin radio ni sombra
- **WHEN** `ServiciosSectionHeading` renderiza
- **THEN** el HTML no contiene clases `rounded*` ni `shadow*`

### Requirement: SolucionPortafolioCard renders a technical solution row
`SolucionPortafolioCard` SHALL renderizar una fila de solución con un icono Lucide provisto por configuración, una categoría en mayúsculas, un `<h3>` con el título, un párrafo de descripción, un CTA y el `id` del ancla de la solución. La columna de contenido y la columna de especificaciones SHALL apilarse en móvil y mostrarse lado a lado desde `lg`.

#### Scenario: Contenido principal de la solución
- **WHEN** `SolucionPortafolioCard` renderiza con `icon="lucide:gauge"`, `category="Instrumentación de Precisión"`, `title="Medición de Fluidos"` y `description` no vacía
- **THEN** se renderiza un icono SVG de `astro-icon` con `aria-hidden="true"`
- **AND** la categoría se renderiza en mayúsculas con `text-primary`
- **AND** el título se renderiza como `<h3>` con `text-secondary`
- **AND** la descripción se renderiza como `<p>` con `text-text-2`

#### Scenario: Ancla de la solución
- **WHEN** `SolucionPortafolioCard` renderiza con `id="solucion-medicion-fluidos"`
- **THEN** el elemento raíz `<article>` lleva `id="solucion-medicion-fluidos"`
- **AND** el elemento raíz lleva una utilidad `scroll-mt-*`

#### Scenario: Layout responsivo
- **WHEN** `SolucionPortafolioCard` renderiza
- **THEN** el contenedor interno usa una grilla de una columna en móvil y dos columnas desde `lg`

### Requirement: SolucionPortafolioCard renders a specifications panel
`SolucionPortafolioCard` SHALL renderizar un panel de especificaciones con un `<h4>` de título y una lista de pares etiqueta/valor provistos por configuración. Cada par SHALL renderizarse en una caja propia con `bg-white` y `border-border`, dentro de un panel con `bg-primary-100`. El panel SHALL admitir entre dos y cuatro especificaciones y SHALL NOT renderizarse si la lista está vacía.

#### Scenario: Panel con especificaciones
- **WHEN** `SolucionPortafolioCard` renderiza con `specsTitle="Especificaciones Técnicas Clave"` y tres especificaciones
- **THEN** el título se renderiza como `<h4>`
- **AND** se renderizan exactamente tres cajas de especificación
- **AND** cada caja muestra su etiqueta y su valor

#### Scenario: Panel omitido sin especificaciones
- **WHEN** `SolucionPortafolioCard` renderiza con `specs=[]`
- **THEN** no se renderiza el panel de especificaciones

### Requirement: SolucionPortafolioCard renders tag chips and CTA
`SolucionPortafolioCard` SHALL renderizar una etiqueta de sección y una fila de chips con los valores de `tags`, y un CTA visible con la etiqueta configurada que apunte a `/contacto` usando `bg-accent` y `hover:bg-accent-dark`, acompañado de un icono `lucide:arrow-right` decorativo (`aria-hidden="true"`).

#### Scenario: Chips de sectores o cumplimiento
- **WHEN** `SolucionPortafolioCard` renderiza con `tagsLabel="Sectores e Industrias:"` y cuatro tags
- **THEN** se renderiza la etiqueta `Sectores e Industrias:`
- **AND** se renderizan cuatro chips
- **AND** cada chip lleva `border` y `border-border`

#### Scenario: CTA al contacto
- **WHEN** `SolucionPortafolioCard` renderiza con `ctaLabel="Solicitar Asesoría Técnica"`
- **THEN** se renderiza un `<a href="/contacto">`
- **AND** el texto visible contiene "Solicitar Asesoría Técnica"
- **AND** el ancla lleva `bg-accent`
- **AND** el icono de flecha es decorativo

#### Scenario: Sin chips cuando no hay tags
- **WHEN** `SolucionPortafolioCard` renderiza con `tags=[]`
- **THEN** no se renderizan chips

### Requirement: ServicioTerrenoCard renders image, index, sector, title and description
`ServicioTerrenoCard` SHALL renderizar una fila de servicio en terreno con una imagen optimizada por `astro:assets` (`loading="lazy"`, `alt` descriptivo), un caption superpuesto sobre la imagen, un índice de dos dígitos, un sector en mayúsculas, un `<h3>` con el título y un párrafo de descripción. La imagen y el contenido SHALL apilarse en móvil y alternar su orden visual desde `md`: las tarjetas 1 y 3 muestran la imagen a la izquierda y las tarjetas 2 y 4 a la derecha.

#### Scenario: Imagen y caption
- **WHEN** `ServicioTerrenoCard` renderiza con `image` local, `imageAlt="Edificios residenciales con medidores de agua"`, `imageCaptionLabel="COMPATIBILIDAD TELEMÉTRICA"` y `imageCaption` no vacío
- **THEN** se renderiza un `<img>` optimizado por `astro:assets`
- **AND** el `alt` es el `imageAlt` descriptivo
- **AND** la imagen lleva `loading="lazy"`
- **AND** el caption superpuesto muestra la etiqueta y el texto, con `bg-secondary-dark/90`

#### Scenario: Índice y sector
- **WHEN** `ServicioTerrenoCard` renderiza con `index={1}` y `sector="RESIDENCIAL & COMERCIAL"`
- **THEN** el HTML contiene el texto "01"
- **AND** el sector se renderiza en mayúsculas con `text-accent`

#### Scenario: Título y descripción
- **WHEN** `ServicioTerrenoCard` renderiza con `title="Medición en Edificios"` y `description` no vacía
- **THEN** el título se renderiza como `<h3>` con `text-secondary`
- **AND** la descripción se renderiza como `<p>` con `text-text-2`

#### Scenario: Alternancia de imagen
- **WHEN** la página renderiza las cuatro tarjetas en orden
- **THEN** las tarjetas 1 y 3 muestran la imagen a la izquierda en `md+`
- **AND** las tarjetas 2 y 4 muestran la imagen a la derecha en `md+`

### Requirement: ServicioTerrenoCard renders exactly one body variant
`ServicioTerrenoCard` SHALL aceptar una unión discriminada `body` con exactamente una de tres variantes: `features` (cajas con título y descripción), `bullets` (lista con prefijo en negrita e icono `lucide:circle-check`) o `tags` (chips). El componente SHALL renderizar únicamente la variante indicada y SHALL NOT combinar bloques de variantes distintas.

#### Scenario: Variante de features
- **WHEN** `ServicioTerrenoCard` renderiza con `body={ kind: 'features', features: [...] }` de dos elementos
- **THEN** se renderizan exactamente dos cajas de feature
- **AND** cada caja muestra un título en negrita y una descripción

#### Scenario: Variante de bullets
- **WHEN** `ServicioTerrenoCard` renderiza con `body={ kind: 'bullets', bullets: [...] }` de tres elementos
- **THEN** se renderiza un `<ul>` con exactamente tres `<li>`
- **AND** cada `<li>` muestra el prefijo en negrita y el texto
- **AND** cada `<li>` incluye un icono `lucide:circle-check` decorativo

#### Scenario: Variante de tags
- **WHEN** `ServicioTerrenoCard` renderiza con `body={ kind: 'tags', tags: [...] }` de cinco elementos
- **THEN** se renderizan exactamente cinco chips
- **AND** no se renderiza un `<ul>` de bullets

#### Scenario: Una sola variante
- **WHEN** `ServicioTerrenoCard` renderiza con cualquier variante
- **THEN** el HTML no contiene bloques de las otras dos variantes

### Requirement: ServicioTerrenoCard preserves anchor ids and renders CTA
`ServicioTerrenoCard` SHALL renderizar su `<article>` raíz con `id` igual al `slug` y una utilidad `scroll-mt-*` que compense el header sticky. El CTA SHALL apuntar a `/contacto`, usar `bg-accent` y `hover:bg-accent-dark`, mostrar la etiqueta configurada y un icono `lucide:arrow-right` decorativo. Los cuatro slugs SHALL ser exactamente los del home: `medicion-en-edificios`, `medicion-industrial`, `obras-y-proyectos` y `tratamiento-de-agua`.

#### Scenario: Ancla estable
- **WHEN** `ServicioTerrenoCard` renderiza con `slug="medicion-industrial"`
- **THEN** el `<article>` raíz lleva `id="medicion-industrial"`
- **AND** el `<article>` raíz lleva una utilidad `scroll-mt-*`

#### Scenario: CTA al contacto
- **WHEN** `ServicioTerrenoCard` renderiza con `ctaLabel="Contactar a un Especialista"`
- **THEN** se renderiza un `<a href="/contacto">`
- **AND** el texto visible contiene "Contactar a un Especialista"
- **AND** el ancla lleva `bg-accent`
- **AND** el icono de flecha es decorativo

#### Scenario: Contrato de slugs con el home
- **WHEN** la página renderiza las cuatro tarjetas de la Sección 2
- **THEN** el conjunto de `id` de las tarjetas es exactamente `medicion-en-edificios`, `medicion-industrial`, `obras-y-proyectos` y `tratamiento-de-agua`

### Requirement: Services page composes the hero and the two new sections over the home banner
La página `/servicios` SHALL renderizar `ServicesHero`, `ServiciosPortafolioSection` y `ServiciosTerrenoSection` dentro de `Layout` con `hero` y `heroImage` igual a `tratamiento-agua.webp`, manteniendo el banner full-bleed y el overlay `bg-secondary/80`. La Sección 1 SHALL usar fondo `bg-surface-muted`; la Sección 2 SHALL usar `bg-primary-100` y bordes superior e inferior. La página SHALL renderizar exactamente dos `<h2>` de sección y ocho filas de contenido (cuatro soluciones y cuatro servicios). (MODIFIED in `polish-representaciones-page`: la Sección 1 pasa de `bg-bg` a `bg-surface-muted` como parte del nuevo fondo base del sitio.)

#### Scenario: Composición de la página
- **WHEN** `apps/web/src/pages/servicios.astro` se renderiza
- **THEN** el HTML contiene el headline del `ServicesHero` actual
- **AND** el HTML contiene el headline "Nuestras Soluciones — Portafolio Técnico"
- **AND** el HTML contiene el headline "Servicios Especializados en Terreno"
- **AND** el HTML contiene exactamente dos elementos `<h2>`
- **AND** el HTML contiene ocho elementos `<article>` de fila

#### Scenario: Hero con el nuevo copy
- **WHEN** `servicios.astro` se renderiza
- **THEN** el `<h1>` contiene el texto "Portafolio industrial de soluciones &amp; Servicios Industriales"
- **AND** "Servicios Industriales" se renderiza dentro de un `<span class="text-primary">` (token `--color-primary` = `#41B3C4`)
- **AND** el Header, el Footer y la estructura de `ServicesHero` se conservan

#### Scenario: Overlay del banner idéntico al de Inicio
- **WHEN** se renderizan la página Inicio y la página `/servicios`
- **THEN** ambas páginas contienen exactamente un overlay decorativo con las clases `absolute inset-0 bg-secondary/80` y `aria-hidden="true"`
- **AND** el overlay de ambas páginas se renderiza desde `Layout.astro` con el mismo color y la misma opacidad, sin capas adicionales propias de cada página

#### Scenario: Fondos de las secciones
- **WHEN** `servicios.astro` se renderiza
- **THEN** la Sección 1 lleva `bg-surface-muted`
- **AND** la Sección 2 lleva `bg-primary-100`
- **AND** la Sección 2 lleva bordes superior e inferior con `border-border`

#### Scenario: Sin tokens obsoletos ni Material Symbols
- **WHEN** se inspeccionan los componentes y la página nuevos
- **THEN** no aparecen clases `brand-*`, `text-slate-*`, valores hex ni `rounded*`/`shadow*` estáticos
- **AND** no se referencia `material-symbols:`

### Requirement: Services page preserves the home deep-link contract
La página `/servicios` SHALL conservar las cuatro anclas de servicio que usa el home (`medicion-en-edificios`, `medicion-industrial`, `obras-y-proyectos`, `tratamiento-de-agua`) y SHALL añadir las cuatro anclas del portafolio técnico (`solucion-medicion-fluidos`, `solucion-tratamiento-agua`, `solucion-productos-quimicos`, `solucion-control-accesorios`). Cada ancla SHALL apuntar a un `<article>` con `scroll-mt-*`.

#### Scenario: Anclas de servicios conservadas
- **WHEN** se renderiza la página
- **THEN** existen cuatro `<article>` con los `id` de los slugs del home

#### Scenario: Anclas nuevas del portafolio
- **WHEN** se renderiza la página
- **THEN** existen cuatro `<article>` con los `id` `solucion-medicion-fluidos`, `solucion-tratamiento-agua`, `solucion-productos-quimicos` y `solucion-control-accesorios`

#### Scenario: Todas las anclas compensan el header sticky
- **WHEN** se inspeccionan los ocho `<article>` con ancla
- **THEN** cada uno lleva una utilidad `scroll-mt-*`
