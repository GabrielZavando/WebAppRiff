## MODIFIED Requirements

### Requirement: ServicesSectionHeading renders a consistent section header

El componente de encabezado de sección SHALL renderizar un marcador cuadrado con el tono indicado (`primary` o `accent`), un eyebrow en mayúsculas, un `<h2>` con el headline y un párrafo de introducción, separados del contenido por un borde inferior. El componente SHALL ser reutilizable por ambas secciones y SHALL NOT usar `rounded-*` ni `shadow-*` en estado estático.

#### Scenario: Encabezado con marcador primario

- **WHEN** `ServiciosSectionHeading` renderiza con `markerTone="primary"`, `eyebrow="LÍNEA DE EQUIPAMIENTO & TECNOLOGÍA"` y `headline="Nuestros Productos — Portafolio Técnico"`
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

### Requirement: ServicioTerrenoCard renders image, index, sector, title and description

`ServicioTerrenoCard` SHALL renderizar una fila de servicio en terreno con una imagen optimizada por `astro:assets` (`loading="lazy"`, `alt` descriptivo), un caption superpuesto sobre la imagen, un índice de dos dígitos, un sector en mayúsculas, un `<h3>` con el título y un párrafo de descripción. En móvil (`< md`) la tarjeta SHALL apilar la imagen primero y luego el índice, el título, la descripción, la variante de cuerpo y el CTA. Desde `md` la tarjeta SHALL renderizarse como una única columna vertical (sin grid de 12 columnas) con el orden visual estricto: índice y sector, título, imagen, descripción, variante de cuerpo y CTA. La imagen SHALL ocupar el 100% del ancho de la tarjeta, con proporción horizontal 16:9 (`md:aspect-video`) y recorte `object-cover` para no deformarse. El CTA SHALL quedar al final del flujo, alineado a la izquierda, con espacio reservado a la derecha (`md:pr-24`) para no quedar tapado por los FABs de WhatsApp y Teléfono.

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
- **THEN** las cuatro tarjetas comparten el mismo layout vertical en `md+`
- **AND** la imagen ya no alterna entre izquierda y derecha

#### Scenario: Orden móvil

- **WHEN** `ServicioTerrenoCard` se renderiza en un viewport menor que `md`
- **THEN** la imagen se renderiza primero
- **AND** después se renderizan el índice, el título, la descripción, la variante de cuerpo y el CTA

#### Scenario: Orden vertical en md+

- **WHEN** `ServicioTerrenoCard` se renderiza en un viewport de 768px o superior
- **THEN** el `<article>` raíz usa una columna (`flex flex-col`) y NO usa `md:grid-cols-12` ni `md:col-span-*`
- **AND** el orden visual de arriba hacia abajo es índice/sector, título, imagen, descripción, variante de cuerpo y CTA
- **AND** la imagen ocupa el 100% del ancho de la tarjeta y mantiene una proporción 16:9 sin deformarse
- **AND** el CTA queda al final, alineado a la izquierda, con `md:pr-24` y sin intersección con los FABs

### Requirement: Services page composes the hero and the two new sections over the home banner

La página `/servicios` SHALL renderizar `ServicesHero`, `ServiciosPortafolioSection` y `ServiciosTerrenoSection` dentro de `Layout` con `hero` y `heroImage` igual a `tratamiento-agua.webp`, manteniendo el banner full-bleed y el overlay `bg-secondary/80`. La Sección 1 SHALL usar fondo `bg-surface-muted`; la Sección 2 SHALL usar `bg-primary-100` y bordes superior e inferior. La página SHALL renderizar exactamente dos `<h2>` de sección y ocho filas de contenido (cuatro soluciones y cuatro servicios). El headline de la Sección 1 SHALL ser "Nuestros Productos — Portafolio Técnico" (antes "Nuestras Soluciones — Portafolio Técnico"), alineado con el titular "Nuestros Productos" del home. (MODIFIED in `polish-representaciones-page`: la Sección 1 pasa de `bg-bg` a `bg-surface-muted` como parte del nuevo fondo base del sitio.)

#### Scenario: Composición de la página

- **WHEN** `apps/web/src/pages/servicios.astro` se renderiza
- **THEN** el HTML contiene el headline del `ServicesHero` actual
- **AND** el HTML contiene el headline "Nuestros Productos — Portafolio Técnico"
- **AND** el HTML NO contiene el texto "Nuestras Soluciones — Portafolio Técnico"
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
