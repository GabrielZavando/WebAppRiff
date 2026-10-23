## MODIFIED Requirements

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
