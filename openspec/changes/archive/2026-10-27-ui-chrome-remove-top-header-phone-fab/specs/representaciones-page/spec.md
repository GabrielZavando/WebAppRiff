# representaciones-page Specification

## MODIFIED Requirements

### Requirement: Representaciones page composes inside the existing site Layout

La página `/representaciones` SHALL renderizarse como `apps/web/src/pages/representaciones.astro` envolviendo su contenido en `<Layout>` (el layout existente del sitio público), recibiendo por composición el chrome completo del sitio: `Header`, `Footer`, `SiteCredits`, el FAB de teléfono (`PhoneFab`), el botón flotante de WhatsApp y el `ClientRouter`/View Transitions globales. La página SHALL pasar `showSearch={false}` a `Layout` (sin barra de búsqueda de catálogo, consistente con la anterior página `/marcas` y con `/contacto`). La página SHALL NOT pasar la prop `hero` (no usa el shell de imagen full-bleed; el hero oscuro es propio de la sección).

#### Scenario: Page renders inside Layout with full chrome

- **WHEN** `apps/web/src/pages/representaciones.astro` se renderiza
- **THEN** el HTML resultante contiene exactamente un landmark `<header>` (el del sitio)
- **AND** no contiene la barra superior retirada (`role="region"` con `aria-label="Barra de contacto"`)
- **AND** contiene el contenido de `Footer` y de `SiteCredits`
- **AND** contiene el enlace del FAB de teléfono (`href="tel:+56229079067"`)
- **AND** contiene el enlace del botón flotante de WhatsApp (`href="https://wa.me/56937526162"`)
- **AND** la sección hero propia de la página está presente

#### Scenario: Catalog search is omitted

- **WHEN** `representaciones.astro` se renderiza
- **THEN** el HTML NO contiene el landmark de búsqueda (`role="search"`)

#### Scenario: Page declares its own SEO metadata

- **WHEN** `representaciones.astro` se renderiza
- **THEN** el `<title>` contiene "Representaciones" y la marca "Riff"
- **AND** el `<meta name="description">` contiene la descripción de la página

#### Scenario: Page does not use the hero image shell

- **WHEN** `representaciones.astro` se renderiza
- **THEN** el HTML NO contiene la imagen full-bleed `banner_home` ni `tratamiento-agua`
- **AND** el contenido puede fluir debajo del header sólido como en cualquier página sin hero
