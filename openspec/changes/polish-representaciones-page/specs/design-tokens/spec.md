## ADDED Requirements

### Requirement: Fondo base del sitio con surface-muted y tarjetas blancas

El sitio público SHALL usar `bg-surface-muted` (`--color-surface-muted: #E9EEF3`) como fondo base de página. `Layout.astro` SHALL declarar esa superficie en el `body` (o en el wrapper raíz equivalente), y toda superficie de sección que hoy use `bg-bg` como fondo de página SHALL migrar a `bg-surface-muted`. Las tarjetas, paneles, formularios y demás elementos de contenido SHALL conservar `bg-white` para mantener el contraste frente al fondo. El token `bg-bg` (`#F6F8FA`) SHALL quedar reservado a mats de imágenes, controles de formulario, badges y otros elementos anidados dentro de una superficie blanca; SHALL NOT usarse como fondo base de página ni como fondo de sección principal. Las páginas con una identidad de fondo propia (por ejemplo `/contacto` con `bg-primary-deep`) SHALL conservar su fondo intencional.

#### Scenario: Layout declares the muted page surface

- **WHEN** se inspecciona `apps/web/src/layouts/Layout.astro`
- **THEN** el `body` (o su wrapper raíz) lleva la clase `bg-surface-muted`
- **AND** ninguna página que no defina un fondo intencional propio requiere declarar un fondo adicional para cubrir el viewport

#### Scenario: Page-level sections use the muted surface

- **WHEN** se inspeccionan las superficies de página de inicio, `/representaciones`, `/servicios`, `/productos/[slug]` y `/cotizacion`
- **THEN** las secciones que antes usaban `bg-bg` como fondo de página llevan `bg-surface-muted`
- **AND** ninguna de ellas usa `bg-white` como fondo base de página
- **AND** `/contacto` conserva `bg-primary-deep` como fondo intencional

#### Scenario: Content cards remain white

- **WHEN** se renderizan las tarjetas de producto, las tarjetas de contenido y los formularios del sitio
- **THEN** cada tarjeta o formulario de contenido conserva `bg-white`
- **AND** el contraste entre `bg-surface-muted` y `bg-white` es perceptible en las áreas de página que rodean las tarjetas

#### Scenario: Nested bg-bg is allowed but not as a page base

- **WHEN** un componente usa `bg-bg` dentro de una tarjeta blanca (mat de imagen, badge, input o chip)
- **THEN** el uso es válido porque es una superficie anidada
- **AND** el componente no aplica `bg-bg` al `body`, al `<main>` de la página ni al elemento `<section>` que define el fondo principal de la página
