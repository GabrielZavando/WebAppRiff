# Spec Delta — representaciones-page

## MODIFIED Requirements

### Requirement: Page content comes from typed config and presentational components

El contenido de la página SHALL vivir en `apps/web/src/lib/config/representaciones-page.ts`, tipado por contratos en `apps/web/src/lib/types/representaciones-page.ts` (sin `any`). Las interfaces `RepresentacionBrand` y `Distribuidor` SHALL exponer un campo opcional `readonly url?: string` con el sitio web del fabricante; la ausencia de `url` es válida y significa "logo sin enlace". La página SHALL ser un componente "dumb" que compone secciones presentacionales alimentadas por ese config; SHALL NOT incluir lógica de negocio en el frontmatter.

#### Scenario: Content is typed and centralized

- **WHEN** se inspeccionan `apps/web/src/pages/representaciones.astro` y sus componentes
- **THEN** los textos de las cuatro secciones provienen de `lib/config/representaciones-page.ts`
- **AND** el config está tipado con tipos exportados desde `lib/types/representaciones-page.ts`
- **AND** no se usa `any` en los contratos

#### Scenario: Brand and distributor contracts expose the optional url field

- **WHEN** se inspeccionan `RepresentacionBrand` y `Distribuidor` en `lib/types/representaciones-page.ts`
- **THEN** ambas interfaces declaran `readonly url?: string` (opcional)
- **AND** el config define `url` para 6 de las 7 marcas/distribuidores y omite `url` únicamente en GL Flow (id `gl-sanitaria`)

## ADDED Requirements

### Requirement: Brand and distributor logos link to the manufacturer site when a url is configured

Cuando el dato de una marca o distribuidor define `url`, su logo SHALL envolverse en un `<a href={url} target="_blank" rel="noopener noreferrer">` (el `<Image>`/`<img>` queda dentro del enlace, dentro del contenedor `data-brand-logo`, sin alterar el layout de la tarjeta). Cuando el dato no define `url`, el logo SHALL renderizarse sin enlace (SHELL NOT envolverse en un `<a>`). El mapeo SHALL ser: Apator Powogaz → `https://www.apator.com/en`; RIFF Flow Metering → `https://riffmeters.com/`; Nitto Seiko → `https://global.nittoseiko.com/`; GL Sanitaria → sin `url` (sin `<a>`); ILMAP → `https://ilmap.com/es/`; PIUSI → `https://www.piusi.com/es/`; SENSUS → `https://www.sensus-international.com/en`. El enlace envuelve exclusivamente el logo; el chip, el `<h3>`, la categoría y la descripción de la tarjeta SHALL NOT enlazarse.

#### Scenario: Brand logos with url render as external links

- **WHEN** la sección de marcas se renderiza
- **THEN** los logos de Apator Powogaz, RIFF Flow Metering, Nitto Seiko e ILMAP están envueltos en un `<a>` con `target="_blank"` y `rel="noopener noreferrer"`
- **AND** sus `href` son exactamente `https://www.apator.com/en`, `https://riffmeters.com/`, `https://global.nittoseiko.com/` e `https://ilmap.com/es/` respectivamente

#### Scenario: Distributor logos with url render as external links

- **WHEN** la sección de distribuidores se renderiza
- **THEN** los logos de PIUSI y SENSUS están envueltos en un `<a>` con `target="_blank"` y `rel="noopener noreferrer"`
- **AND** sus `href` son exactamente `https://www.piusi.com/es/` y `https://www.sensus-international.com/en`

#### Scenario: GL Flow logo renders without a link

- **WHEN** la tarjeta de GL Sanitaria se renderiza
- **THEN** el logo (`data-brand-logo`) no está envuelto en ningún `<a>`
- **AND** el `<img>` del logo se renderiza igual que en las tarjetas enlazadas (mismo `alt`, `loading="lazy"` y pipeline de `astro:assets`)

#### Scenario: The link wraps only the logo and preserves the card layout

- **WHEN** se inspeccionan `RepresentacionBrandCard.astro` y `DistribuidorCard.astro`
- **THEN** el `<a>` (cuando existe) vive dentro del contenedor `data-brand-logo` y envuelve únicamente el `<Image>`
- **AND** el chip, el `<h3>`, la categoría y la descripción no quedan dentro del enlace
- **AND** la estructura externa de la tarjeta (panel de marca en mobile, fila desde `md`) no cambia
