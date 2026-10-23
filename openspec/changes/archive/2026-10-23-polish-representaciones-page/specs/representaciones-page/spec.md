## ADDED Requirements

### Requirement: Page content containers align with the site Header

Los contenedores de contenido de `/representaciones` (hero y las tres secciones) SHALL usar el utility `.container` del sitio, el mismo que usa `Header.astro`, de modo que compartan el ancho máximo `max-w-7xl` y el padding responsive `px-4 sm:px-6 lg:px-8`. Los contenedores SHALL NOT usar un ancho o padding propio distinto (por ejemplo `mx-auto max-w-[1280px] px-6`), porque produce un desfase horizontal respecto del Header. El contenido interno de cada sección SHALL conservar sus gaps y grillas actuales.

#### Scenario: All page sections use the canonical container

- **WHEN** la página `/representaciones` se renderiza
- **THEN** el contenedor del hero y los contenedores de las secciones de marcas, distribuidores y propuesta de valor llevan la clase `container`
- **AND** ninguno de esos contenedores lleva `max-w-[1280px]`, `px-6` como padding de contenedor ni un ancho máximo alternativo

#### Scenario: Left and right edges match the Header

- **WHEN** se comparan el contenedor del `Header` y el contenedor de la sección de marcas en el HTML renderizado
- **THEN** ambos usan la misma combinación de ancho máximo y padding responsive provista por `.container`
- **AND** las tarjetas de marca quedan alineadas a los mismos bordes izquierdo y derecho que el contenido del Header

### Requirement: Company logos render as optimized image assets

Los logos reales de las marcas SHALL renderizarse con `<Image>` de `astro:assets` a partir de los binarios existentes en `apps/web/src/assets/img/representaciones/`, reemplazando los wordmarks tipográficos de reemplazo en las tarjetas de marcas exclusivas y en las tarjetas de distribuidores autorizados. Cada logo SHALL importarse como `ImageMetadata` en `lib/config/representaciones-page.ts` y renderizarse optimizado (formato WebP generado en build), con `alt` descriptivo, dimensiones provistas por la imagen y `loading="lazy"`. El `<Image>` SHALL vivir dentro del contenedor dedicado con el hook estable `data-brand-logo`, de modo que se preserve la estructura externa de las tarjetas. El mapeo SHALL ser: Apator Powogaz → `apator-logo.png`; RIFF Flow Metering → `Riff-meters.png`; Nitto Seiko → `nittoseiko-logo.jpg`; GL Sanitaria → `GL-Flow.webp`; ILMAP → `Ilmap-logo.webp`; PIUSI → `piusi-logo.png`; SENSUS → `sensus-logo.webp`. SHALL NOT añadirse binarios de imagen nuevos a `src/assets/img/` ni a `public/` en este change.

#### Scenario: Brand cards render the real optimized logos

- **WHEN** la sección de marcas se renderiza
- **THEN** cada una de las cinco tarjetas contiene un `<img>` renderizado por `astro:assets` dentro de su contenedor `data-brand-logo`
- **AND** los `alt` corresponden a "Apator Powogaz", "RIFF Flow Metering", "Nitto Seiko", "GL Sanitaria" e "ILMAP"
- **AND** las imágenes se sirven desde un asset procesado por el pipeline de Astro (ruta generada, no un wordmark de texto)
- **AND** cada imagen declara `loading="lazy"`

#### Scenario: Distributor cards render the real optimized logos

- **WHEN** la sección de distribuidores autorizados se renderiza
- **THEN** las tarjetas de PIUSI y SENSUS contienen un `<img>` renderizado por `astro:assets` dentro de su contenedor `data-brand-logo`
- **AND** los `alt` corresponden a "PIUSI" y "SENSUS"
- **AND** las imágenes se sirven desde un asset procesado por el pipeline de Astro

#### Scenario: Logo containers preserve the card structure

- **WHEN** los componentes `RepresentacionBrandCard.astro` y `DistribuidorCard.astro` se inspeccionan
- **THEN** el logo está envuelto en un contenedor identificable con `data-brand-logo`
- **AND** la sustitución del texto por `<Image>` no altera el layout externo (columna del panel de marca en mobile, fila desde `md`, panel izquierdo de ancho fijo en la tarjeta de marca)

#### Scenario: No new binary assets are introduced

- **WHEN** se revisan `apps/web/src/assets/img/` y `apps/web/public/`
- **THEN** no existe ningún binario de logo nuevo distinto de los siete ya presentes en `apps/web/src/assets/img/representaciones/`

## REMOVED Requirements

### Requirement: Company logos are typographic wordmark placeholders ready for image replacement

## MODIFIED Requirements

### Requirement: Page styling uses only Riff design tokens (flat design)

La página y sus componentes SHALL estilizarse exclusivamente con las utilities derivadas de los design tokens de Riff (`bg-secondary`, `bg-surface-muted`, `bg-primary`, `text-primary`, `bg-accent`, `text-text`, `text-text-2`, `border-border`, `bg-bg`, `bg-white`, `font-heading`, `font-body`, etc.). SHALL NOT usarse literales hex, clases obsoletas `brand-*`, ni clases `rounded*`/`shadow*` (flat design estricto, radio 0). El remapeo desde la paleta Material del diseño de referencia es: navy → `bg-secondary`; teal `primary` → `text-primary`/`bg-primary`; naranja `secondary-container` → `bg-accent`; superficies de sección → `bg-surface-muted` o `bg-primary-100`; tarjetas → `bg-white` con `border border-border`; mats y controles anidados → `bg-bg`; texto → `text-text`/`text-text-2`.

#### Scenario: Page sections use the muted surface

- **WHEN** la página `/representaciones` se renderiza
- **THEN** las secciones de marcas y de propuesta de valor llevan `bg-surface-muted` como fondo de sección
- **AND** la sección de distribuidores conserva `bg-primary-100`
- **AND** el hero conserva `bg-secondary`

#### Scenario: Cards keep the white content surface

- **WHEN** las tarjetas de marca, distribuidor y propuesta de valor se renderizan
- **THEN** cada tarjeta lleva `bg-white` con `border border-border`
- **AND** los mats internos que lo requieran pueden conservar `bg-bg`

#### Scenario: No raw hex or obsolete brand classes

- **WHEN** los `.astro` de la página y sus componentes se inspeccionan
- **THEN** ninguno contiene literales hex de color (`#XXXXXX`) en clases ni en `style`
- **AND** ninguno contiene clases que empiecen por `bg-brand-`, `text-brand-`, `border-brand-`, etc.

#### Scenario: Flat design (no rounded, no shadow)

- **WHEN** la página se renderiza (estado estático)
- **THEN** el marcado estático contiene `border border-border` en las tarjetas (superficies `bg-white`)
- **AND** no se usan clases `rounded*` ni `shadow*` en las tarjetas de contenido
